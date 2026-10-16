import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Canal, FormaPagamento, StatusPagamento } from "@/lib/venda";

export type FiltroVendas = {
  de: string;
  ate: string;
  status?: StatusPagamento | "cancelada";
  canal?: Canal;
  forma?: FormaPagamento;
};

export type VendaNaLista = {
  id: string;
  numero: number;
  data: string;
  cliente: string | null;
  itens: string;
  totalCentavos: number;
  pagoCentavos: number;
  status: StatusPagamento;
  cancelada: boolean;
  canal: string;
};

export async function listarVendas(filtro: FiltroVendas) {
  const supabase = await createClient();
  const colunas =
    "id, numero, data_venda, total_centavos, pago_centavos, status_pagamento, cancelada, canal, clientes(nome), venda_itens(descricao, quantidade)";

  let consulta = filtro.forma
    ? supabase.from("vendas").select(`${colunas}, venda_pagamentos!inner(forma)`).eq("venda_pagamentos.forma", filtro.forma)
    : supabase.from("vendas").select(colunas);

  consulta = consulta
    .gte("data_venda", filtro.de)
    .lte("data_venda", filtro.ate)
    .order("data_venda", { ascending: false })
    .order("numero", { ascending: false });

  if (filtro.status === "cancelada") consulta = consulta.eq("cancelada", true);
  else if (filtro.status) consulta = consulta.eq("status_pagamento", filtro.status).eq("cancelada", false);
  if (filtro.canal) consulta = consulta.eq("canal", filtro.canal);

  const { data, error } = await consulta;
  if (error) throw new Error("Não foi possível carregar as vendas.");

  const vendas: VendaNaLista[] = (data ?? []).map((v) => ({
    id: v.id,
    numero: v.numero,
    data: v.data_venda,
    cliente: v.clientes?.nome ?? null,
    itens: v.venda_itens.map((i) => `${i.quantidade}x ${i.descricao}`).join(", "),
    totalCentavos: v.total_centavos,
    pagoCentavos: v.pago_centavos,
    status: v.status_pagamento as StatusPagamento,
    cancelada: v.cancelada,
    canal: v.canal,
  }));

  // Vendas canceladas saem dos totais (docs/06).
  const validas = vendas.filter((v) => !v.cancelada);
  const totais = {
    quantidade: validas.length,
    totalCentavos: validas.reduce((s, v) => s + v.totalCentavos, 0),
    pagoCentavos: validas.reduce((s, v) => s + v.pagoCentavos, 0),
  };
  return { vendas, totais: { ...totais, abertoCentavos: totais.totalCentavos - totais.pagoCentavos } };
}

export async function obterVenda(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendas")
    .select(
      "*, clientes(id, nome, whatsapp, instagram), encomendas!vendas_encomenda_fk(id, numero), venda_itens(*), venda_pagamentos(*), perfis(nome)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    venda_itens: [...data.venda_itens].sort((a, b) => a.descricao.localeCompare(b.descricao)),
    venda_pagamentos: [...data.venda_pagamentos].sort((a, b) => a.criado_em.localeCompare(b.criado_em)),
  };
}

export type VendaDetalhe = NonNullable<Awaited<ReturnType<typeof obterVenda>>>;

export async function listarProdutosParaVenda() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos")
    .select("id, nome, preco_centavos, cores")
    .eq("ativo", true)
    .order("nome");
  return data ?? [];
}

export async function listarEncomendasParaVincular() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("encomendas")
    .select("id, numero, nome_contato, tipo, quantidade, valor_orcado_centavos, cliente_id, status")
    .in("status", ["aprovada", "em_producao", "pronta", "entregue"])
    .is("venda_id", null)
    .order("numero", { ascending: false });
  return data ?? [];
}
