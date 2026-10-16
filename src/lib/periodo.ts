// Períodos de datas no fuso de São Paulo (datas em "AAAA-MM-DD").
import { dataIsoSaoPaulo } from "@/lib/format";

export type Periodo = { de: string; ate: string };
export type AtalhoPeriodo = "este-mes" | "mes-passado" | "ultimos-3-meses" | "este-ano";

export const ATALHOS_PERIODO: { valor: AtalhoPeriodo; rotulo: string }[] = [
  { valor: "este-mes", rotulo: "Este mês" },
  { valor: "mes-passado", rotulo: "Mês passado" },
  { valor: "ultimos-3-meses", rotulo: "Últimos 3 meses" },
  { valor: "este-ano", rotulo: "Este ano" },
];

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function ultimoDia(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate(); // mes de 1 a 12
}
const iso = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

/** Calcula o período de um atalho em relação a `hoje` (padrão: hoje em São Paulo). */
export function periodoDoAtalho(atalho: AtalhoPeriodo, hoje = dataIsoSaoPaulo()): Periodo {
  const [ano, mes] = hoje.split("-").map(Number);
  switch (atalho) {
    case "este-mes":
      return { de: iso(ano, mes, 1), ate: iso(ano, mes, ultimoDia(ano, mes)) };
    case "mes-passado": {
      const [a, m] = mes === 1 ? [ano - 1, 12] : [ano, mes - 1];
      return { de: iso(a, m, 1), ate: iso(a, m, ultimoDia(a, m)) };
    }
    case "ultimos-3-meses": {
      let [a, m] = [ano, mes - 2];
      if (m <= 0) [a, m] = [a - 1, m + 12];
      return { de: iso(a, m, 1), ate: iso(ano, mes, ultimoDia(ano, mes)) };
    }
    case "este-ano":
      return { de: iso(ano, 1, 1), ate: iso(ano, 12, 31) };
  }
}

/**
 * Lê o período da URL (?periodo=mes-passado ou ?de=...&ate=...).
 * Sem nada válido, usa "este mês" (padrão do docs/04).
 */
export function periodoDosParametros(params: { periodo?: string; de?: string; ate?: string }, hoje = dataIsoSaoPaulo()) {
  if (params.de && params.ate && DATA_ISO.test(params.de) && DATA_ISO.test(params.ate) && params.de <= params.ate) {
    return { atalho: "personalizado" as const, ...{ de: params.de, ate: params.ate } };
  }
  const atalho = ATALHOS_PERIODO.some((a) => a.valor === params.periodo)
    ? (params.periodo as AtalhoPeriodo)
    : "este-mes";
  return { atalho, ...periodoDoAtalho(atalho, hoje) };
}
