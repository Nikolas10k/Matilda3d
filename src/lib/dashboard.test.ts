// "Planilha de conferência" do dashboard (critério de aceite da Fase 5): um
// conjunto de dados de teste com os totais calculados à mão em cada comentário.
import { describe, expect, it } from "vitest";
import {
  indicadores,
  lucroBruto,
  maisVendidos,
  resumoMensal,
  saidasPorCategoria,
  saldoAte,
  ultimosMeses,
  type LancamentoBase,
  type VendaBase,
} from "./dashboard";

const CONFIG = { saldoInicialCentavos: 10000, dataInicioCaixa: "2026-08-01" }; // começa com R$ 100,00
const HOJE = "2026-10-15";

// Lançamentos (como no livro caixa)
const L = (data: string, tipo: "entrada" | "saida", categoria: string, reais: number): LancamentoBase => ({
  data,
  tipo,
  categoria,
  valorCentavos: Math.round(reais * 100),
});
const LANCAMENTOS: LancamentoBase[] = [
  L("2026-07-20", "entrada", "Aporte", 999), // antes do início do caixa: não entra no saldo
  L("2026-08-05", "saida", "Filamento", 120), // agosto
  L("2026-08-10", "entrada", "Venda", 45),
  L("2026-09-02", "entrada", "Venda", 80), // setembro
  L("2026-09-15", "saida", "Embalagem", 20),
  L("2026-10-01", "entrada", "Venda", 30), // outubro
  L("2026-10-03", "entrada", "Venda", 50),
  L("2026-10-05", "saida", "Estorno de venda", 30),
  L("2026-10-08", "saida", "Filamento", 95),
  L("2026-10-10", "saida", "Divulgação", 15),
  L("2026-10-20", "entrada", "Aporte", 500), // depois de hoje: fora do saldo atual
];

const V = (data: string, total: number, pago: number, cancelada = false): VendaBase => ({
  data,
  totalCentavos: total * 100,
  pagoCentavos: pago * 100,
  cancelada,
});
const VENDAS: VendaBase[] = [
  V("2026-08-10", 45, 45),
  V("2026-09-02", 80, 80),
  V("2026-10-01", 30, 30, true), // cancelada (gerou o estorno de 05/10)
  V("2026-10-03", 75, 50), // falta R$ 25
  V("2026-10-12", 40, 0), // pendente: falta R$ 40
];

const OUTUBRO = { de: "2026-10-01", ate: "2026-10-31" };

describe("indicadores de outubro", () => {
  const r = indicadores(OUTUBRO, { lancamentos: LANCAMENTOS, vendas: VENDAS, config: CONFIG, hoje: HOJE });

  it("entradas, saídas e resultado do período", () => {
    // entradas: 30 + 50 + 500 (dia 20, ainda no período) = 580
    expect(r.entradasCentavos).toBe(58000);
    // saídas: 30 + 95 + 15 = 140
    expect(r.saidasCentavos).toBe(14000);
    expect(r.resultadoCentavos).toBe(44000);
  });

  it("saldo em caixa até hoje", () => {
    // 100 − 120 + 45 + 80 − 20 + 30 + 50 − 30 − 95 − 15 = 25 (o aporte de julho e o de 20/10 ficam fora)
    expect(r.saldoCaixaCentavos).toBe(2500);
  });

  it("vendas, ticket médio e a receber", () => {
    // vendas de outubro não canceladas: 75 e 40 → 2 vendas, faturamento 115, ticket 57,50
    expect(r.quantidadeVendas).toBe(2);
    expect(r.faturamentoCentavos).toBe(11500);
    expect(r.ticketMedioCentavos).toBe(5750);
    // a receber (todas as vendas não canceladas): 25 + 40 = 65
    expect(r.aReceberCentavos).toBe(6500);
  });

  it("período sem vendas não divide por zero", () => {
    const vazio = indicadores({ de: "2026-01-01", ate: "2026-01-31" }, { lancamentos: [], vendas: [], config: CONFIG, hoje: HOJE });
    expect(vazio.ticketMedioCentavos).toBe(0);
    expect(vazio.saldoCaixaCentavos).toBe(10000);
  });
});

