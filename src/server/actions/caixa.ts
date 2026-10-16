"use server";

import { revalidatePath } from "next/cache";
import { BUCKET_COMPROVANTES } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { esquemaLancamento } from "@/lib/validacao/caixa";
import { errosPorCampo } from "@/lib/validacao/comum";
import { ehAdmin, exigirEquipe } from "@/server/auth";

export type ResultadoCaixa = { ok: true } | { ok: false; erro: string; campos?: Record<string, string> };

function revalidar() {
  revalidatePath("/admin");
  revalidatePath("/admin/caixa");
}

export async function salvarLancamento(valores: unknown): Promise<ResultadoCaixa> {
  const usuario = await exigirEquipe();
  const r = esquemaLancamento.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };
  const l = r.data;

  if (l.comprovante && !l.comprovante.startsWith(`${usuario.id}/`) && !l.id) {
    return { ok: false, erro: "Envie o comprovante de novo." };
  }

  const linha = {
    tipo: l.tipo,
    data: l.data,
    descricao: l.descricao,
    categoria: l.categoria,
    valor_centavos: l.valor,
    forma_pagamento: l.forma || null,
    comprovante: l.comprovante || null,
  };

  const supabase = await createClient();
  if (l.id) {
    const { data, error } = await supabase.from("lancamentos").update(linha).eq("id", l.id).select("id");
    if (error) return { ok: false, erro: "Não foi possível salvar o lançamento." };
    if (!data?.length) {
      return {
        ok: false,
        erro: "Você só pode editar os seus lançamentos nas primeiras 24 horas. Depois disso, peça para a responsável.",
      };
    }
  } else {
    const { error } = await supabase.from("lancamentos").insert({ ...linha, criado_por: usuario.id });
    if (error) return { ok: false, erro: "Não foi possível salvar o lançamento." };
  }

  revalidar();
  return { ok: true };
}

export async function excluirLancamento(id: string): Promise<ResultadoCaixa> {
  const usuario = await exigirEquipe();
  if (!ehAdmin(usuario)) return { ok: false, erro: "Só a responsável pode excluir lançamentos." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("lancamentos").delete().eq("id", id).select("comprovante");
  if (error || !data?.length) {
    return { ok: false, erro: "Este lançamento não pode ser excluído (lançamentos de venda e estornos ficam no caixa)." };
  }
  const comprovante = data[0].comprovante;
  if (comprovante) await supabase.storage.from(BUCKET_COMPROVANTES).remove([comprovante]);

  revalidar();
  return { ok: true };
}

/** Link temporário (5 minutos) para ver um comprovante; o bucket é privado. */
export async function linkComprovante(caminho: string): Promise<string | null> {
  await exigirEquipe();
  const supabase = await createClient();
  const { data } = await supabase.storage.from(BUCKET_COMPROVANTES).createSignedUrl(caminho, 300);
  return data?.signedUrl ?? null;
}
