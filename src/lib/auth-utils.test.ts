import { describe, expect, it } from "vitest";
import { caminhoInterno, caminhoSeguroPainel, traduzirErroAuth } from "./auth-utils";

describe("caminhoSeguroPainel", () => {
  it.each([
    [null, "/admin"],
    ["", "/admin"],
    ["/admin", "/admin"],
    ["/admin/vendas?status=pago", "/admin/vendas?status=pago"],
    ["/produtos", "/admin"],
    ["https://site-falso.com", "/admin"],
    ["//site-falso.com/admin", "/admin"],
    ["/admin\\..\\x", "/admin"],
  ])("%j → %s", (entrada, esperado) => {
    expect(caminhoSeguroPainel(entrada)).toBe(esperado);
  });
});

describe("caminhoInterno", () => {
  it("aceita caminhos internos e recusa externos", () => {
    expect(caminhoInterno("/redefinir-senha")).toBe("/redefinir-senha");
    expect(caminhoInterno("https://x.com")).toBe("/admin");
    expect(caminhoInterno("//x.com")).toBe("/admin");
    expect(caminhoInterno(null, "/login")).toBe("/login");
  });
});

describe("traduzirErroAuth", () => {
  it("traduz os erros mais comuns", () => {
    expect(traduzirErroAuth("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
    expect(traduzirErroAuth("", "email_not_confirmed")).toContain("Confirme seu e-mail");
    expect(traduzirErroAuth("Request rate limit reached")).toContain("Muitas tentativas");
    expect(traduzirErroAuth("New password should be different from the old password.", "same_password")).toBe(
      "A nova senha precisa ser diferente da atual.",
    );
  });

  it("tem mensagem genérica em português para o resto", () => {
    expect(traduzirErroAuth("Something odd")).toBe("Não foi possível concluir agora. Tente de novo em instantes.");
  });
});
