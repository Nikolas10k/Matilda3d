"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatarMoeda } from "@/lib/format";

export type ProdutoParaVenda = { id: string; nome: string; preco_centavos: number | null; cores: string[] };

/** Gaveta com a lista de produtos ativos para adicionar à venda. */
export function SeletorProduto({
  aberto,
  aoFechar,
  produtos,
  aoEscolher,
}: {
  aberto: boolean;
  aoFechar: () => void;
  produtos: ProdutoParaVenda[];
  aoEscolher: (p: ProdutoParaVenda) => void;
}) {
  const [busca, setBusca] = useState("");
  const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const filtrados = produtos.filter((p) => normalizar(p.nome).includes(normalizar(busca)));

  return (
    <Sheet open={aberto} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent side="bottom" className="max-h-[85dvh] rounded-t-3xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">Adicionar produto</SheetTitle>
          <SheetDescription>O preço vem do catálogo e pode ser mudado na venda.</SheetDescription>
        </SheetHeader>
        <div className="flex min-h-0 flex-col gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <label htmlFor="busca-produto" className="sr-only">
              Buscar produto
            </label>
            <Input
              id="busca-produto"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto"
              className="pl-10"
              autoComplete="off"
            />
          </div>
          <ul className="flex min-h-0 flex-col divide-y divide-border overflow-y-auto rounded-xl border border-border">
            {filtrados.length === 0 && <li className="px-4 py-6 text-center text-sm text-ink-muted">Nenhum produto encontrado.</li>}
            {filtrados.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    aoEscolher(p);
                    setBusca("");
                  }}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-2 text-left hover:bg-surface-alt"
                >
                  <span className="font-bold">{p.nome}</span>
                  <span className="tabular shrink-0 text-sm text-ink-muted">
                    {p.preco_centavos == null ? "Sob consulta" : formatarMoeda(p.preco_centavos)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
