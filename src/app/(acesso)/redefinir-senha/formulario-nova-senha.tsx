"use client";

import { useActionState } from "react";
import { AvisoFormulario, Campo } from "@/components/formulario/campo";
import { Button } from "@/components/ui/button";
import { redefinirSenha, type EstadoFormulario } from "@/server/actions/auth";

export function FormularioNovaSenha() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(redefinirSenha, {});

  return (
    <form action={acao} className="flex flex-col gap-4" noValidate>
      {estado.erro && <AvisoFormulario tipo="erro">{estado.erro}</AvisoFormulario>}
      <Campo
        id="senha"
        rotulo="Nova senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        erro={estado.campos?.senha}
      />
      <Campo
        id="confirmacao"
        rotulo="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        required
        erro={estado.campos?.confirmacao}
      />
      <Button type="submit" size="lg" disabled={enviando} className="mt-2 w-full">
        {enviando ? "Salvando…" : "Salvar e entrar"}
      </Button>
    </form>
  );
}
