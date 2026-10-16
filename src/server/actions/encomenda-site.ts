"use server";

import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { errosPorCampo } from "@/lib/validacao/comum";
import { criarEsquemaEncomenda, erroImagem } from "@/lib/validacao/encomenda-site";
import { BUCKET_REFERENCIAS } from "@/server/encomendas";

export type ResultadoEncomendaSite =
  | { ok: true; numero: number | null }
  | { ok: false; erro: string; campos?: Record<string, string> };

/** Hash do IP (nunca guardamos o IP em si — LGPD). */
async function chaveDoVisitante(): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
  const sal = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "matilda3d";
  return createHash("sha256").update(`${sal}:${ip}`).digest("hex");
}

/**
 * Recebe o formulário de encomenda do site (docs/03): valida, barra robôs
 * (honeypot + 3 envios por IP a cada 10 min), guarda a imagem no bucket
 * privado, cria ou reaproveita o cliente pelo WhatsApp e grava a encomenda
 * como "nova". Tudo com a service_role, porque visitantes não escrevem no banco.
 */
export async function enviarEncomenda(formData: FormData): Promise<ResultadoEncomendaSite> {
  // Honeypot: campo invisível que só robôs preenchem. Finge sucesso para não dar pistas.
  if (String(formData.get("empresa") ?? "").trim() !== "") return { ok: true, numero: null };

  const dados = criarEsquemaEncomenda().safeParse({
    nome: formData.get("nome") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    tipo: formData.get("tipo") ?? "",
    quantidade: formData.get("quantidade") ?? "",
    descricao: formData.get("descricao") ?? "",
    cores: formData.get("cores") ?? "",
    dataDesejada: formData.get("dataDesejada") ?? "",
    consentimento: formData.get("consentimento") === "on",
  });
  if (!dados.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(dados.error) };

  const imagem = formData.get("imagem");
  const arquivo = imagem instanceof File && imagem.size > 0 ? imagem : null;
  const problemaImagem = erroImagem(arquivo);
  if (problemaImagem) return { ok: false, erro: problemaImagem, campos: { imagem: problemaImagem } };

  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    return { ok: false, erro: "Não foi possível enviar agora. Tente de novo ou fale com a gente pelo WhatsApp." };
  }

  // Limite de envios (migração limite_envios). Se a função ainda não existir no banco, segue sem limitar.
  const { data: permitido, error: erroLimite } = await supabase.rpc("consumir_limite_envio", { p_chave: await chaveDoVisitante() });
  if (erroLimite) console.warn("[encomenda] limite de envios indisponível:", erroLimite.message);
  else if (permitido === false) {
    return { ok: false, erro: "Você enviou várias encomendas seguidas. Espere alguns minutos e tente de novo." };
  }

  const e = dados.data;

  let caminhoImagem: string | null = null;
  if (arquivo) {
    const extensao = arquivo.type === "image/png" ? "png" : arquivo.type === "image/webp" ? "webp" : "jpg";
    caminhoImagem = `${randomUUID()}.${extensao}`;
    const { error } = await supabase.storage.from(BUCKET_REFERENCIAS).upload(caminhoImagem, arquivo, { contentType: arquivo.type });
    if (error) return { ok: false, erro: "Não conseguimos enviar a imagem. Tente outra ou envie sem imagem.", campos: { imagem: "Tente outra imagem." } };
  }

  // Cliente: reaproveita pelo WhatsApp normalizado (docs/06) para não duplicar.
  const { data: existente } = await supabase.from("clientes").select("id").eq("whatsapp", e.whatsapp).maybeSingle();
  let clienteId = existente?.id ?? null;
  if (!clienteId) {
    const { data: novo } = await supabase.from("clientes").insert({ nome: e.nome, whatsapp: e.whatsapp }).select("id").single();
    clienteId = novo?.id ?? null;
  }

  const { data: encomenda, error } = await supabase
    .from("encomendas")
    .insert({
      cliente_id: clienteId,
      nome_contato: e.nome,
      whatsapp: e.whatsapp,
      tipo: e.tipo,
      quantidade: e.quantidade,
      descricao: e.descricao,
      cores: e.cores || null,
      data_desejada: e.dataDesejada,
      imagem_referencia: caminhoImagem,
      consentimento_contato: e.consentimento,
    })
    .select("numero")
    .single();

  if (error || !encomenda) {
    if (caminhoImagem) await supabase.storage.from(BUCKET_REFERENCIAS).remove([caminhoImagem]);
    return { ok: false, erro: "Não foi possível enviar agora. Tente de novo ou fale com a gente pelo WhatsApp." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/encomendas");
  return { ok: true, numero: encomenda.numero };
}
