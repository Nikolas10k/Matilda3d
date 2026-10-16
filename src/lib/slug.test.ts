import { describe, expect, it } from "vitest";
import { gerarSlug, SLUG_VALIDO } from "./slug";

describe("gerarSlug", () => {
  it.each([
    ["Chaveiro com nome", "chaveiro-com-nome"],
    ["Decoração Geométrica", "decoracao-geometrica"],
    ["  Topo de bolo — 15 anos!  ", "topo-de-bolo-15-anos"],
    ["Pé-de-Moleque & Cia", "pe-de-moleque-cia"],
    ["ÇÃO çao", "cao-cao"],
    ["---", ""],
  ])("%j → %j", (entrada, esperado) => {
    expect(gerarSlug(entrada)).toBe(esperado);
  });

  it("limita o tamanho sem terminar em hífen", () => {
    const slug = gerarSlug("a".repeat(79) + " bbbbb");
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("gera sempre um slug válido", () => {
    for (const t of ["Vaso", "Miniaturas e bonequinhos", "Suporte 2.0"]) {
      expect(SLUG_VALIDO.test(gerarSlug(t))).toBe(true);
    }
  });
});
