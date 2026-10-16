import { describe, expect, it } from "vitest";
import {
  centavosParaTexto,
  formatarPercentual,
  dataIsoSaoPaulo,
  formatarData,
  formatarDataHora,
  formatarMoeda,
  formatarWhatsApp,
  normalizarWhatsApp,
  paraCentavos,
} from "./format";

// O Intl separa "R$" do número com espaço não separável (U+00A0).
const semNbsp = (s: string) => s.replace(/ /g, " ");

describe("formatarMoeda", () => {
  it.each([
    [0, "R$ 0,00"],
    [5, "R$ 0,05"],
    [1250, "R$ 12,50"],
    [123456, "R$ 1.234,56"],
    [100000000, "R$ 1.000.000,00"],
    [-1990, "-R$ 19,90"],
  ])("%i centavos → %s", (centavos, esperado) => {
    expect(semNbsp(formatarMoeda(centavos))).toBe(esperado);
  });
});

describe("paraCentavos", () => {
  it.each([
    ["12", 1200],
    ["12,5", 1250],
    ["12,50", 1250],
    ["12,", 1200],
    ["0,99", 99],
    ["1.234,56", 123456],
    ["1234,56", 123456],
    ["1.000.000,00", 100000000],
    ["R$ 25,90", 2590],
    [" 25,90 ", 2590],
    ["12.50", 1250],
    ["12.5", 1250],
    ["1.234", 123400],
    ["0,10", 10],
    ["19,99", 1999], // 19.99 * 100 em float daria 1998.9999...
  ])("%j → %i", (texto, esperado) => {
    expect(paraCentavos(texto)).toBe(esperado);
  });

  it.each([
    "",
    "   ",
    "abc",
    "12,345",
    "1.23,45",
    "-5",
    "12,5,0",
    "1.2.3",
    "12.345.6",
    "99999999999",
  ])("%j é inválido", (texto) => {
    expect(paraCentavos(texto)).toBeNull();
  });
});

describe("formatarData", () => {
  it("exibe datas sem hora sem deslocar o dia", () => {
    expect(formatarData("2026-10-15")).toBe("15/10/2026");
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
  });

  it("converte timestamps para o fuso de São Paulo", () => {
    // 02:00 UTC do dia 16 ainda é dia 15 em São Paulo (UTC−3).
    expect(formatarData("2026-10-16T02:00:00Z")).toBe("15/10/2026");
    expect(formatarData(new Date("2026-10-16T03:00:00Z"))).toBe("16/10/2026");
  });

  it("formata data e hora em São Paulo", () => {
    expect(formatarDataHora("2026-10-15T17:30:00Z")).toBe("15/10/2026, 14:30");
  });

  it("calcula a data ISO de São Paulo", () => {
    expect(dataIsoSaoPaulo(new Date("2026-10-16T02:59:00Z"))).toBe("2026-10-15");
    expect(dataIsoSaoPaulo(new Date("2026-10-16T03:00:00Z"))).toBe("2026-10-16");
  });
});

describe("normalizarWhatsApp", () => {
  it.each([
    ["(61) 99999-9999", "5561999999999"],
    ["61999999999", "5561999999999"],
    ["+55 (61) 99999-9999", "5561999999999"],
    ["5561999999999", "5561999999999"],
    ["(11) 3333-4444", "551133334444"],
  ])("%j → %s", (texto, esperado) => {
    expect(normalizarWhatsApp(texto)).toBe(esperado);
  });

  it.each([
    "",
    "99999-9999",
    "(01) 99999-9999",
    "(61) 89999-9999",
    "123",
    "556199999999999",
  ])("%j é inválido", (texto) => {
    expect(normalizarWhatsApp(texto)).toBeNull();
  });
});

describe("formatarWhatsApp", () => {
  it("formata celular e fixo", () => {
    expect(formatarWhatsApp("5561999999999")).toBe("(61) 99999-9999");
    expect(formatarWhatsApp("551133334444")).toBe("(11) 3333-4444");
  });

  it("devolve o texto original quando não reconhece o número", () => {
    expect(formatarWhatsApp("123")).toBe("123");
  });
});

describe("centavosParaTexto e formatarPercentual", () => {
  it("formata para os campos de dinheiro", () => {
    expect(centavosParaTexto(1250)).toBe("12,50");
    expect(centavosParaTexto(123456)).toBe("1.234,56");
    expect(centavosParaTexto(null)).toBe("");
    expect(paraCentavos(centavosParaTexto(99999))).toBe(99999);
  });

  it("formata percentuais", () => {
    expect(formatarPercentual(0.5)).toBe("50%");
    expect(formatarPercentual(0.4567).replace(/ /g, " ")).toBe("45,7%");
  });
});
