import "server-only";
import type { StatusEncomenda } from "@/lib/encomenda";
import { createClient } from "@/lib/supabase/server";

export const BUCKET_REFERENCIAS = "referencias-encomendas";

export type EncomendaNaLista = {
  id: string;
  numero: number;
  nomeContato: string;
  tipo: string;
  quantidade: number;
  status: StatusEncomenda;
  dataDesejada: string | null;
  valorOrcadoCentavos: number | null;
  criadoEm: string;
  temImagem: boolean;
  vendaNumero: number | null;
};

export async function listarEncomendas(): Promise<EncomendaNaLista[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("encomendas")
    .select("id, numero, nome_contato, tipo, quantidade, status, data_desejada, valor_orcado_centavos, criado_em, imagem_referencia, vendas!encomendas_venda_id_fkey(numero, cancelada)")
    .order("criado_em", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as encomendas.");

  return (data ?? []).map((e) => ({
    id: e.id,
    numero: e.numero,
    nomeContato: e.nome_contato,
    tipo: e.tipo,
    quantidade: e.quantidade,
    status: e.status as StatusEncomenda,
    dataDesejada: e.data_desejada,
    valorOrcadoCentavos: e.valor_orcado_centavos,
    criadoEm: e.criado_em,
    temImagem: Boolean(e.imagem_referencia),
    vendaNumero: e.vendas && !e.vendas.cancelada ? e.vendas.numero : null,
  }));
}

export async function obterEncomenda(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("encomendas")
    .select(
      "*, clientes(id, nome, whatsapp, instagram), vendas!encomendas_venda_id_fkey(id, numero, cancelada, total_centavos, status_pagamento), encomenda_historico(status_anterior, status_novo, criado_em, perfis(nome))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  let urlImagem: string | null = null;
  if (data.imagem_referencia) {
    const { data: assinada } = await supabase.storage.from(BUCKET_REFERENCIAS).createSignedUrl(data.imagem_referencia, 600);
    urlImagem = assinada?.signedUrl ?? null;
  }

  return {
    ...data,
    status: data.status as StatusEncomenda,
    urlImagem,
    historico: [...data.encomenda_historico].sort((a, b) => b.criado_em.localeCompare(a.criado_em)),
  };
}
