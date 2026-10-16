// Calculadora de preço por peça (docs/06-regras-de-negocio.md).
// Entradas e saídas em centavos. As contas intermediárias usam frações de
// centavo; o arredondamento acontece só no último passo (regra de docs/06).

export type EntradaCalculadora = {
  gramas: number;
  precoKgFilamentoCentavos: number;
  minutosImpressao: number;
  custoEnergiaHoraCentavos: number;
  desgasteHoraCentavos: number;
  embalagemCentavos: number;
  taxaFalhasPct: number;
  margemPct: number;
};

export type ResultadoCalculadora = {
  custoMaterialCentavos: number;
  custoMaquinaCentavos: number;
  custoComPerdasCentavos: number;
  custoTotalCentavos: number;
  precoSugeridoCentavos: number;
  lucroPorPecaCentavos: number;
  /** Fração de 0 a 1 (0,5 = 50%). */
  margemReal: number;
};

/** O preço sugerido sobe até o próximo múltiplo de R$ 0,50. */
export const ARREDONDAMENTO_PRECO_CENTAVOS = 50;

// Tolerância para erros de ponto flutuante (ex.: 1349,9999999 não vira 1400).
const EPSILON = 1e-9;

export function calcularPreco(e: EntradaCalculadora): ResultadoCalculadora {
  const custoMaterial = e.gramas * (e.precoKgFilamentoCentavos / 1000);
  const horas = e.minutosImpressao / 60;
  const custoMaquina = horas * (e.custoEnergiaHoraCentavos + e.desgasteHoraCentavos);
  const custoProducao = (custoMaterial + custoMaquina) * (1 + e.taxaFalhasPct / 100);
  const custoTotal = custoProducao + e.embalagemCentavos;

  const precoBruto = custoTotal * (1 + e.margemPct / 100);
  // Math.max evita "-0" quando tudo é zero.
  const precoSugerido = Math.max(
    0,
    Math.ceil(precoBruto / ARREDONDAMENTO_PRECO_CENTAVOS - EPSILON) * ARREDONDAMENTO_PRECO_CENTAVOS,
  );

  const lucro = precoSugerido - custoTotal;

  return {
    custoMaterialCentavos: Math.round(custoMaterial),
    custoMaquinaCentavos: Math.round(custoMaquina),
    custoComPerdasCentavos: Math.round(custoProducao),
    custoTotalCentavos: Math.round(custoTotal),
    precoSugeridoCentavos: precoSugerido,
    lucroPorPecaCentavos: Math.round(lucro),
    margemReal: precoSugerido > 0 ? lucro / precoSugerido : 0,
  };
}

/** Margem de um produto já cadastrado: (preço − custo) ÷ preço. null se faltar dado. */
export function margemProduto(precoCentavos: number | null, custoCentavos: number | null): number | null {
  if (precoCentavos == null || custoCentavos == null || precoCentavos <= 0) return null;
  return (precoCentavos - custoCentavos) / precoCentavos;
}
