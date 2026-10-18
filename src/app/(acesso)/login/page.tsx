import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar no painel" };

export default function PaginaLogin() {
  return (
    <>
      <h1 className="text-2xl font-medium">Entrar no painel</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">Área da equipe da Matilda3D.</p>
      <Suspense>
        <FormularioLogin />
      </Suspense>
    </>
  );
}
