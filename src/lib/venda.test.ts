import { describe, expect, it } from "vitest";
import { calcularTotais, linkWhatsApp, mensagemRecibo, statusPagamento } from "./venda";

describe("calcularTotais", () => {
  it("soma itens, tira desconto e soma frete", () => {
    const itens = [
      { quantidade: 2, precoUnitarioCentavos: 1500 },
      { quantidade: 1, precoUnitarioCentavos: 4000 },
    ];
    expect(calcularTotais(itens, 500, 1000)).toEqual({ subtotal: 7000, total: 7500 });
    expect(calcularTotais([])).toEqual({ subtotal: 0, total: 0 });
  });
});

describe("statusPagamento", () => {
  it.each([
    [7500, 0, "pendente"],
    [7500, 1, "parcial"],
    [7500, 7499, "parcial"],
    [7500, 7500, "pago"],
    [0, 0, "pendente"],
  ] as const)("total %i, pago %i → %s", (total, pago, esperado) => {
    expect(statusPagamento(total, pago)).toBe(esperado);
  });
});

describe("mensagemRecibo", () => {
  const base = {
    numero: 12,
    data: "2026-10-15",
    cliente: "Ana Paula",
    itens: [
      { descricao: "Chaveiro com nome", cor: "Rosa", quantidade: 2, totalCentavos: 3000 },
      { descricao: "Topo de bolo", cor: null, quantidade: 1, totalCentavos: 4000 },
    ],
    descontoCentavos: 500,
    freteCentavos: 1000,
    totalCentavos: 7500,
    pagoCentavos: 7000,
  };

  it("lista itens, totais e o que falta pagar", () => {
    expect(mensagemRecibo(base)).toBe(
      [
        "Olá, Ana! Aqui está o recibo da sua compra na Matilda3D:",
        "",
        "*Pedido #12* · 15/10/2026",
        "• 2x Chaveiro com nome (Rosa) — R$ 30,00",
        "• 1x Topo de bolo — R$ 40,00",
        "Desconto: −R$ 5,00",
        "Frete: R$ 10,00",
        "*Total: R$ 75,00*",
        "Pago: R$ 70,00",
        "Falta pagar: R$ 5,00",
        "",
        "Obrigado pela preferência!",
      ].join("\n"),
    );
  });

  it("venda paga e sem cliente", () => {
    const texto = mensagemRecibo({ ...base, cliente: null, descontoCentavos: 0, freteCentavos: 0, pagoCentavos: 7500 });
    expect(texto.startsWith("Recibo da sua compra na Matilda3D:")).toBe(true);
    expect(texto).toContain("Pagamento: recebido. Obrigado!");
    expect(texto).not.toContain("Desconto");
    expect(texto).not.toContain("Falta pagar");
  });
});

describe("linkWhatsApp", () => {
  it("codifica a mensagem e usa o número só com dígitos", () => {
    expect(linkWhatsApp("Olá & tchau", "+55 (61) 99999-9999")).toBe(
      "https://wa.me/5561999999999?text=Ol%C3%A1%20%26%20tchau",
    );
    expect(linkWhatsApp("Oi")).toBe("https://wa.me/?text=Oi");
  });
});
