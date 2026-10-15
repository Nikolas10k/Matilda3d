import type { Metadata } from "next";
import { FormularioRecuperacao } from "./formulario-recuperacao";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function PaginaRecuperarSenha() {
  return (
    <>
      <h1 className="text-2xl font-bold">Recuperar senha</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        Digite o e-mail que você usa no painel. Vamos mandar um link para você criar uma nova senha.
      </p>
      <FormularioRecuperacao />
    </>
  );
}