describe("resumoMensal (gráficos e relatório)", () => {
  it("últimos 3 meses com saldo no fim de cada mês", () => {
    const meses = resumoMensal({ lancamentos: LANCAMENTOS, vendas: VENDAS, config: CONFIG, hoje: HOJE }, 3);
    expect(meses.map((m) => [m.mes, m.entradasCentavos, m.saidasCentavos, m.saldoCentavos, m.quantidadeVendas, m.ticketMedioCentavos])).toEqual([
      // agosto: 100 − 120 + 45 = 25
      ["2026-08", 4500, 12000, 2500, 1, 4500],
      // setembro: 25 + 80 − 20 = 85
      ["2026-09", 8000, 2000, 8500, 1, 8000],
      // outubro (até hoje): 85 + 30 + 50 − 30 − 95 − 15 = 25; entradas do mês incluem o aporte do dia 20
      ["2026-10", 58000, 14000, 2500, 2, 5750],
    ]);
    expect(meses.map((m) => m.rotulo)).toEqual(["ago", "set", "out"]);
  });

  it("meses anteriores ao início do caixa ficam com o saldo inicial", () => {
    const meses = resumoMensal({ lancamentos: LANCAMENTOS, vendas: VENDAS, config: CONFIG, hoje: HOJE }, 6);
    expect(meses[0]).toMatchObject({ mes: "2026-05", saldoCentavos: 10000, entradasCentavos: 0 });
    expect(meses[2]).toMatchObject({ mes: "2026-07", entradasCentavos: 99900, saldoCentavos: 10000 });
  });
});

describe("saidasPorCategoria", () => {
  it("agrupa e ordena as saídas do período", () => {
    expect(saidasPorCategoria(LANCAMENTOS, OUTUBRO)).toEqual([
      { categoria: "Filamento", valorCentavos: 9500, fracao: 95 / 140 },
      { categoria: "Estorno de venda", valorCentavos: 3000, fracao: 30 / 140 },
      { categoria: "Divulgação", valorCentavos: 1500, fracao: 15 / 140 },
    ]);
  });
});

describe("lucroBruto e maisVendidos", () => {
  const itens = [
    { produtoId: "a", nome: "Chaveiro", descricao: "Chaveiro", quantidade: 3, totalCentavos: 4500, custoUnitarioCentavos: 600 },
    { produtoId: "b", nome: "Vaso", descricao: "Vaso", quantidade: 1, totalCentavos: 4000, custoUnitarioCentavos: 1500 },
    { produtoId: null, nome: "Embrulho", descricao: "Embrulho", quantidade: 2, totalCentavos: 1000, custoUnitarioCentavos: null },
    { produtoId: "a", nome: "Chaveiro", descricao: "Chaveiro", quantidade: 2, totalCentavos: 3000, custoUnitarioCentavos: 600 },
  ];

  it("lucro só dos itens com custo e avisa os sem custo", () => {
    // (4500 − 3×600) + (4000 − 1500) + (3000 − 2×600) = 2700 + 2500 + 1800 = 7000
    expect(lucroBruto(itens)).toEqual({ lucroCentavos: 7000, itensSemCusto: 1 });
  });

  it("soma por produto e ordena por quantidade", () => {
    expect(maisVendidos(itens)).toEqual([
      { nome: "Chaveiro", quantidade: 5, totalCentavos: 7500 },
      { nome: "Embrulho", quantidade: 2, totalCentavos: 1000 },
      { nome: "Vaso", quantidade: 1, totalCentavos: 4000 },
    ]);
  });
});

describe("utilitários", () => {
  it("ultimosMeses atravessa a virada do ano", () => {
    expect(ultimosMeses("2026-02-10", 4)).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });

  it("saldoAte respeita a data de início", () => {
    expect(saldoAte(LANCAMENTOS, CONFIG, "2026-07-31")).toBe(10000);
  });
});
