"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AvisoFormulario, Campo } from "@/components/formulario/campo";
import { Button } from "@/components/ui/button";
import { entrar, type EstadoFormulario } from "@/server/actions/auth";

const AVISOS: Record<string, string> = {
  "link-invalido": "Esse link expirou ou já foi usado. Peça um novo e-mail de recuperação.",
};

export function FormularioLogin() {
  const params = useSearchParams();
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(entrar, {});
  const aviso = AVISOS[params.get("aviso") ?? ""];

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {aviso && !estado.erro && <AvisoFormulario tipo="erro">{aviso}</AvisoFormulario>}
      {estado.erro && <AvisoFormulario tipo="erro">{estado.erro}</AvisoFormulario>}

      <input type="hidden" name="voltar" value={params.get("voltar") ?? ""} />
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
      <Campo
        id="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        required
        erro={estado.campos?.senha}
      />

      <Button type="submit" size="lg" disabled={enviando} className="mt-2 w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </Button>

      <Link
        href="/recuperar-senha"
        className="mx-auto inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </form>
  );
}
