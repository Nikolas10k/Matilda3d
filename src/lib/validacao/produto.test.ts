import { describe, expect, it } from "vitest";
import { esquemaProduto, type ValoresFormularioProduto } from "./produto";

const BASE: ValoresFormularioProduto = {
  id: "8f9c2a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b",
  nome: "Chaveiro com nome",
  slug: "chaveiro-com-nome",
  categoriaId: "",
  descricaoCurta: "",
  descricao: "",
  preco: "",
  custo: "",
  gramas: "",
  horas: "",
  minutos: "",
  cores: [],
  fotos: [],
  ativo: true,
  destaque: false,
};

function erros(valores: Partial<ValoresFormularioProduto>) {
  const r = esquemaProduto.safeParse({ ...BASE, ...valores });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
}

describe("esquemaProduto", () => {
  it("converte texto em centavos, gramas e minutos", () => {
    const r = esquemaProduto.parse({
      ...BASE,
      preco: "1.234,50",
      custo: "4,2",
      gramas: "12,5",
      horas: "1",
      minutos: "30",
      categoriaId: "1f9c2a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b",
    });
    expect(r.preco).toBe(123450);
    expect(r.custo).toBe(420);
    expect(r.gramas).toBe(12.5);
    expect(r.minutosImpressao).toBe(90);
    expect(r.categoriaId).toBe("1f9c2a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b");
  });

  it("campos opcionais vazios viram null ('Sob consulta' quando sem preço)", () => {
    const r = esquemaProduto.parse(BASE);
    expect(r.preco).toBeNull();
    expect(r.custo).toBeNull();
    expect(r.gramas).toBeNull();
    expect(r.minutosImpressao).toBeNull();
    expect(r.categoriaId).toBeNull();
  });

  it("só minutos também conta como tempo de impressão", () => {
    expect(esquemaProduto.parse({ ...BASE, minutos: "45" }).minutosImpressao).toBe(45);
  });

  it("mostra mensagens em português", () => {
    expect(erros({ nome: "  " })).toEqual({ nome: "Preencha este campo." });
    expect(erros({ preco: "abc" })).toEqual({ preco: "Digite um valor válido, ex.: 25,90." });
    expect(erros({ slug: "Chaveiro Com Nome" }).slug).toContain("letras minúsculas");
    expect(erros({ minutos: "75" })).toEqual({ minutos: "Use de 0 a 59 minutos." });
    expect(erros({ descricaoCurta: "a".repeat(141) })).toEqual({
      descricaoCurta: "Use no máximo 140 caracteres.",
    });
    expect(erros({ fotos: Array(7).fill("x.webp") })).toEqual({ fotos: "Use no máximo 6 fotos." });
  });
});
