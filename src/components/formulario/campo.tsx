import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CampoProps = ComponentProps<typeof Input> & {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
};

/** Input com rótulo, dica e mensagem de erro ligados por aria (acessibilidade). */
export function Campo({ id, rotulo, erro, dica, className, ...props }: CampoProps) {
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </Label>
      <Input
        id={id}
        name={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={[idDica, idErro].filter(Boolean).join(" ") || undefined}
        {...props}
      />
      {dica && !erro && (
        <p id={idDica} className="text-sm text-ink-muted">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-sm font-medium text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}

/** Aviso no topo do formulário (erro geral ou sucesso), anunciado por leitores de tela. */
export function AvisoFormulario({ tipo, children }: { tipo: "erro" | "sucesso"; children: React.ReactNode }) {
  return (
    <p
      role={tipo === "erro" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-sm font-medium",
        tipo === "erro"
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      {children}
    </p>
  );
}
