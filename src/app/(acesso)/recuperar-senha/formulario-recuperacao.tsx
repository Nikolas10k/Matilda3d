"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AvisoFormulario, Campo } from "@/components/formulario/campo";
import { Button } from "@/components/ui/button";
import { solicitarRecuperacao, type EstadoFormulario } from "@/server/actions/auth";

export function FormularioRecuperacao() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(solicitarRecuperacao, {});

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {estado.erro && <AvisoFormulario tipo="erro">{estado.erro}</AvisoFormulario>}
      {estado.sucesso ? (
        <AvisoFormulario tipo="sucesso">{estado.sucesso}</AvisoFormulario>
      ) : (
        <>
          <Campo
            id="email"
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={estado.valores?.email}
            erro={estado.campos?.email}
          />
          <Button type="submit" size="lg" disabled={enviando} className="mt-2 w-full">
            {enviando ? "Enviando…" : "Enviar link"}
          </Button>
        </>
      )}
      <Link
        href="/login"
        className="mx-auto inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
      >
        Voltar para o login
      </Link>
    </form>
  );
}
