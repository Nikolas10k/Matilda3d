// Leitura centralizada das variáveis do Supabase, com mensagens claras quando faltam.

export function supabaseConfigurado(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Variável NEXT_PUBLIC_SUPABASE_URL não configurada (veja .env.example).");
  return url;
}

export function supabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("Variável NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada (veja .env.example).");
  }
  return key;
}
