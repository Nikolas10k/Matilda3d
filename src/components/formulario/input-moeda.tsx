"use client";

import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { centavosParaTexto, paraCentavos } from "@/lib/format";
import { cn } from "@/lib/utils";

type InputMoedaProps = Omit<ComponentProps<typeof Input>, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (texto: string) => void;
};

/**
 * Campo de dinheiro com teclado numérico no celular e "R$" fixo à esquerda.
 * Aceita "12", "12,5", "1.234,56"; ao sair do campo, formata como "12,50".
 * O valor continua texto: a conversão para centavos acontece na validação.
 */
export function InputMoeda({ value, onValueChange, onBlur, className, ...props }: InputMoedaProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base text-ink-muted"
      >
        R$
      </span>
      <Input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        onChange={(e) => onValueChange(e.target.value.replace(/[^\d.,]/g, ""))}
        onBlur={(e) => {
          const centavos = paraCentavos(value);
          if (centavos !== null) onValueChange(centavosParaTexto(centavos));
          onBlur?.(e);
        }}
        className={cn("pl-10 tabular", className)}
        {...props}
      />
    </div>
  );
}
