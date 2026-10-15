import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Papel = "admin" | "membro";

export type UsuarioPainel = {
  id: string;
  email: string;
  nome: string;
  papel: Papel;
};

type Sessao = {
  id: string;
  email: string;
  /** null quando o usuário não tem perfil ativo (não convidado ou desativado). */
  perfil: { nome: string; papel: Papel } | null;
};

/**
 * Lê a sessão do Supabase e o perfil do usuário. Memorizado por requisição:
 * layout, página e componentes podem chamar à vontade.
 * O RLS de `perfis` só deixa ler quem é da equipe ativa, então um usuário
 * inativo ou sem perfil volta com `perfil: null`.
 */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, papel, ativo")
    .eq("id", claims.sub)
    .maybeSingle();

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    perfil:
      perfil?.ativo ? { nome: perfil.nome, papel: perfil.papel === "admin" ? "admin" : "membro" } : null,
  };
});

/** Garante usuário da equipe ativa. Sem login → /login; sem acesso → aviso. */
export async function exigirEquipe(): Promise<UsuarioPainel> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  if (!sessao.perfil) redirect("/acesso-nao-liberado");
  return { id: sessao.id, email: sessao.email, ...sessao.perfil };
}

export function ehAdmin(usuario: UsuarioPainel): boolean {
  return usuario.papel === "admin";
}
