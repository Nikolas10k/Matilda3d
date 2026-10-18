"use server";

import { revalidatePath, updateTag } from "next/cache";
import { emailDoUsuario } from "@/lib/auth-utils";
import { gerarSlug } from "@/lib/slug";
import { BUCKET_MARCA } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { errosPorCampo } from "@/lib/validacao/comum";
import {
  esquemaConfigCaixa,
  esquemaMarca,
  esquemaNomeCategoria,
  esquemaNovoUsuario,
  esquemaPadroesCalculadora,
  esquemaSenha,
} from "@/lib/validacao/configuracoes";
import { ehAdmin, exigirEquipe } from "@/server/auth";

export type ResultadoConfig = { ok: true } | { ok: false; erro: string; campos?: Record<string, string> };

const SO_ADMIN: ResultadoConfig = { ok: false, erro: "Só a responsável pode mudar as configurações." };

async function exigirAdmin() {
  const usuario = await exigirEquipe();
  return ehAdmin(usuario) ? usuario : null;
}

function invalido(erro: import("zod").ZodError): ResultadoConfig {
  return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(erro) };
}

export async function salvarMarca(valores: unknown): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaMarca.safeParse(valores);
  if (!r.success) return invalido(r.error);

  const supabase = await createClient();
  const { data: atual } = await supabase.from("marca").select("foto_criadores").eq("id", 1).single();
  const { error } = await supabase
    .from("marca")
    .update({
      nome: r.data.nome,
      whatsapp: r.data.whatsapp,
      instagram: r.data.instagram,
      texto_sobre: r.data.textoSobre || null,
      foto_criadores: r.data.fotoCriadores || null,
    })
    .eq("id", 1);
  if (error) return { ok: false, erro: "Não foi possível salvar os dados da marca." };

  if (atual?.foto_criadores && atual.foto_criadores !== r.data.fotoCriadores) {
    await supabase.storage.from(BUCKET_MARCA).remove([atual.foto_criadores]);
  }
  updateTag("marca");
  revalidatePath("/");
  revalidatePath("/sobre");
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

export async function salvarConfigCaixa(valores: unknown): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaConfigCaixa.safeParse(valores);
  if (!r.success) return invalido(r.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .update({ saldo_inicial_centavos: r.data.saldoInicial, data_inicio_caixa: r.data.dataInicio })
    .eq("id", 1);
  if (error) return { ok: false, erro: "Não foi possível salvar." };

  revalidatePath("/admin");
  revalidatePath("/admin/caixa");
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

export async function salvarPadroesCalculadora(valores: unknown): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaPadroesCalculadora.safeParse(valores);
  if (!r.success) return invalido(r.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracoes")
    .update({
      preco_kg_filamento_centavos: r.data.precoKg,
      custo_energia_hora_centavos: r.data.energiaHora,
      desgaste_hora_centavos: r.data.desgasteHora,
      embalagem_centavos: r.data.embalagem,
      taxa_falhas_pct: r.data.taxaFalhas,
      margem_padrao_pct: r.data.margem,
    })
    .eq("id", 1);
  if (error) return { ok: false, erro: "Não foi possível salvar." };

  revalidatePath("/admin/calculadora");
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}

// ——— Categorias ———

function revalidarCategorias() {
  updateTag("produtos");
  revalidatePath("/");
  revalidatePath("/produtos");
  revalidatePath("/admin/produtos");
  revalidatePath("/admin/configuracoes");
}

export async function criarCategoria(nome: string): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaNomeCategoria.safeParse(nome);
  if (!r.success) return { ok: false, erro: r.error.issues[0].message, campos: { nome: r.error.issues[0].message } };

  const supabase = await createClient();
  const { data: ultima } = await supabase.from("categorias").select("ordem").order("ordem", { ascending: false }).limit(1);
  const { error } = await supabase
    .from("categorias")
    .insert({ nome: r.data, slug: gerarSlug(r.data), ordem: (ultima?.[0]?.ordem ?? 0) + 1 });
  if (error) {
    return error.code === "23505"
      ? { ok: false, erro: "Já existe uma categoria com esse nome.", campos: { nome: "Já existe uma categoria com esse nome." } }
      : { ok: false, erro: "Não foi possível criar a categoria." };
  }
  revalidarCategorias();
  return { ok: true };
}

export async function renomearCategoria(id: string, nome: string): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaNomeCategoria.safeParse(nome);
  if (!r.success) return { ok: false, erro: r.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias").update({ nome: r.data, slug: gerarSlug(r.data) }).eq("id", id);
  if (error) {
    return { ok: false, erro: error.code === "23505" ? "Já existe uma categoria com esse nome." : "Não foi possível renomear." };
  }
  revalidarCategorias();
  return { ok: true };
}

