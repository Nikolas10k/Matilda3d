import "server-only";
import {
  indicadores,
  lucroBruto,
  maisVendidos,
  resumoMensal,
  saidasPorCategoria,
  type ConfigCaixa,
  type LancamentoBase,
  type Periodo,
  type VendaBase,
} from "@/lib/dashboard";
import { dataIsoSaoPaulo } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { StatusPagamento } from "@/lib/venda";

/** Dados financeiros brutos (lançamentos e vendas) já no formato das funções de @/lib/dashboard. */
async function carregarBase() {
  const supabase = await createClient();
  const [{ data: config }, { data: lancamentos }, { data: vendas }] = await Promise.all([
    supabase.from("configuracoes").select("saldo_inicial_centavos, data_inicio_caixa").eq("id", 1).single(),
    supabase.from("lancamentos").select("data, tipo, categoria, valor_centavos"),
    supabase.from("vendas").select("data_venda, total_centavos, pago_centavos, cancelada"),
  ]);
  if (!config) throw new Error("Não foi possível carregar o dashboard.");

  const base = {
    config: { saldoInicialCentavos: config.saldo_inicial_centavos, dataInicioCaixa: config.data_inicio_caixa } satisfies ConfigCaixa,
    lancamentos: (lancamentos ?? []).map(
      (l): LancamentoBase => ({ data: l.data, tipo: l.tipo as "entrada" | "saida", categoria: l.categoria, valorCentavos: l.valor_centavos }),
    ),
    vendas: (vendas ?? []).map(
      (v): VendaBase => ({ data: v.data_venda, totalCentavos: v.total_centavos, pagoCentavos: v.pago_centavos, cancelada: v.cancelada }),
    ),
    hoje: dataIsoSaoPaulo(),
  };
  return { supabase, base };
}

export async function obterDashboard(periodo: Periodo) {
  const { supabase, base } = await carregarBase();
  const daqui7Dias = dataIsoSaoPaulo(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [{ data: itens }, { data: cliques }, { data: encomendas }, { data: ultimas }] = await Promise.all([
    supabase
      .from("venda_itens")
      .select("produto_id, descricao, quantidade, total_centavos, custo_unitario_centavos, produtos(nome), vendas!inner(data_venda, cancelada)")
      .eq("vendas.cancelada", false)
      .gte("vendas.data_venda", periodo.de)
      .lte("vendas.data_venda", periodo.ate),
    supabase
      .from("cliques_whatsapp")
      .select("produto_id, produtos(nome)")
      .not("produto_id", "is", null)
      .gte("criado_em", `${periodo.de}T00:00:00-03:00`)
      .lte("criado_em", `${periodo.ate}T23:59:59-03:00`),
    supabase
      .from("encomendas")
      .select("id, numero, nome_contato, tipo, status, data_desejada, criado_em")
      .or(`status.eq.nova,and(data_desejada.gte.${base.hoje},data_desejada.lte.${daqui7Dias},status.not.in.(entregue,cancelada))`)
      .order("data_desejada", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("vendas")
      .select("id, numero, data_venda, total_centavos, status_pagamento, cancelada, clientes(nome)")
      .order("criado_em", { ascending: false })
      .order("numero", { ascending: false })
      .limit(5),
  ]);

  const itensBase = (itens ?? []).map((i) => ({
    produtoId: i.produto_id,
    nome: i.produtos?.nome ?? i.descricao,
    descricao: i.descricao,
    quantidade: i.quantidade,
    totalCentavos: i.total_centavos ?? 0,
    custoUnitarioCentavos: i.custo_unitario_centavos,
  }));

  const procurados = new Map<string, { nome: string; cliques: number }>();
  for (const c of cliques ?? []) {
    if (!c.produto_id) continue;
    const atual = procurados.get(c.produto_id) ?? { nome: c.produtos?.nome ?? "Produto removido", cliques: 0 };
    atual.cliques += 1;
    procurados.set(c.produto_id, atual);
  }

  return {
    indicadores: indicadores(periodo, base),
    lucro: lucroBruto(itensBase),
    meses: resumoMensal(base, 6),
    categorias: saidasPorCategoria(base.lancamentos, periodo),
    maisVendidos: maisVendidos(itensBase),
    maisProcurados: [...procurados.values()].sort((a, b) => b.cliques - a.cliques).slice(0, 5),
    encomendas: encomendas ?? [],
    ultimasVendas: (ultimas ?? []).map((v) => ({
      id: v.id,
      numero: v.numero,
      data: v.data_venda,
      totalCentavos: v.total_centavos,
      status: v.status_pagamento as StatusPagamento,
      cancelada: v.cancelada,
      cliente: v.clientes?.nome ?? null,
    })),
    hoje: base.hoje,
  };
}

export async function obterRelatorioMensal(meses = 12) {
  const { base } = await carregarBase();
  return resumoMensal(base, meses).reverse(); // mais recente primeiro
}
