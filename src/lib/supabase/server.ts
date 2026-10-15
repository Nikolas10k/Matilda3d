import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente para Server Components, Server Actions e Route Handlers, com a sessão
// do usuário logado (via cookies). Crie um novo a cada requisição.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
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
