import { describe, expect, it } from "vitest";
import { dataCsv, dinheiroCsv, gerarCsv } from "./csv";

describe("gerarCsv", () => {
  it("começa com BOM, usa ; e quebra de linha do Windows", () => {
    const csv = gerarCsv(["Nome", "Valor"], [["Chaveiro", "15,00"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("Nome;Valor\r\nChaveiro;15,00\r\n");
  });

  it("mantém acentos e protege ; aspas e quebras de linha", () => {
    const csv = gerarCsv(["Descrição"], [["Coração; rosa"], ['Topo "Ana"'], ["linha 1\nlinha 2"]]);
    expect(csv.slice(1).split("\r\n")).toEqual(["Descrição", '"Coração; rosa"', '"Topo ""Ana"""', '"linha 1\nlinha 2"', ""]);
  });

  it("vazios, booleanos e textos que parecem fórmula", () => {
    const csv = gerarCsv(["a", "b", "c", "d"], [[null, true, "=SOMA(A1)", 12]]);
    expect(csv.slice(1).split("\r\n")[1]).toBe(";Sim;'=SOMA(A1);12");
  });
});

describe("formatos", () => {
  it("dinheiro com vírgula e sem milhar", () => {
    expect(dinheiroCsv(123456)).toBe("1234,56");
    expect(dinheiroCsv(5)).toBe("0,05");
    expect(dinheiroCsv(-1990)).toBe("-19,90");
    expect(dinheiroCsv(null)).toBe("");
  });

  it("data em dd/mm/aaaa", () => {
    expect(dataCsv("2026-10-15")).toBe("15/10/2026");
    expect(dataCsv("2026-10-15T13:00:00Z")).toBe("15/10/2026");
  });
});
