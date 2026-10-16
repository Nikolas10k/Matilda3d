import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UsuarioPainel } from "@/server/auth";

export type FiltroCaixa = { de: string; ate: string; tipo?: "entrada" | "saida"; categoria?: string };

export type LancamentoNaLista = {
  id: string;
  data: string;
  tipo: "entrada" | "saida";
  categoria: string;
  descricao: string;
  valorCentavos: number;
  formaPagamento: string | null;
  vendaId: string | null;
  vendaNumero: number | null;
  ehEstorno: boolean;
  comprovante: string | null;
  autor: string | null;
  /** Saldo do caixa logo depois deste lançamento (null se for anterior ao início do caixa). */
  saldoAcumuladoCentavos: number | null;
  podeEditar: boolean;
  podeExcluir: boolean;
};

const UM_DIA_MS = 24 * 60 * 60 * 1000;

export async function obterCaixa(filtro: FiltroCaixa, usuario: UsuarioPainel) {
  const supabase = await createClient();

  const [{ data: config }, { data: todos, error }] = await Promise.all([
    supabase.from("configuracoes").select("saldo_inicial_centavos, data_inicio_caixa").eq("id", 1).single(),
    supabase
      .from("lancamentos")
      .select("id, data, tipo, categoria, descricao, valor_centavos, forma_pagamento, venda_id, estorno_de, comprovante, criado_por, criado_em, vendas(numero), perfis(nome)")
      .lte("data", filtro.ate)
      .order("data")
      .order("criado_em"),
  ]);
  if (error || !config) throw new Error("Não foi possível carregar o caixa.");

  // Saldo acumulado em ordem cronológica, a partir da data de início do caixa (docs/06).
  let saldo = config.saldo_inicial_centavos;
  let saldoAtual = config.saldo_inicial_centavos;
  const comSaldo = (todos ?? []).map((l) => {
    const conta = l.data >= config.data_inicio_caixa;
    if (conta) saldo += l.tipo === "entrada" ? l.valor_centavos : -l.valor_centavos;
    return { ...l, saldoAcumulado: conta ? saldo : null };
  });
  saldoAtual = saldo;

  const agora = Date.now();
  const doPeriodo = comSaldo.filter((l) => l.data >= filtro.de && l.data <= filtro.ate);
  const entradas = doPeriodo.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valor_centavos, 0);
  const saidas = doPeriodo.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valor_centavos, 0);

  const lancamentos: LancamentoNaLista[] = doPeriodo
    .filter((l) => (!filtro.tipo || l.tipo === filtro.tipo) && (!filtro.categoria || l.categoria === filtro.categoria))
    .reverse()
    .map((l) => {
      const manual = !l.venda_id && !l.estorno_de;
      const dentroDe24h = agora - new Date(l.criado_em).getTime() < UM_DIA_MS;
      return {
        id: l.id,
        data: l.data,
        tipo: l.tipo as "entrada" | "saida",
        categoria: l.categoria,
        descricao: l.descricao,
        valorCentavos: l.valor_centavos,
        formaPagamento: l.forma_pagamento,
        vendaId: l.venda_id,
        vendaNumero: l.vendas?.numero ?? null,
        ehEstorno: Boolean(l.estorno_de),
        comprovante: l.comprovante,
        autor: l.perfis?.nome ?? null,
        saldoAcumuladoCentavos: l.saldoAcumulado,
        // Mesmas regras do RLS (lanc_upd / lanc_del); a interface só esconde os botões.
        podeEditar: manual && (usuario.papel === "admin" || (l.criado_por === usuario.id && dentroDe24h)),
        podeExcluir: manual && usuario.papel === "admin",
      };
    });

  return {
    // Se o filtro termina antes de hoje, o "saldo atual" vem da view (inclui tudo).
    saldoAtualCentavos: saldoAtual,
    entradasCentavos: entradas,
    saidasCentavos: saidas,
    lancamentos,
    dataInicioCaixa: config.data_inicio_caixa,
  };
}

export async function obterSaldoAtual(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("vw_saldo_caixa").select("saldo_centavos").maybeSingle();
  return Number(data?.saldo_centavos ?? 0);
}

export async function obterLancamento(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("lancamentos").select("*").eq("id", id).maybeSingle();
  return data;
}
