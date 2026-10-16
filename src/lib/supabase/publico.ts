import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente para o site público, sem sessão nem cookies: só lê o que o RLS libera
// para visitantes (produtos ativos, fotos, categorias e marca). Pode ser usado
// dentro de funções com 'use cache'.
export function createPublicClient() {
  return createClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
