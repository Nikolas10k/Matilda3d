"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { caminhoSeguroPainel, emailParaLogin, traduzirErroAuth } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

export type EstadoFormulario = {
  erro?: string;
  sucesso?: string;
  campos?: Partial<Record<string, string>>;
  /** Valores digitados, devolvidos para o formulário não apagar o que a pessoa escreveu. */
  valores?: Partial<Record<string, string>>;
};

const MSG_OBRIGATORIO = "Preencha este campo.";
const email = z.string().trim().min(1, MSG_OBRIGATORIO).email("Digite um e-mail válido, ex.: nome@gmail.com.");

function errosDosCampos(erro: z.ZodError): EstadoFormulario["campos"] {
  const campos: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = String(issue.path[0]);
    campos[campo] ??= issue.message;
  }
  return campos;
}

// Entra com o usuário criado pelo admin; contas antigas ainda podem usar o e-mail completo.
const esquemaLogin = z.object({
  usuario: z.string().trim().min(1, MSG_OBRIGATORIO),
  senha: z.string().min(1, MSG_OBRIGATORIO),
});

export async function entrar(_estado: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const valores = { usuario: String(formData.get("usuario") ?? "") };
  const dados = esquemaLogin.safeParse({ usuario: formData.get("usuario"), senha: formData.get("senha") });
  if (!dados.success) return { campos: errosDosCampos(dados.error), valores };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: emailParaLogin(dados.data.usuario),
    password: dados.data.senha,
  });
  if (error) return { erro: traduzirErroAuth(error.message, error.code), valores };

  redirect(caminhoSeguroPainel(String(formData.get("voltar") ?? "")));
}

export async function sair(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const esquemaRecuperacao = z.object({ email });

export async function solicitarRecuperacao(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const valores = { email: String(formData.get("email") ?? "") };
  const dados = esquemaRecuperacao.safeParse({ email: formData.get("email") });
  if (!dados.success) return { campos: errosDosCampos(dados.error), valores };

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(dados.data.email, {
    redirectTo: `${site}/auth/confirmar?next=/redefinir-senha`,
  });

  // Por segurança, a resposta é a mesma exista ou não uma conta com esse e-mail.
  if (error && error.code === "over_email_send_rate_limit") {
    return { erro: "Já enviamos um e-mail há pouco. Espere alguns minutos antes de pedir outro.", valores };
  }
  return {
    sucesso:
      "Se esse e-mail tiver acesso ao painel, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.",
  };
}

const esquemaNovaSenha = z
  .object({
    senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmacao: z.string().min(1, MSG_OBRIGATORIO),
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não são iguais.",
  });

export async function redefinirSenha(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const dados = esquemaNovaSenha.safeParse({
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!dados.success) return { campos: errosDosCampos(dados.error) };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return { erro: "O link expirou ou já foi usado. Peça um novo e-mail de recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: dados.data.senha });
  if (error) return { erro: traduzirErroAuth(error.message, error.code) };

  redirect("/admin");
}
