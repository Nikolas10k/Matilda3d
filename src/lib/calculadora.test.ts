import { describe, expect, it } from "vitest";
import { calcularPreco, margemProduto, type EntradaCalculadora } from "./calculadora";

// Padrões de configuracoes (docs/05): kg R$ 120, energia R$ 0,50/h,
// desgaste R$ 1,00/h, embalagem R$ 1,50, falhas 10%, margem 100%.
const PADRAO: EntradaCalculadora = {
  gramas: 0,
  precoKgFilamentoCentavos: 12000,
  minutosImpressao: 0,
  custoEnergiaHoraCentavos: 50,
  desgasteHoraCentavos: 100,
  embalagemCentavos: 150,
  taxaFalhasPct: 10,
  margemPct: 100,
};

describe("calcularPreco", () => {
  it("chaveiro: 20 g, 1h30 de impressão, padrões", () => {
    // material  = 20 × 120 = 240
    // máquina   = 1,5 h × (50 + 100) = 225
    // perdas    = (240 + 225) × 1,10 = 511,5
    // total     = 511,5 + 150 = 661,5
    // preço     = 661,5 × 2 = 1323 → sobe para 1350 (R$ 13,50)
    // lucro     = 1350 − 661,5 = 688,5 → 689
    const r = calcularPreco({ ...PADRAO, gramas: 20, minutosImpressao: 90 });
    expect(r).toEqual({
      custoMaterialCentavos: 240,
      custoMaquinaCentavos: 225,
      custoComPerdasCentavos: 512,
      custoTotalCentavos: 662,
      precoSugeridoCentavos: 1350,
      lucroPorPecaCentavos: 689,
      margemReal: 688.5 / 1350,
    });
  });

  it("vaso: 150 g, 6h, filamento a R$ 95, margem 80%", () => {
    // material = 150 × 9,5 = 1425
    // máquina  = 6 × 150 = 900
    // perdas   = 2325 × 1,10 = 2557,5
    // total    = 2557,5 + 150 = 2707,5
    // preço    = 2707,5 × 1,8 = 4873,5 → 4900 (R$ 49,00)
    // lucro    = 4900 − 2707,5 = 2192,5 → 2193
    const r = calcularPreco({
      ...PADRAO,
      gramas: 150,
      precoKgFilamentoCentavos: 9500,
      minutosImpressao: 360,
      margemPct: 80,
    });
    expect(r.custoMaterialCentavos).toBe(1425);
    expect(r.custoMaquinaCentavos).toBe(900);
    expect(r.custoComPerdasCentavos).toBe(2558);
    expect(r.custoTotalCentavos).toBe(2708);
    expect(r.precoSugeridoCentavos).toBe(4900);
    expect(r.lucroPorPecaCentavos).toBe(2193);
  });

  it("não sobe o preço quando já é múltiplo exato de R$ 0,50", () => {
    // total = 250 (só embalagem 2,50) × 2 = 500 → fica 500
    const r = calcularPreco({ ...PADRAO, embalagemCentavos: 250 });
    expect(r.precoSugeridoCentavos).toBe(500);
  });

  it("não sofre com erro de ponto flutuante no arredondamento", () => {
    // 0,1 + 0,2 em float não é 0,3; o preço deve ficar em 50, não 100.
    const r = calcularPreco({
      ...PADRAO,
      gramas: 0,
      embalagemCentavos: 0,
      taxaFalhasPct: 0,
      margemPct: 0,
      minutosImpressao: 60,
      custoEnergiaHoraCentavos: 10 * 0.1 + 20 * 0.1 + 47,
      desgasteHoraCentavos: 0,
    });
    expect(r.precoSugeridoCentavos).toBe(50);
  });

  it("sem taxa de falhas e sem margem, o preço cobre só o custo", () => {
    const r = calcularPreco({ ...PADRAO, gramas: 10, taxaFalhasPct: 0, margemPct: 0 });
    // 10 × 120 = 120 + 150 de embalagem = 270 → 300
    expect(r.custoTotalCentavos).toBe(270);
    expect(r.precoSugeridoCentavos).toBe(300);
    expect(r.lucroPorPecaCentavos).toBe(30);
  });

  it("tudo zerado não quebra", () => {
    const r = calcularPreco({
      gramas: 0,
      precoKgFilamentoCentavos: 0,
      minutosImpressao: 0,
      custoEnergiaHoraCentavos: 0,
      desgasteHoraCentavos: 0,
      embalagemCentavos: 0,
      taxaFalhasPct: 0,
      margemPct: 0,
    });
    expect(r.precoSugeridoCentavos).toBe(0);
    expect(r.margemReal).toBe(0);
  });
});

describe("margemProduto", () => {
  it("calcula (preço − custo) ÷ preço", () => {
    expect(margemProduto(2000, 800)).toBe(0.6);
    expect(margemProduto(1000, 1200)).toBe(-0.2);
  });

  it("devolve null sem preço ou sem custo", () => {
    expect(margemProduto(null, 500)).toBeNull();
    expect(margemProduto(1000, null)).toBeNull();
    expect(margemProduto(0, 0)).toBeNull();
  });
});
