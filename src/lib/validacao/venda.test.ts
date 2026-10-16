import { describe, expect, it } from "vitest";
import { esquemaLancamento } from "./caixa";
import { errosPorCampo } from "./comum";
import { esquemaPagamento, esquemaVenda, type ValoresVenda } from "./venda";

const VENDA: ValoresVenda = {
  data: "2026-10-15",
  cliente: { modo: "avulsa" },
  itens: [{ produtoId: "", descricao: "Chaveiro", cor: "Rosa", quantidade: 2, preco: "15,00" }],
  desconto: "",
  frete: "",
  canal: "whatsapp",
  valorPago: "",
  forma: "",
  observacoes: "",
  encomendaId: "",
};

const erros = (v: Partial<ValoresVenda>) => {
  const r = esquemaVenda.safeParse({ ...VENDA, ...v });
  return r.success ? {} : errosPorCampo(r.error);
};

describe("esquemaVenda", () => {
  it("converte valores e aceita venda avulsa sem pagamento", () => {
    const r = esquemaVenda.parse({ ...VENDA, desconto: "5", frete: "10,00" });
    expect(r.itens[0]).toMatchObject({ produtoId: null, quantidade: 2, preco: 1500 });
    expect(r.desconto).toBe(500);
    expect(r.frete).toBe(1000);
    expect(r.valorPago).toBe(0);
  });

  it("cliente novo: normaliza WhatsApp e tira o @ do Instagram", () => {
    const r = esquemaVenda.parse({
      ...VENDA,
      cliente: { modo: "novo", nome: "Ana", whatsapp: "(61) 99999-9999", instagram: "@ana3d" },
    });
    expect(r.cliente).toEqual({ modo: "novo", nome: "Ana", whatsapp: "5561999999999", instagram: "ana3d" });
  });

  it("recusa desconto maior que a venda, pagamento acima do total e pagamento sem forma", () => {
    expect(erros({ desconto: "31,00" })).toMatchObject({ desconto: "O desconto é maior que o valor da venda." });
    expect(erros({ valorPago: "30,01", forma: "pix" }).valorPago).toContain("maior do que o total da venda (R$");
    expect(erros({ valorPago: "10" })).toEqual({ forma: "Escolha a forma de pagamento." });
  });

  it("exige itens válidos, com mensagens em português", () => {
    expect(erros({ itens: [] })).toEqual({ itens: "Inclua pelo menos um item." });
    expect(
      erros({ itens: [{ produtoId: "", descricao: "", cor: "", quantidade: 0, preco: "abc" }] }),
    ).toEqual({
      "itens.0.descricao": "Preencha este campo.",
      "itens.0.quantidade": "A quantidade mínima é 1.",
      "itens.0.preco": "Digite um valor válido, ex.: 25,90.",
    });
    expect(erros({ cliente: { modo: "novo", nome: "Ana", whatsapp: "123", instagram: "" } })).toEqual({
      "cliente.whatsapp": "Digite um WhatsApp com DDD, ex.: (61) 99999-9999.",
    });
  });
});

describe("esquemaPagamento", () => {
  it("exige valor positivo e forma", () => {
    const base = { vendaId: "8f9c2a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b", valor: "10", forma: "pix" as const, data: "2026-10-15" };
    expect(esquemaPagamento.parse(base).valor).toBe(1000);
    expect(esquemaPagamento.safeParse({ ...base, valor: "0" }).success).toBe(false);
  });
});

describe("esquemaLancamento", () => {
  const base = {
    tipo: "saida" as const,
    data: "2026-10-15",
    descricao: "PLA 1 kg",
    categoria: "Filamento",
    valor: "120,00",
    forma: "pix" as const,
    comprovante: "",
  };

  it("aceita despesa válida", () => {
    expect(esquemaLancamento.parse(base).valor).toBe(12000);
  });

  it("não deixa usar categoria de outro tipo nem as automáticas", () => {
    const r1 = esquemaLancamento.safeParse({ ...base, tipo: "entrada" });
    expect(r1.success ? {} : errosPorCampo(r1.error)).toEqual({ categoria: "Escolha uma categoria da lista." });
    const r2 = esquemaLancamento.safeParse({ ...base, categoria: "Venda" });
    expect(r2.success).toBe(false);
  });
});
