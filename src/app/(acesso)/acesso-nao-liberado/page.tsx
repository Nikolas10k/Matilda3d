import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sair } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Acesso não liberado" };

// Usuário logado sem perfil ativo (não convidado ou desativado). docs/07, Fase 2.
export default function PaginaAcessoNaoLiberado() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
        <LockKeyhole className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-2xl font-bold">Acesso não liberado</h1>
      <p className="text-ink-muted">Fale com a responsável para liberar seu acesso ao painel.</p>
      <form action={sair} className="w-full">
        <Button type="submit" variant="outline" size="lg" className="mt-2 w-full">
          Sair e entrar com outra conta
        </Button>
      </form>
    </div>
  );
}
