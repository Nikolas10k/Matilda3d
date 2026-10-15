"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Calculator,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Papel } from "@/server/auth";
import { sair } from "@/server/actions/auth";

type ItemMenu = {
  href: string;
  rotulo: string;
  icone: LucideIcon;
  /** Aparece na barra inferior do celular. */
  principal?: boolean;
  soAdmin?: boolean;
};

const ITENS: ItemMenu[] = [
  { href: "/admin", rotulo: "Início", icone: LayoutDashboard, principal: true },
  { href: "/admin/vendas", rotulo: "Vendas", icone: ShoppingBag, principal: true },
  { href: "/admin/caixa", rotulo: "Caixa", icone: Wallet, principal: true },
  { href: "/admin/encomendas", rotulo: "Encomendas", icone: ClipboardList, principal: true },
  { href: "/admin/produtos", rotulo: "Produtos", icone: Package },
  { href: "/admin/calculadora", rotulo: "Calculadora", icone: Calculator },
  { href: "/admin/clientes", rotulo: "Clientes", icone: Users },
  { href: "/admin/relatorios", rotulo: "Relatórios", icone: FileBarChart },
  { href: "/admin/configuracoes", rotulo: "Configurações", icone: Settings, soAdmin: true },
];

function itensVisiveis(papel: Papel) {
  return ITENS.filter((item) => !item.soAdmin || papel === "admin");
}

function estaAtivo(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Menu lateral (desktop). */
export function MenuLateral({ papel }: { papel: Papel }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu do painel" className="flex flex-col gap-1">
      {itensVisiveis(papel).map(({ href, rotulo, icone: Icone }) => {
        const ativo = estaAtivo(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
              ativo ? "bg-brand-soft font-bold text-brand-strong" : "text-ink-muted hover:bg-surface-alt hover:text-ink",
            )}
          >
            <Icone className="size-5" aria-hidden="true" />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior (celular): 4 atalhos principais + "Mais" em gaveta. */
export function BarraInferior({ papel, nome }: { papel: Papel; nome: string }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const principais = ITENS.filter((i) => i.principal);
  const demais = itensVisiveis(papel).filter((i) => !i.principal);
  const maisAtivo = demais.some((i) => estaAtivo(pathname, i.href));

  return (
    <nav
      aria-label="Menu do painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {principais.map(({ href, rotulo, icone: Icone }) => {
          const ativo = estaAtivo(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  ativo ? "text-brand-strong" : "text-ink-muted",
                )}
              >
                <Icone className={cn("size-6", ativo && "stroke-[2.5]")} aria-hidden="true" />
                {rotulo}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={aberto} onOpenChange={setAberto}>
            <SheetTrigger
              className={cn(
                "flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium",
                maisAtivo ? "text-brand-strong" : "text-ink-muted",
              )}
            >
              <Menu className="size-6" aria-hidden="true" />
              Mais
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(env(safe-area-inset-bottom)+1rem)]">
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-bold">Mais opções</SheetTitle>
                <SheetDescription>Conectado como {nome}</SheetDescription>
              </SheetHeader>
              <ul className="flex flex-col gap-1 px-2">
                {demais.map(({ href, rotulo, icone: Icone }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setAberto(false)}
                      aria-current={estaAtivo(pathname, href) ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium",
                        estaAtivo(pathname, href) ? "bg-brand-soft text-brand-strong" : "text-ink hover:bg-surface-alt",
                      )}
                    >
                      <Icone className="size-5" aria-hidden="true" />
                      {rotulo}
                    </Link>
                  </li>
                ))}
                <li>
                  <form action={sair}>
                    <button
                      type="submit"
                      className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-base font-medium text-danger hover:bg-danger/5"
                    >
                      <LogOut className="size-5" aria-hidden="true" />
                      Sair
                    </button>
                  </form>
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
