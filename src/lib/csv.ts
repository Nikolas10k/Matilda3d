// CSV para abrir direto no Excel em português (docs/04, seção 8):
// separador ";", UTF-8 com BOM (acentos corretos) e números com vírgula decimal.

const BOM = "﻿";

export type Celula = string | number | boolean | null | undefined;

function escapar(valor: Celula): string {
  if (valor == null) return "";
  const texto = typeof valor === "boolean" ? (valor ? "Sim" : "Não") : String(valor);
  // Evita que o Excel interprete o texto como fórmula (=, +, -, @ no início).
  const seguro = /^[=+\-@]/.test(texto) && typeof valor === "string" ? `'${texto}` : texto;
  return /[;"\r\n]/.test(seguro) ? `"${seguro.replace(/"/g, '""')}"` : seguro;
}

export function gerarCsv(cabecalho: string[], linhas: Celula[][]): string {
  return BOM + [cabecalho, ...linhas].map((linha) => linha.map(escapar).join(";")).join("\r\n") + "\r\n";
}

/** Centavos para o formato numérico do Excel brasileiro, sem separador de milhar: 123456 → "1234,56". */
export function dinheiroCsv(centavos: number | null | undefined): string {
  if (centavos == null) return "";
  const negativo = centavos < 0;
  const abs = Math.abs(centavos);
  return `${negativo ? "-" : ""}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/** "2026-10-15" → "15/10/2026". */
export function dataCsv(data: string): string {
  const [a, m, d] = data.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}
