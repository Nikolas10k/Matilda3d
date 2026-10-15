// Funções puras de autenticação (testáveis, sem dependência do Next/Supabase).

/**
 * Só aceita voltar para dentro do painel. Evita "open redirect": um link
 * malicioso como /login?voltar=https://site-falso.com não leva para fora.
 */
export function caminhoSeguroPainel(voltar: string | null | undefined): string {
  if (!voltar) return "/admin";
  if (!voltar.startsWith("/admin")) return "/admin";
  if (voltar.startsWith("//") || voltar.includes("\\")) return "/admin";
  return voltar;
}

/** Só aceita caminhos internos (usado após confirmar e-mail/convite). */
export function caminhoInterno(caminho: string | null | undefined, padrao = "/admin"): string {
  if (!caminho || !caminho.startsWith("/") || caminho.startsWith("//") || caminho.includes("\\")) {
    return padrao;
  }
  return caminho;
}

/** Traduz as mensagens de erro do Supabase Auth para o português. */
export function traduzirErroAuth(mensagem: string | undefined, codigo?: string): string {
  const texto = `${codigo ?? ""} ${mensagem ?? ""}`.toLowerCase();

  if (texto.includes("invalid login credentials") || texto.includes("invalid_credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (texto.includes("email not confirmed") || texto.includes("email_not_confirmed")) {
    return "Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.";
  }
  if (texto.includes("rate limit") || texto.includes("over_request_rate_limit") || texto.includes("too many")) {
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  }
  if (texto.includes("same_password") || texto.includes("should be different")) {
    return "A nova senha precisa ser diferente da atual.";
  }
  if (texto.includes("weak_password") || texto.includes("password should be")) {
    return "Essa senha é fraca. Use pelo menos 8 caracteres, misturando letras e números.";
  }
  if (texto.includes("user_banned")) {
    return "Este acesso foi bloqueado. Fale com a responsável.";
  }
  if (texto.includes("session") && (texto.includes("missing") || texto.includes("expired"))) {
    return "O link expirou. Peça um novo e-mail de recuperação.";
  }
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}
