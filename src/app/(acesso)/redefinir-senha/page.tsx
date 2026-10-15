import type { Metadata } from "next";
import { FormularioNovaSenha } from "./formulario-nova-senha";

export const metadata: Metadata = { title: "Criar nova senha" };

// Aberta pelo link do e-mail de recuperação ou de convite (via /auth/confirmar).
export default function PaginaRedefinirSenha() {
  return (
    <>
      <h1 className="text-2xl font-bold">Criar senha</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Escolha uma senha com pelo menos 8 caracteres. Você vai usá-la para entrar no painel.
      </p>
      <FormularioNovaSenha />
    </>
  );
}
