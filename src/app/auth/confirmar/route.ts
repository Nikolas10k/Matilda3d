import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { caminhoInterno } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/server";

// Destino dos links enviados por e-mail (convite e recuperação de senha).
// Aceita os dois formatos do Supabase:
//   ?token_hash=...&type=invite|recovery  (modelo de e-mail recomendado, docs/05)
//   ?code=...                              (fluxo PKCE padrão)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const proximo = caminhoInterno(searchParams.get("next"), "/admin");
  const supabase = await createClient();

  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const codigo = searchParams.get("code");

  let ok = false;
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    ok = !error;
  } else if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(new URL("/login?aviso=link-invalido", origin));
  }
  return NextResponse.redirect(new URL(proximo, origin));
}
