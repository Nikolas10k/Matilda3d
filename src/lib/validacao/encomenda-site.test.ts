import { describe, expect, it } from "vitest";
import { errosPorCampo } from "./comum";
import { criarEsquemaEncomenda, erroImagem, type ValoresEncomendaSite } from "./encomenda-site";

const HOJE = "2026-10-15";
const esquema = criarEsquemaEncomenda(HOJE);
const BASE: ValoresEncomendaSite = {
  nome: "Ana",
  whatsapp: "(61) 98888-7777",
  tipo: "Topo de bolo",
  quantidade: "2",
  descricao: "Topo com o nome Ana",
  cores: "",
  dataDesejada: "",
  consentimento: true,
};
const erros = (v: Partial<Record<keyof ValoresEncomendaSite, unknown>>) => {
  const r = esquema.safeParse({ ...BASE, ...v });
  return r.success ? {} : errosPorCampo(r.error);
};

describe("formulário de encomenda do site", () => {
  it("normaliza o WhatsApp e converte a quantidade", () => {
    const r = esquema.parse(BASE);
    expect(r.whatsapp).toBe("5561988887777");
    expect(r.quantidade).toBe(2);
    expect(r.dataDesejada).toBeNull();
  });

  it("mensagens do docs/06", () => {
    expect(erros({ nome: "" })).toEqual({ nome: "Preencha este campo." });
    expect(erros({ whatsapp: "123" })).toEqual({ whatsapp: "Digite um WhatsApp com DDD, ex.: (61) 99999-9999." });
    expect(erros({ dataDesejada: "2026-10-14" })).toEqual({ dataDesejada: "Escolha uma data a partir de hoje." });
    expect(erros({ dataDesejada: "2026-10-15" })).toEqual({});
  });

  it("exige consentimento, tipo da lista e descrição até 1000 caracteres", () => {
    expect(erros({ consentimento: false }).consentimento).toContain("Marque esta opção");
    expect(erros({ tipo: "Foguete" })).toEqual({ tipo: "Escolha o tipo de peça." });
    expect(erros({ descricao: "a".repeat(1001) })).toEqual({ descricao: "Use no máximo 1000 caracteres." });
    expect(erros({ quantidade: "0" })).toEqual({ quantidade: "A quantidade mínima é 1." });
  });
});

describe("erroImagem", () => {
  it("aceita jpg/png/webp até 5 MB e ignora vazio", () => {
    expect(erroImagem(null)).toBeNull();
    expect(erroImagem({ type: "image/png", size: 0 })).toBeNull();
    expect(erroImagem({ type: "image/webp", size: 5 * 1024 * 1024 })).toBeNull();
    expect(erroImagem({ type: "image/gif", size: 100 })).toBe("Envie uma imagem JPG, PNG ou WEBP.");
    expect(erroImagem({ type: "image/jpeg", size: 5 * 1024 * 1024 + 1 })).toBe("A imagem pode ter no máximo 5 MB.");
  });
});
