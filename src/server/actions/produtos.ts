"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_PRODUTOS } from "@/lib/storage";
import { esquemaProduto } from "@/lib/validacao/produto";
import { ehAdmin, exigirEquipe } from "@/server/auth";

export type ResultadoAcao =
  | { ok: true; id: string }
  | { ok: false; erro: string; campos?: Record<string, string> };

/** Atualiza o site público depois de mudar um produto (docs/04). */
function revalidarSite(...slugs: (string | null | undefined)[]) {
  updateTag("produtos");
  revalidatePath("/");
  revalidatePath("/produtos");
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/produtos/${slug}`);
  revalidatePath("/admin/produtos");
}

export async function salvarProduto(valores: unknown): Promise<ResultadoAcao> {
  await exigirEquipe();

  const dados = esquemaProduto.safeParse(valores);
  if (!dados.success) {
    const campos: Record<string, string> = {};
    for (const i of dados.error.issues) campos[String(i.path[0])] ??= i.message;
    return { ok: false, erro: "Confira os campos destacados.", campos };
  }
  const p = dados.data;

  // Cada produto só pode usar fotos da própria pasta no Storage.
  if (p.fotos.some((caminho) => !caminho.startsWith(`${p.id}/`))) {
    return { ok: false, erro: "Uma das fotos não pertence a este produto. Envie as fotos de novo." };
  }

  const supabase = await createClient();
  const { data: existente } = await supabase
    .from("produtos")
    .select("slug, produto_fotos(caminho)")
    .eq("id", p.id)
    .maybeSingle();

  const linha = {
    nome: p.nome,
    slug: p.slug,
    categoria_id: p.categoriaId,
    descricao_curta: p.descricaoCurta || null,
    descricao: p.descricao || null,
    preco_centavos: p.preco,
    custo_centavos: p.custo,
    gramas_filamento: p.gramas,
    minutos_impressao: p.minutosImpressao,
    cores: p.cores,
    ativo: p.ativo,
    destaque: p.destaque,
  };

  const { error } = existente
    ? await supabase.from("produtos").update(linha).eq("id", p.id)
    : await supabase.from("produtos").insert({ id: p.id, ...linha });

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        erro: "Já existe um produto com esse endereço.",
        campos: { slug: "Já existe um produto com esse endereço. Mude o final, ex.: chaveiro-com-nome-2." },
      };
    }
    return { ok: false, erro: "Não foi possível salvar o produto. Tente de novo." };
  }

  // Fotos: regrava a lista na ordem escolhida e apaga do Storage as removidas.
  const fotosAntigas = existente?.produto_fotos.map((f) => f.caminho) ?? [];
  const removidas = fotosAntigas.filter((c) => !p.fotos.includes(c));

  const { error: erroApagarFotos } = await supabase.from("produto_fotos").delete().eq("produto_id", p.id);
  const { error: erroFotos } = p.fotos.length
    ? await supabase
        .from("produto_fotos")
        .insert(p.fotos.map((caminho, ordem) => ({ produto_id: p.id, caminho, ordem })))
    : { error: null };
  if (erroApagarFotos || erroFotos) {
    return { ok: false, erro: "O produto foi salvo, mas houve um erro com as fotos. Tente salvar de novo." };
  }
  if (removidas.length) await supabase.storage.from(BUCKET_PRODUTOS).remove(removidas);

  revalidarSite(existente?.slug, p.slug);
  return { ok: true, id: p.id };
}

export async function excluirProduto(id: string): Promise<ResultadoAcao> {
  const usuario = await exigirEquipe();
  if (!ehAdmin(usuario)) {
    return { ok: false, erro: "Só a responsável pode excluir produtos. Você pode desativar o produto." };
  }

  const supabase = await createClient();
  const { data: produto } = await supabase
    .from("produtos")
    .select("slug, produto_fotos(caminho)")
    .eq("id", id)
    .maybeSingle();
  if (!produto) return { ok: false, erro: "Produto não encontrado." };

  const { error } = await supabase.from("produtos").delete().eq("id", id);
  if (error) return { ok: false, erro: "Não foi possível excluir o produto." };

  const fotos = produto.produto_fotos.map((f) => f.caminho);
  if (fotos.length) await supabase.storage.from(BUCKET_PRODUTOS).remove(fotos);

  revalidarSite(produto.slug);
  return { ok: true, id };
}