export async function moverCategoria(id: string, direcao: "subir" | "descer"): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const supabase = await createClient();
  const { data: todas } = await supabase.from("categorias").select("id, ordem").order("ordem");
  const lista = todas ?? [];
  const i = lista.findIndex((c) => c.id === id);
  const j = direcao === "subir" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return { ok: true };

  // Renumera tudo em sequência, já com a troca (evita ordens repetidas).
  [lista[i], lista[j]] = [lista[j], lista[i]];
  const resultados = await Promise.all(
    lista.map((c, ordem) => supabase.from("categorias").update({ ordem: ordem + 1 }).eq("id", c.id)),
  );
  if (resultados.some((x) => x.error)) return { ok: false, erro: "Não foi possível reordenar." };
  revalidarCategorias();
  return { ok: true };
}

export async function excluirCategoria(id: string): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const supabase = await createClient();
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) return { ok: false, erro: "Não foi possível excluir a categoria." };
  revalidarCategorias();
  return { ok: true };
}

// ——— Usuários ———

function clienteAdmin() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

const SEM_CHAVE: ResultadoConfig = { ok: false, erro: "Falta configurar a chave secreta do Supabase (SUPABASE_SERVICE_ROLE_KEY)." };

/**
 * O admin cria o acesso com usuário e senha (sem convite por e-mail). Por trás,
 * o Supabase recebe um e-mail interno que nunca recebe mensagens (ver auth-utils).
 */
export async function criarUsuario(valores: unknown): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaNovoUsuario.safeParse(valores);
  if (!r.success) return invalido(r.error);
  const admin = clienteAdmin();
  if (!admin) return SEM_CHAVE;

  const { data, error } = await admin.auth.admin.createUser({
    email: emailDoUsuario(r.data.usuario),
    password: r.data.senha,
    email_confirm: true,
    user_metadata: { nome: r.data.nome, usuario: r.data.usuario },
  });
  if (error || !data.user) {
    const msg = error?.message.toLowerCase() ?? "";
    if (error?.code === "email_exists" || msg.includes("already")) {
      return { ok: false, erro: "Esse usuário já existe. Escolha outro.", campos: { usuario: "Esse usuário já existe. Escolha outro." } };
    }
    if (error?.code === "weak_password" || msg.includes("password")) {
      return { ok: false, erro: "Essa senha é fraca.", campos: { senha: "Use pelo menos 8 caracteres, misturando letras e números." } };
    }
    return { ok: false, erro: "Não foi possível criar o usuário. Tente de novo." };
  }

  // O gatilho cria o perfil inativo (não veio de convite); aqui ele é liberado com o papel escolhido.
  const { error: erroPerfil } = await admin
    .from("perfis")
    .update({ papel: r.data.papel, nome: r.data.nome, ativo: true })
    .eq("id", data.user.id);
  revalidatePath("/admin/configuracoes");
  if (erroPerfil) return { ok: false, erro: "Usuário criado, mas não foi possível liberar o acesso. Ative-o na lista abaixo." };
  return { ok: true };
}

/** O admin define uma nova senha para qualquer pessoa da equipe (inclusive a própria). */
export async function definirSenhaUsuario(id: string, senha: string): Promise<ResultadoConfig> {
  if (!(await exigirAdmin())) return SO_ADMIN;
  const r = esquemaSenha.safeParse(senha);
  if (!r.success) return { ok: false, erro: r.error.issues[0].message, campos: { senha: r.error.issues[0].message } };
  const admin = clienteAdmin();
  if (!admin) return SEM_CHAVE;

  const { error } = await admin.auth.admin.updateUserById(id, { password: r.data });
  if (error) {
    const fraca = error.code === "weak_password";
    return { ok: false, erro: fraca ? "Essa senha é fraca. Misture letras e números." : "Não foi possível trocar a senha." };
  }
  return { ok: true };
}

export async function alterarUsuario(
  id: string,
  mudancas: { papel?: "admin" | "membro"; ativo?: boolean },
): Promise<ResultadoConfig> {
  const usuario = await exigirAdmin();
  if (!usuario) return SO_ADMIN;
  if (id === usuario.id) return { ok: false, erro: "Você não pode alterar o próprio papel nem desativar a própria conta." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("perfis").update(mudancas).eq("id", id).select("id");
  if (error || !data?.length) return { ok: false, erro: "Não foi possível alterar o usuário." };
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}
