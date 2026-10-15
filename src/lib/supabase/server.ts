import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente para Server Components, Server Actions e Route Handlers, com a sessão
// do usuário logado (via cookies). Crie um novo a cada requisição.
export async function createClient() {
  // O cliente do Supabase usa Date.now() ao carregar a sessão; com
  // cacheComponents isso só pode rodar na hora da requisição, nunca na
  // pré-renderização.
  await connection();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component, onde não dá para gravar
          // cookies. O proxy (src/proxy.ts) já renova a sessão a cada requisição.
        }
      },
    },
  });
}
