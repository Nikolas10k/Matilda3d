import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

// Cliente para Client Components. Usa só a chave anon: tudo passa pelo RLS.
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
