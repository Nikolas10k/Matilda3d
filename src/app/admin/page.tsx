import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Package, ShoppingBag, Wallet } from "lucide-react";
import { exigirEquipe } from "@/server/auth";

export const metadata: Metadata = { title: "Início" };

const ATALHOS = [
  { href: "/admin/vendas", rotulo: "Vendas", texto: "Registrar e acompanhar vendas", icone: ShoppingBag },
  { href: "/admin/caixa", rotulo: "Caixa", texto: "Entradas, despesas e saldo", icone: Wallet },
  { href: "/admin/encomendas", rotulo: "Encomendas", texto: "Pedidos personalizados do site", icone: ClipboardList },
  { href: "/admin/produtos", rotulo: "Produtos", texto: "Catálogo da vitrine", icone: Package },
];

async function Saudacao() {
  const usuario = await exigirEquipe();
  return <h1 className="text-2xl font-bold md:text-3xl">Olá, {usuario.nome.split(" ")[0]}!</h1>;
}

export default function PaginaInicioPainel() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <Suspense fallback={<Skeleton className="h-9 w-48" />}>
          <Saudacao />
        </Suspense>
        <p className="mt-1 text-ink-muted">
          O dashboard com entradas, saídas, saldo e lucro chega na Fase 5. Por enquanto, use os atalhos abaixo.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ATALHOS.map(({ href, rotulo, texto, icone: Icone }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-20 items-center gap-4 rounded-card border border-border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
                <Icone className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-bold">{rotulo}</span>
                <span className="block text-sm text-ink-muted">{texto}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
