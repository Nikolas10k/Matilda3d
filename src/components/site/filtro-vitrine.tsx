"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Categoria = { nome: string; slug: string; quantidade: number };

const chip = (ativo: boolean) =>
  cn(
    "inline-flex min-h-11 shrink-0 items-center rounded-full border px-[18px] text-sm font-medium transition-colors",
    ativo ? "border-ink bg-ink text-white" : "border-input bg-white hover:border-ink",
  );

/** Chips de categoria (sem filtro aplicado). Usado como estado inicial da página estática. */
export function ChipsCategorias({ categorias, atual }: { categorias: Categoria[]; atual: string | null }) {
  return (
    <nav aria-label="Filtrar por categoria" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      <Link href="/produtos" scroll={false} aria-current={!atual ? "page" : undefined} className={chip(!atual)}>
        Todos
      </Link>
      {categorias.map((c) => (
        <Link
          key={c.slug}
          href={`/produtos?categoria=${c.slug}`}
          scroll={false}
          aria-current={atual === c.slug ? "page" : undefined}
          className={chip(atual === c.slug)}
        >
          {c.nome}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Filtro da vitrine pela URL (?categoria=slug, docs/03). A grade completa vem
 * estática do servidor (rápida no Lighthouse); aqui só escondemos os cards de
 * outras categorias com uma regra de CSS.
 */
export function FiltroVitrine({ categorias }: { categorias: Categoria[] }) {
  const params = useSearchParams();
  const atual = categorias.find((c) => c.slug === params.get("categoria")) ?? null;

  return (
    <>
      <ChipsCategorias categorias={categorias} atual={atual?.slug ?? null} />
      {atual && <style>{`[data-vitrine] [data-categoria]:not([data-categoria="${atual.slug}"]){display:none}`}</style>}
      {atual && atual.quantidade === 0 && (
        <p className="rounded-card bg-surface p-8 text-center text-ink-muted">
          Nenhum produto em {atual.nome} por enquanto.{" "}
          <Link href="/encomenda" className="font-medium text-ink underline-offset-4 hover:underline">
            Que tal encomendar algo sob medida?
          </Link>
        </p>
      )}
    </>
  );
}
