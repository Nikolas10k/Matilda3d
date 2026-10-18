"use client";

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
        id="usuario"
        rotulo="Usuário"
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        defaultValue={estado.valores?.usuario}
        erro={estado.campos?.usuario}
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

      <p className="text-center text-sm text-ink-muted">Esqueceu a senha? Peça para a responsável criar uma nova no painel.</p>
    </form>
  );
}
