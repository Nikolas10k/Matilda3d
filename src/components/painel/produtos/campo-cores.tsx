"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  id: string;
  cores: string[];
  aoMudar: (cores: string[]) => void;
  erro?: string;
};

/** Lista de cores em etiquetas: digite e toque em "Adicionar" (ou Enter / vírgula). */
export function CampoCores({ id, cores, aoMudar, erro }: Props) {
  const [texto, setTexto] = useState("");

  function adicionar() {
    const novas = texto
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c && !cores.some((existente) => existente.toLowerCase() === c.toLowerCase()));
    if (novas.length) aoMudar([...cores, ...novas]);
    setTexto("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={texto}
          placeholder="Ex.: Rosa"
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${id}-erro` : `${id}-dica`}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              adicionar();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={adicionar} disabled={!texto.trim()}>
          Adicionar
        </Button>
      </div>
      <p id={`${id}-dica`} className="text-sm text-ink-muted">
        As cores aparecem para o cliente escolher na página do produto.
      </p>
      {cores.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Cores disponíveis">
          {cores.map((cor) => (
            <li key={cor}>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong py-1 pr-1 pl-3 text-sm font-bold text-ink">
                {cor}
                <button
                  type="button"
                  onClick={() => aoMudar(cores.filter((c) => c !== cor))}
                  aria-label={`Remover a cor ${cor}`}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-ink/10"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {erro && (
        <p id={`${id}-erro`} className="text-sm font-medium text-danger">
          {erro}
        </p>
      )}
    </div>
  );
}
