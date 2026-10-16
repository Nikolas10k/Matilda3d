"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, UserPlus, UserRound, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatarWhatsApp } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buscarClientes, type ClienteEncontrado } from "@/server/actions/vendas";

export type ValorCliente =
  | { modo: "avulsa" }
  | { modo: "existente"; id: string; nome?: string; whatsapp?: string | null }
  | { modo: "novo"; nome: string; whatsapp: string; instagram: string };

type Props = {
  valor: ValorCliente;
  aoMudar: (v: ValorCliente) => void;
  erros?: Partial<Record<"id" | "nome" | "whatsapp" | "instagram", string>>;
  /** false: só "avulsa" ou cliente já cadastrado (usado ao editar uma venda). */
  permitirNovo?: boolean;
};

/** Cliente da venda: avulsa (sem cliente), buscar um cadastrado ou cadastrar na hora. */
export function SeletorCliente({ valor, aoMudar, erros, permitirNovo = true }: Props) {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<ClienteEncontrado[]>([]);
  const [buscando, iniciarBusca] = useTransition();

  useEffect(() => {
    if (valor.modo !== "existente" || valor.id || termo.trim().length < 2) return;
    const espera = setTimeout(() => {
      iniciarBusca(async () => setResultados(await buscarClientes(termo)));
    }, 300);
    return () => clearTimeout(espera);
  }, [termo, valor]);

  const abas: { modo: ValorCliente["modo"]; rotulo: string; icone: typeof UserRound }[] = [
    { modo: "avulsa", rotulo: "Avulsa", icone: UserRound },
    { modo: "existente", rotulo: "Buscar", icone: Search },
    ...(permitirNovo ? [{ modo: "novo" as const, rotulo: "Novo", icone: UserPlus }] : []),
  ];

  function trocarModo(modo: ValorCliente["modo"]) {
    if (modo === valor.modo) return;
    if (modo === "avulsa") aoMudar({ modo: "avulsa" });
    if (modo === "existente") aoMudar({ modo: "existente", id: "" });
    if (modo === "novo") aoMudar({ modo: "novo", nome: termo, whatsapp: "", instagram: "" });
  }

  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Cliente da venda" className={cn("grid gap-1 rounded-full bg-surface-alt p-1", permitirNovo ? "grid-cols-3" : "grid-cols-2")}>
        {abas.map(({ modo, rotulo, icone: Icone }) => (
          <button
            key={modo}
            type="button"
            role="radio"
            aria-checked={valor.modo === modo}
            onClick={() => trocarModo(modo)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors",
              valor.modo === modo ? "bg-white text-ink shadow-sm" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icone className="size-4" aria-hidden="true" />
            {rotulo}
          </button>
        ))}
      </div>

      {valor.modo === "avulsa" && (
        <p className="text-sm text-ink-muted">Venda sem cliente cadastrado (ex.: venda na feira).</p>
      )}

      {valor.modo === "existente" &&
        (valor.id ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand/40 bg-brand-soft px-4 py-3">
            <span>
              <span className="block font-bold">{valor.nome}</span>
              {valor.whatsapp && <span className="block text-sm text-ink-muted">{formatarWhatsApp(valor.whatsapp)}</span>}
            </span>
            <button
              type="button"
              onClick={() => aoMudar({ modo: "existente", id: "" })}
              aria-label="Trocar cliente"
              className="flex size-11 items-center justify-center rounded-full hover:bg-brand/15"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="busca-cliente" className="sr-only">
              Buscar cliente por nome ou WhatsApp
            </label>
            <Input
              id="busca-cliente"
              value={termo}
              autoComplete="off"
              placeholder="Nome ou WhatsApp"
              aria-invalid={erros?.id ? true : undefined}
              onChange={(e) => setTermo(e.target.value)}
            />
            {erros?.id && <p className="text-sm font-medium text-danger">{erros.id}</p>}
            {termo.trim().length >= 2 && (
              <ul className="flex flex-col divide-y divide-border rounded-xl border border-border" aria-live="polite">
                {buscando && <li className="px-4 py-3 text-sm text-ink-muted">Buscando…</li>}
                {!buscando && resultados.length === 0 && !permitirNovo && (
                  <li className="px-4 py-3 text-sm text-ink-muted">Nenhum cliente encontrado.</li>
                )}
                {!buscando && resultados.length === 0 && permitirNovo && (
                  <li className="flex items-center justify-between gap-2 px-4 py-2 text-sm">
                    <span className="text-ink-muted">Nenhum cliente encontrado.</span>
                    <button
                      type="button"
                      onClick={() => aoMudar({ modo: "novo", nome: termo, whatsapp: "", instagram: "" })}
                      className="min-h-11 font-bold text-brand-strong"
                    >
                      Cadastrar &quot;{termo}&quot;
                    </button>
                  </li>
                )}
                {!buscando &&
                  resultados.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => aoMudar({ modo: "existente", id: c.id, nome: c.nome, whatsapp: c.whatsapp })}
                        className="flex min-h-12 w-full flex-col items-start justify-center px-4 py-2 text-left hover:bg-surface-alt"
                      >
                        <span className="font-bold">{c.nome}</span>
                        {c.whatsapp && <span className="text-sm text-ink-muted">{formatarWhatsApp(c.whatsapp)}</span>}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        ))}

      {valor.modo === "novo" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <CampoCliente
            id="cliente-nome"
            rotulo="Nome"
            valor={valor.nome}
            erro={erros?.nome}
            aoMudar={(nome) => aoMudar({ ...valor, nome })}
            autoComplete="off"
          />
          <CampoCliente
            id="cliente-whatsapp"
            rotulo="WhatsApp (opcional)"
            valor={valor.whatsapp}
            erro={erros?.whatsapp}
            aoMudar={(whatsapp) => aoMudar({ ...valor, whatsapp })}
            inputMode="tel"
            placeholder="(00) 00000-0000"
          />
          <CampoCliente
            id="cliente-instagram"
            rotulo="Instagram (opcional)"
            valor={valor.instagram}
            erro={erros?.instagram}
            aoMudar={(instagram) => aoMudar({ ...valor, instagram })}
            placeholder="@usuario"
            autoCapitalize="none"
          />
        </div>
      )}
    </div>
  );
}

function CampoCliente({
  id,
  rotulo,
  valor,
  erro,
  aoMudar,
  ...props
}: {
  id: string;
  rotulo: string;
  valor: string;
  erro?: string;
  aoMudar: (v: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </label>
      <Input id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={erro ? true : undefined} {...props} />
      {erro && <p className="text-sm font-medium text-danger">{erro}</p>}
    </div>
  );
}
