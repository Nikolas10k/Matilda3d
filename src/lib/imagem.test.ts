import { describe, expect, it } from "vitest";
import { dimensoesReduzidas } from "./imagem";

describe("dimensoesReduzidas", () => {
  it("não aumenta imagens pequenas", () => {
    expect(dimensoesReduzidas(800, 600)).toEqual({ largura: 800, altura: 600 });
    expect(dimensoesReduzidas(1600, 1200)).toEqual({ largura: 1600, altura: 1200 });
  });

  it("reduz pelo maior lado mantendo a proporção", () => {
    expect(dimensoesReduzidas(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensoesReduzidas(3024, 4032)).toEqual({ largura: 1200, altura: 1600 });
  });
});
