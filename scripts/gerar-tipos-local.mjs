// Gera src/types/database.ts a partir das migrações, sem precisar de um projeto
// Supabase: aplica tudo num Postgres em memória (PGlite) e lê o catálogo.
// O formato segue o do `supabase gen types typescript`. Quando o projeto real
// existir, prefira `pnpm db:tipos` (gera direto do Supabase).
//
// Uso: pnpm db:tipos:local
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const raiz = join(import.meta.dirname, "..");
const db = await PGlite.create();
await db.exec(readFileSync(join(raiz, "supabase/tests/supabase-shim.sql"), "utf8"));
const pasta = join(raiz, "supabase/migrations");
for (const f of readdirSync(pasta).filter((f) => f.endsWith(".sql")).sort()) {
  await db.exec(readFileSync(join(pasta, f), "utf8"));
}

const TIPOS = {
  int2: "number", int4: "number", int8: "number", numeric: "number", float4: "number", float8: "number",
  text: "string", varchar: "string", uuid: "string", date: "string", timestamptz: "string",
  timestamp: "string", interval: "unknown", bool: "boolean", jsonb: "Json", json: "Json",
};
const ts = (udt) => (udt.startsWith("_") ? `${ts(udt.slice(1))}[]` : (TIPOS[udt] ?? "unknown"));

const colunas = (await db.query(`
  select c.table_name, c.column_name, c.udt_name, c.is_nullable = 'YES' as nulo,
         c.column_default is not null as tem_default, c.is_identity = 'YES' as identidade,
         c.is_generated = 'ALWAYS' as gerada, t.table_type
  from information_schema.columns c
  join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
  where c.table_schema = 'public'
  order by c.table_name, c.ordinal_position`)).rows;

const fks = (await db.query(`
  select con.conname, rel.relname as tabela, ref.relname as referencia,
         array(select a.attname from unnest(con.conkey) k join pg_attribute a
               on a.attrelid = con.conrelid and a.attnum = k order by a.attnum) as colunas,
         array(select a.attname from unnest(con.confkey) k join pg_attribute a
               on a.attrelid = con.confrelid and a.attnum = k order by a.attnum) as colunas_ref,
         exists (select 1 from pg_constraint u where u.conrelid = con.conrelid
                 and u.contype in ('p','u') and u.conkey = con.conkey) as um_para_um
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_class ref on ref.oid = con.confrelid
  where con.contype = 'f' and rel.relnamespace = 'public'::regnamespace
    and ref.relnamespace = 'public'::regnamespace
  order by con.conname`)).rows;

const funcoes = (await db.query(`
  select p.proname, p.pronargdefaults,
         coalesce(p.proargnames, '{}') as nomes,
         array(select format_type(t, null) from unnest(p.proargtypes) t) as tipos_args,
         (select typname from pg_type where oid = p.prorettype) as retorno
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and (select typname from pg_type where oid = p.prorettype) <> 'trigger'
  order by p.proname`)).rows;

const TIPOS_FORMAT = { uuid: "string", text: "string", integer: "number", date: "string", jsonb: "Json", interval: "unknown", boolean: "boolean" };

const porTabela = new Map();
for (const c of colunas) {
  if (!porTabela.has(c.table_name)) porTabela.set(c.table_name, { tipo: c.table_type, colunas: [] });
  porTabela.get(c.table_name).colunas.push(c);
}

const linhas = [];
const tabelas = [...porTabela].filter(([, t]) => t.tipo === "BASE TABLE");
const views = [...porTabela].filter(([, t]) => t.tipo === "VIEW");

function relacionamentos(tabela, ind) {
  const lista = fks.filter((f) => f.tabela === tabela);
  if (!lista.length) return `${ind}Relationships: []`;
  const itens = lista.map((f) => [
    `${ind}  {`,
    `${ind}    foreignKeyName: "${f.conname}"`,
    `${ind}    columns: [${f.colunas.map((c) => `"${c}"`).join(", ")}]`,
    `${ind}    isOneToOne: ${f.um_para_um}`,
    `${ind}    referencedRelation: "${f.referencia}"`,
    `${ind}    referencedColumns: [${f.colunas_ref.map((c) => `"${c}"`).join(", ")}]`,
    `${ind}  },`,
  ].join("\n"));
  return `${ind}Relationships: [\n${itens.join("\n")}\n${ind}]`;
}

linhas.push("    Tables: {");
for (const [nome, t] of tabelas) {
  const i = "          ";
  const row = t.colunas.map((c) => `${i}${c.column_name}: ${ts(c.udt_name)}${c.nulo ? " | null" : ""}`);
  const ins = t.colunas.map((c) => {
    if (c.gerada) return `${i}${c.column_name}?: never`;
    const opcional = c.nulo || c.tem_default || c.identidade;
    return `${i}${c.column_name}${opcional ? "?" : ""}: ${ts(c.udt_name)}${c.nulo ? " | null" : ""}`;
  });
  const upd = t.colunas.map((c) =>
    c.gerada ? `${i}${c.column_name}?: never` : `${i}${c.column_name}?: ${ts(c.udt_name)}${c.nulo ? " | null" : ""}`);
  linhas.push(
    `      ${nome}: {`,
    `        Row: {`, ...row, `        }`,
    `        Insert: {`, ...ins, `        }`,
    `        Update: {`, ...upd, `        }`,
    relacionamentos(nome, "        "),
    `      }`,
  );
}
linhas.push("    }", "    Views: {");
for (const [nome, t] of views) {
  linhas.push(
    `      ${nome}: {`,
    `        Row: {`,
    ...t.colunas.map((c) => `          ${c.column_name}: ${ts(c.udt_name)} | null`),
    `        }`,
    `        Relationships: []`,
    `      }`,
  );
}
linhas.push("    }", "    Functions: {");
for (const f of funcoes) {
  const n = f.tipos_args.length;
  const args = f.tipos_args.map((tipo, idx) => {
    const opcional = idx >= n - f.pronargdefaults;
    return `          ${f.nomes[idx]}${opcional ? "?" : ""}: ${TIPOS_FORMAT[tipo] ?? "unknown"}`;
  });
  const retorno = f.retorno === "void" ? "undefined" : ts(f.retorno);
  linhas.push(
    `      ${f.proname}: {`,
    n ? `        Args: {\n${args.join("\n")}\n        }` : `        Args: never`,
    `        Returns: ${retorno}`,
    `      }`,
  );
}
linhas.push("    }", "    Enums: {", "      [_ in never]: never", "    }",
  "    CompositeTypes: {", "      [_ in never]: never", "    }");

const saida = `// ARQUIVO GERADO. Não edite à mão.
// Gerado por scripts/gerar-tipos-local.mjs a partir de supabase/migrations.
// Com o projeto Supabase criado, regenere com \`pnpm db:tipos\`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
${linhas.join("\n")}
  }
}

type DefaultSchema = Database["public"]

export type Tables<T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])> =
  (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never
`;

writeFileSync(join(raiz, "src/types/database.ts"), saida);
console.log(`src/types/database.ts: ${tabelas.length} tabelas, ${views.length} views, ${funcoes.length} funções.`);
