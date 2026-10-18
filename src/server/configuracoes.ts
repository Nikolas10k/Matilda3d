import "server-only";
import { usuarioDoEmail } from "@/lib/auth-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function obterConfiguracoesCompletas() {
  const supabase = await createClient();
  const [{ data: marca }, { data: config }, { data: categorias }, { data: produtos }] = await Promise.all([
    supabase.from("marca").select("*").eq("id", 1).single(),
    supabase.from("configuracoes").select("*").eq("id", 1).single(),
    supabase.from("categorias").select("id, nome, slug, ordem").order("ordem"),
    supabase.from("produtos").select("categoria_id"),
  ]);
  if (!marca || !config) throw new Error("Não foi possível carregar as configurações.");

  const produtosPorCategoria = new Map<string, number>();
  for (const p of produtos ?? []) {
    if (p.categoria_id) produtosPorCategoria.set(p.categoria_id, (produtosPorCategoria.get(p.categoria_id) ?? 0) + 1);
  }

  return {
    marca,
    config,
    categorias: (categorias ?? []).map((c) => ({ ...c, produtos: produtosPorCategoria.get(c.id) ?? 0 })),
  };
}

export type UsuarioDaEquipe = {
  id: string;
  nome: string;
  /** Como a pessoa entra: o usuário (contas novas) ou o e-mail (contas antigas). */
  login: string;
  papel: "admin" | "membro";
  ativo: boolean;
};

/** Perfis da equipe com o login (fica no Auth, lido com a service_role). */
export async function listarUsuarios(): Promise<UsuarioDaEquipe[]> {
  const supabase = await createClient();
  const { data: perfis } = await supabase.from("perfis").select("id, nome, papel, ativo").order("nome");

  const logins = new Map<string, string>();
  try {
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    for (const u of data.users) {
      logins.set(u.id, usuarioDoEmail(u.email) ?? u.email ?? "");
    }
  } catch {
    // Sem service_role configurada, a lista aparece sem o login.
  }

  return (perfis ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    login: logins.get(p.id) ?? "",
    papel: p.papel === "admin" ? "admin" : "membro",
    ativo: p.ativo,
  }));
}
