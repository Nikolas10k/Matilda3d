import "server-only";
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
  email: string;
  papel: "admin" | "membro";
  ativo: boolean;
  pendente: boolean;
};

/** Perfis da equipe com e-mail (o e-mail fica no Auth, lido com a service_role). */
export async function listarUsuarios(): Promise<UsuarioDaEquipe[]> {
  const supabase = await createClient();
  const { data: perfis } = await supabase.from("perfis").select("id, nome, papel, ativo").order("nome");

  const emails = new Map<string, { email: string; pendente: boolean }>();
  try {
    const { data } = await createAdminClient().auth.admin.listUsers({ perPage: 200 });
    for (const u of data.users) {
      emails.set(u.id, { email: u.email ?? "", pendente: Boolean(u.invited_at && !u.last_sign_in_at) });
    }
  } catch {
    // Sem service_role configurada, a lista aparece sem e-mails.
  }

  return (perfis ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    email: emails.get(p.id)?.email ?? "",
    papel: p.papel === "admin" ? "admin" : "membro",
    ativo: p.ativo,
    pendente: emails.get(p.id)?.pendente ?? false,
  }));
}
