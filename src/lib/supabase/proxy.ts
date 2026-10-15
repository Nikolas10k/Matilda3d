import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseConfigurado, supabaseUrl } from "./env";

// Renova a sessão do Supabase a cada requisição e protege as rotas do painel.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sem Supabase configurado (ex.: primeiro `pnpm dev`), o site segue funcionando.
  if (!supabaseConfigurado()) return response;

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims: é o getClaims que
  // valida e renova o token.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims);

  const caminho = request.nextUrl.pathname;

  if (!logado && caminho.startsWith("/admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("voltar", caminho + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Quem já está logado não precisa ver a tela de login.
  if (logado && caminho === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
