import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Cliente com a service_role key: ignora o RLS. Use APENAS no servidor e só
// para o que o RLS não cobre de propósito (formulário de encomenda, cliques do
// WhatsApp, convite de usuários). Nunca importe este arquivo em Client Components.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Variável SUPABASE_SERVICE_ROLE_KEY não configurada (veja .env.example).");
  }

  return createClient(supabaseUrl(), serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
