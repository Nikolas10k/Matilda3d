import { describe, expect, it } from "vitest";
import { linkPedido, mensagemEncomendaEnviada, mensagemPedido, numeroDaLoja, URL_SITE } from "./whatsapp-site";

describe("mensagemPedido (docs/03)", () => {
  it("com cor e preço", () => {
    expect(mensagemPedido({ nome: "Chaveiro com nome", cor: "Rosa", precoCentavos: 1500, slug: "chaveiro-com-nome" })).toBe(
      [
        "Olá, Matilda3D! Vim pelo site e tenho interesse no produto:",
        "*Chaveiro com nome* — cor: Rosa",
        "Valor no site: R$ 15,00",
        `Link: ${URL_SITE}/produtos/chaveiro-com-nome`,
      ].join("\n"),
    );
  });

  it("sem cor e sob consulta", () => {
    const m = mensagemPedido({ nome: "Topo de bolo", precoCentavos: null, slug: "topo-de-bolo" });
    expect(m.split("\n")[1]).toBe("*Topo de bolo*");
    expect(m).toContain("Valor no site: Sob consulta");
  });

  it("vira link wa.me com a mensagem codificada", () => {
    const link = linkPedido("5561999999999", "Olá & *teste*");
    expect(link).toBe("https://wa.me/5561999999999?text=Ol%C3%A1%20%26%20*teste*");
  });
});

describe("outros", () => {
  it("número da loja: configurado ou nada", () => {
    expect(numeroDaLoja("55 (61) 99999-9999")).toBe("5561999999999");
  });

  it("mensagem depois da encomenda", () => {
    expect(mensagemEncomendaEnviada(7)).toContain("encomenda #7");
  });
});
