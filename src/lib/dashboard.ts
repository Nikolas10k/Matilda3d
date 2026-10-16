// Contas do dashboard e do relatório mensal (docs/04 e docs/06), em funções
// puras: recebem as linhas do banco e devolvem os números já prontos.
// Regime de caixa: entradas e saídas vêm dos lançamentos; vendas contam pela data da venda.

export type LancamentoBase = { data: string; tipo: "entrada" | "saida"; categoria: string; valorCentavos: number };
export type VendaBase = { data: string; totalCentavos: number; pagoCentavos: number; cancelada: boolean };
export type ItemBase = {
  produtoId: string | null;
  descricao: string;
  quantidade: number;
  totalCentavos: number;
  custoUnitarioCentavos: number | null;
};
export type ConfigCaixa = { saldoInicialCentavos: number; dataInicioCaixa: string };
export type Periodo = { de: string; ate: string };

const dentro = (data: string, p: Periodo) => data >= p.de && data <= p.ate;
const sinal = (l: LancamentoBase) => (l.tipo === "entrada" ? l.valorCentavos : -l.valorCentavos);

/** Saldo em caixa = saldo inicial + entradas − saídas, desde a data de início, até `ate` (inclusive). */
export function saldoAte(lancamentos: LancamentoBase[], config: ConfigCaixa, ate: string): number {
  return lancamentos
    .filter((l) => l.data >= config.dataInicioCaixa && l.data <= ate)
    .reduce((saldo, l) => saldo + sinal(l), config.saldoInicialCentavos);
}

export function indicadores(
  periodo: Periodo,
  dados: { lancamentos: LancamentoBase[]; vendas: VendaBase[]; config: ConfigCaixa; hoje: string },
) {
  const doPeriodo = dados.lancamentos.filter((l) => dentro(l.data, periodo));
  const entradas = doPeriodo.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valorCentavos, 0);
  const saidas = doPeriodo.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valorCentavos, 0);

  const vendasValidas = dados.vendas.filter((v) => !v.cancelada && dentro(v.data, periodo));
  const faturamento = vendasValidas.reduce((s, v) => s + v.totalCentavos, 0);

  // "A receber" é o que está em aberto agora, em qualquer venda não cancelada.
  const aReceber = dados.vendas
    .filter((v) => !v.cancelada)
    .reduce((s, v) => s + Math.max(0, v.totalCentavos - v.pagoCentavos), 0);

  return {
    entradasCentavos: entradas,
    saidasCentavos: saidas,
    resultadoCentavos: entradas - saidas,
    saldoCaixaCentavos: saldoAte(dados.lancamentos, dados.config, dados.hoje),
    quantidadeVendas: vendasValidas.length,
    faturamentoCentavos: faturamento,
    ticketMedioCentavos: vendasValidas.length ? Math.round(faturamento / vendasValidas.length) : 0,
    aReceberCentavos: aReceber,
  };
}

/** Lucro bruto estimado = Σ (preço − custo) × qtd dos itens com custo conhecido (docs/06). */
export function lucroBruto(itens: ItemBase[]) {
  const comCusto = itens.filter((i) => i.custoUnitarioCentavos != null);
  return {
    lucroCentavos: comCusto.reduce((s, i) => s + i.totalCentavos - (i.custoUnitarioCentavos as number) * i.quantidade, 0),
    itensSemCusto: itens.length - comCusto.length,
  };
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Os `quantidade` meses terminando no mês de `hoje`, em ordem cronológica ("2026-10"). */
export function ultimosMeses(hoje: string, quantidade: number): string[] {
  const [ano, mes] = hoje.split("-").map(Number);
  return Array.from({ length: quantidade }, (_, i) => {
    const total = ano * 12 + (mes - 1) - (quantidade - 1 - i);
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  });
}

function ultimoDiaDoMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, "0")}`;
}

export function rotuloMes(mes: string, comAno = false): string {
  const [a, m] = mes.split("-").map(Number);
  return comAno ? `${MESES[m - 1]}/${String(a).slice(2)}` : MESES[m - 1];
}

export type LinhaMensal = {
  mes: string;
  rotulo: string;
  entradasCentavos: number;
  saidasCentavos: number;
  resultadoCentavos: number;
  /** Saldo em caixa no fim do mês (ou hoje, no mês corrente). */
  saldoCentavos: number;
  quantidadeVendas: number;
  ticketMedioCentavos: number;
};

/** Resumo mês a mês (gráficos do dashboard e tabela de relatórios). */
export function resumoMensal(
  dados: { lancamentos: LancamentoBase[]; vendas: VendaBase[]; config: ConfigCaixa; hoje: string },
  quantidadeMeses: number,
): LinhaMensal[] {
  return ultimosMeses(dados.hoje, quantidadeMeses).map((mes) => {
    const doMes = dados.lancamentos.filter((l) => l.data.startsWith(mes));
    const entradas = doMes.filter((l) => l.tipo === "entrada").reduce((s, l) => s + l.valorCentavos, 0);
    const saidas = doMes.filter((l) => l.tipo === "saida").reduce((s, l) => s + l.valorCentavos, 0);
    const vendas = dados.vendas.filter((v) => !v.cancelada && v.data.startsWith(mes));
    const faturamento = vendas.reduce((s, v) => s + v.totalCentavos, 0);
    const fim = ultimoDiaDoMes(mes);
    return {
      mes,
      rotulo: rotuloMes(mes, quantidadeMeses > 6),
      entradasCentavos: entradas,
      saidasCentavos: saidas,
      resultadoCentavos: entradas - saidas,
      saldoCentavos: saldoAte(dados.lancamentos, dados.config, fim < dados.hoje ? fim : dados.hoje),
      quantidadeVendas: vendas.length,
      ticketMedioCentavos: vendas.length ? Math.round(faturamento / vendas.length) : 0,
    };
  });
}

/** Saídas do período agrupadas por categoria, da maior para a menor. */
export function saidasPorCategoria(lancamentos: LancamentoBase[], periodo: Periodo) {
  const somas = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.tipo === "saida" && dentro(l.data, periodo)) somas.set(l.categoria, (somas.get(l.categoria) ?? 0) + l.valorCentavos);
  }
  const total = [...somas.values()].reduce((s, v) => s + v, 0);
  return [...somas.entries()]
    .map(([categoria, valorCentavos]) => ({ categoria, valorCentavos, fracao: total ? valorCentavos / total : 0 }))
    .sort((a, b) => b.valorCentavos - a.valorCentavos || a.categoria.localeCompare(b.categoria));
}

/** Produtos mais vendidos (itens de vendas não canceladas), por quantidade. */
export function maisVendidos(itens: (ItemBase & { nome: string })[], limite = 5) {
  const porProduto = new Map<string, { nome: string; quantidade: number; totalCentavos: number }>();
  for (const i of itens) {
    const chave = i.produtoId ?? `livre:${i.descricao.toLowerCase()}`;
    const atual = porProduto.get(chave) ?? { nome: i.nome, quantidade: 0, totalCentavos: 0 };
    atual.quantidade += i.quantidade;
    atual.totalCentavos += i.totalCentavos;
    porProduto.set(chave, atual);
  }
  return [...porProduto.values()]
    .sort((a, b) => b.quantidade - a.quantidade || b.totalCentavos - a.totalCentavos || a.nome.localeCompare(b.nome))
    .slice(0, limite);
}
