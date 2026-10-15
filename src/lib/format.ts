// Formatadores e conversores obrigatórios (ver CLAUDE.md e docs/06).
// Dinheiro é sempre centavos (inteiro); datas sempre no fuso America/Sao_Paulo.

export const FUSO_HORARIO = "America/Sao_Paulo";

// Maior valor aceito por uma coluna `int` do Postgres.
const MAX_CENTAVOS = 2_147_483_647;

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO_HORARIO,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatadorIso = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_HORARIO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const DATA_SEM_HORA = /^(\d{4})-(\d{2})-(\d{2})$/;

/** 1250 → "R$ 12,50". */
export function formatarMoeda(centavos: number): string {
  return formatadorMoeda.format(centavos / 100);
}

/**
 * Converte o texto digitado em centavos. Aceita "12", "12,5", "12,50",
 * "1.234,56", "R$ 12,50" e também ponto decimal ("12.50"), que alguns
 * teclados de celular inserem. Retorna `null` se o texto não for um valor válido.
 */
export function paraCentavos(texto: string): number | null {
  let limpo = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (limpo === "") return null;

  if (limpo.includes(",")) {
    // Formato brasileiro: pontos são milhar, vírgula é decimal.
    if (!/^\d{1,3}(\.\d{3})*,\d{0,2}$|^\d+,\d{0,2}$/.test(limpo)) return null;
    limpo = limpo.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) {
    // "1.234" sem vírgula: ponto como separador de milhar.
    limpo = limpo.replace(/\./g, "");
  } else if (!/^\d+(\.\d{0,2})?$/.test(limpo)) {
    return null;
  }

  // Converte sem passar por float: parte inteira e parte decimal como texto.
  const [inteiro, decimal = ""] = limpo.split(".");
  const centavos = Number(inteiro) * 100 + Number(decimal.padEnd(2, "0"));

  if (!Number.isSafeInteger(centavos) || centavos > MAX_CENTAVOS) return null;
  return centavos;
}

/**
 * Formata uma data como "15/10/2026" no fuso de São Paulo. Datas sem hora
 * ("2026-10-15", como vêm das colunas `date`) são exibidas como estão, sem
 * conversão de fuso, para não voltar um dia.
 */
export function formatarData(data: Date | string): string {
  if (typeof data === "string") {
    const m = DATA_SEM_HORA.exec(data);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  return formatadorData.format(new Date(data));
}

/** Formata data e hora como "15/10/2026, 14:30" no fuso de São Paulo. */
export function formatarDataHora(data: Date | string): string {
  return formatadorDataHora.format(new Date(data));
}

/** Data de hoje (ou da data informada) em São Paulo, no formato "2026-10-15". */
export function dataIsoSaoPaulo(data: Date = new Date()): string {
  return formatadorIso.format(data);
}

/**
 * Normaliza um WhatsApp brasileiro para só dígitos com DDI 55:
 * "(61) 99999-9999" → "5561999999999". Retorna `null` se não tiver DDD válido
 * e 8 ou 9 dígitos de número.
 */
export function normalizarWhatsApp(texto: string): string | null {
  let digitos = texto.replace(/\D/g, "");
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    digitos = digitos.slice(2);
  }
  if (digitos.length !== 10 && digitos.length !== 11) return null;
  if (!/^[1-9][1-9]/.test(digitos)) return null; // DDD de 11 a 99
  if (digitos.length === 11 && digitos[2] !== "9") return null; // celular começa com 9
  return `55${digitos}`;
}

/**
 * Formata um WhatsApp para exibição: "5561999999999" → "(61) 99999-9999".
 * Se o número não for reconhecido, devolve o texto original.
 */
export function formatarWhatsApp(numero: string): string {
  const normalizado = normalizarWhatsApp(numero);
  if (!normalizado) return numero;
  const ddd = normalizado.slice(2, 4);
  const resto = normalizado.slice(4);
  const corte = resto.length - 4;
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
