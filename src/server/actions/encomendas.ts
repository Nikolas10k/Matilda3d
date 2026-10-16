"use server";

import { revalidatePath } from "next/cache";
import { erroMudancaStatus, type StatusEncomenda } from "@/lib/encomenda";
import { createClient } from "@/lib/supabase/server";
import { errosPorCampo } from "@/lib/validacao/comum";
import { esquemaCliente, esquemaEdicaoEncomenda } from "@/lib/validacao/encomenda";
import { exigirEquipe } from "@/server/auth";

export type Resultado = { ok: true; id?: string } | { ok: false; erro: string; campos?: Record<string, string> };

function revalidarEncomenda(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/encomendas");
  revalidatePath(`/admin/encomendas/${id}`);
}

export async function atualizarEncomenda(valores: unknown): Promise<Resultado> {
  await exigirEquipe();
  const r = esquemaEdicaoEncomenda.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };

  const supabase = await createClient();
  const { data: atual } = await supabase.from("encomendas").select("status").eq("id", r.data.id).maybeSingle();
  if (!atual) return { ok: false, erro: "Encomenda não encontrada." };
  const erro = erroMudancaStatus(atual.status as StatusEncomenda, r.data.status);
  if (erro) return { ok: false, erro, campos: { status: erro } };

  const { error } = await supabase
    .from("encomendas")
    .update({
      status: r.data.status,
      valor_orcado_centavos: r.data.valorOrcado,
      previsao_entrega: r.data.previsaoEntrega,
      notas_internas: r.data.notasInternas || null,
    })
    .eq("id", r.data.id);
  if (error) return { ok: false, erro: "Não foi possível salvar a encomenda." };

  revalidarEncomenda(r.data.id);
  return { ok: true };
}

/** Mudança rápida de status (botão "Avançar" no quadro). O histórico é gravado pelo gatilho do banco. */
export async function mudarStatusEncomenda(id: string, status: StatusEncomenda): Promise<Resultado> {
  await exigirEquipe();
  const supabase = await createClient();
  const { data: atual } = await supabase.from("encomendas").select("status").eq("id", id).maybeSingle();
  if (!atual) return { ok: false, erro: "Encomenda não encontrada." };
  const erro = erroMudancaStatus(atual.status as StatusEncomenda, status);
  if (erro) return { ok: false, erro };

  const { error } = await supabase.from("encomendas").update({ status }).eq("id", id);
  if (error) return { ok: false, erro: "Não foi possível mudar o status." };
  revalidarEncomenda(id);
  return { ok: true };
}

export async function salvarCliente(valores: unknown): Promise<Resultado> {
  await exigirEquipe();
  const r = esquemaCliente.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };
  const c = r.data;

  const supabase = await createClient();
  const linha = { nome: c.nome, whatsapp: c.whatsapp, instagram: c.instagram };
  const resposta = c.id
    ? await supabase.from("clientes").update(linha).eq("id", c.id).select("id").single()
    : await supabase.from("clientes").insert(linha).select("id").single();

  if (resposta.error) {
    if (resposta.error.code === "23505") {
      const msg = "Já existe um cliente com esse WhatsApp.";
      return { ok: false, erro: msg, campos: { whatsapp: msg } };
    }
    return { ok: false, erro: "Não foi possível salvar o cliente." };
  }

  revalidatePath("/admin/clientes");
  revalidatePath(`/admin/clientes/${resposta.data.id}`);
  return { ok: true, id: resposta.data.id };
}
