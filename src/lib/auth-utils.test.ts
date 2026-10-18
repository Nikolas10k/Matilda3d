import { describe, expect, it } from "vitest";
import {
  caminhoInterno,
  caminhoSeguroPainel,
  emailDoUsuario,
  emailParaLogin,
  normalizarUsuario,
  PADRAO_USUARIO,
  traduzirErroAuth,
  usuarioDoEmail,
} from "./auth-utils";

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
    expect(traduzirErroAuth("Invalid login credentials")).toBe("Usuário ou senha incorretos.");
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

describe("usuário e senha", () => {
  it("normaliza o nome de usuário", () => {
    expect(normalizarUsuario(" Maria.Clara ")).toBe("maria.clara");
    expect(normalizarUsuario("Tharík")).toBe("tharik");
  });

  it("valida o formato do usuário", () => {
    expect(PADRAO_USUARIO.test("mariaclara")).toBe(true);
    expect(PADRAO_USUARIO.test("maria_clara.2")).toBe(true);
    expect(PADRAO_USUARIO.test("ab")).toBe(false);
    expect(PADRAO_USUARIO.test("maria clara")).toBe(false);
    expect(PADRAO_USUARIO.test(".maria")).toBe(false);
    expect(PADRAO_USUARIO.test("maria@x")).toBe(false);
  });

  it("converte usuário em e-mail interno e volta", () => {
    expect(emailDoUsuario("MariaClara")).toBe("mariaclara@usuarios.matilda3d.vercel.app");
    expect(usuarioDoEmail("mariaclara@usuarios.matilda3d.vercel.app")).toBe("mariaclara");
    expect(usuarioDoEmail("admin@admin.com")).toBeNull();
    expect(usuarioDoEmail(null)).toBeNull();
  });

  it("o login aceita usuário ou e-mail completo (contas antigas)", () => {
    expect(emailParaLogin(" Tharik ")).toBe("tharik@usuarios.matilda3d.vercel.app");
    expect(emailParaLogin("Admin@Admin.com")).toBe("admin@admin.com");
  });
});
