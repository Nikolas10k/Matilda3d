// Banco Postgres em memória (PGlite) com as migrações aplicadas, para testes.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const PASTA_SUPABASE = join(import.meta.dirname, "..");

export type Papel = "anon" | "authenticated" | "service_role";

export async function criarBanco({ comSeed = false } = {}) {
  const db = await PGlite.create();
  await db.exec(readFileSync(join(import.meta.dirname, "supabase-shim.sql"), "utf8"));

  const pastaMigracoes = join(PASTA_SUPABASE, "migrations");
  for (const arquivo of readdirSync(pastaMigracoes).filter((f) => f.endsWith(".sql")).sort()) {
    try {
      await db.exec(readFileSync(join(pastaMigracoes, arquivo), "utf8"));
    } catch (erro) {
      throw new Error(`Falha ao aplicar ${arquivo}: ${(erro as Error).message}`);
    }
  }
  if (comSeed) await db.exec(readFileSync(join(PASTA_SUPABASE, "seed.sql"), "utf8"));

  return db;
}

/** Cria um usuário no auth (o gatilho cria o perfil como membro). */
export async function criarUsuario(
  db: PGlite,
  { nome, papel = "membro", ativo = true }: { nome: string; papel?: "admin" | "membro"; ativo?: boolean },
): Promise<string> {
  await comoSuperusuario(db);
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id",
    [`${nome.toLowerCase()}@exemplo.com`, JSON.stringify({ nome })],
  );
  const id = rows[0].id;
  await db.query("update perfis set papel = $1, ativo = $2 where id = $3", [papel, ativo, id]);
  return id;
}

/** Usuário autenticado sem perfil (ex.: alguém que se cadastrou sem convite). */
export async function criarUsuarioSemPerfil(db: PGlite): Promise<string> {
  await comoSuperusuario(db);
  const { rows } = await db.query<{ id: string }>(
    "insert into auth.users (email) values ('estranho@exemplo.com') returning id",
  );
  await db.query("delete from perfis where id = $1", [rows[0].id]);
  return rows[0].id;
}

/** Passa a executar como um papel da API, como faria o PostgREST. */
export async function como(db: PGlite, papel: Papel, usuarioId: string | null = null) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [usuarioId ?? ""]);
  await db.exec(`set role ${papel}`);
}

export async function comoSuperusuario(db: PGlite) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', '', false)");
}
