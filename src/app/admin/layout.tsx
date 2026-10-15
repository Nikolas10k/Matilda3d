import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { BarraInferior, MenuLateral } from "@/components/painel/menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { sair } from "@/server/actions/auth";
import { exigirEquipe, type Papel } from "@/server/auth";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel Matilda3D" },
  robots: { index: false, follow: false },
};

const NOME_PAPEL: Record<Papel, string> = { admin: "Admin", membro: "Membro" };

// A sessão é lida dentro do <Suspense> (exigência do cacheComponents):
// a moldura aparece na hora e o conteúdo chega quando o usuário é confirmado.
export default function LayoutPainel({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <Suspense fallback={<MolduraCarregando />}>
        <Painel>{children}</Painel>
      </Suspense>
      <Toaster />
    </>
  );
}

async function Painel({ children }: { children: React.ReactNode }) {
  const usuario = await exigirEquipe();

  return (
    <div className="min-h-dvh bg-surface-alt">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-white px-4 py-6 md:flex">
        <Link href="/admin" className="mb-8 px-2" aria-label="Início do painel">
          <Logo tamanho={34} />
        </Link>
        <MenuLateral papel={usuario.papel} />
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-white/95 px-4 backdrop-blur md:px-8">
          <Link href="/admin" className="md:hidden" aria-label="Início do painel">
            <Logo tamanho={30} />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="max-w-[45vw] truncate text-sm font-bold">{usuario.nome}</p>
              <p className="text-xs text-ink-muted">{NOME_PAPEL[usuario.papel]}</p>
            </div>
            <form action={sair} className="hidden md:block">
              <button
                type="submit"
                className="flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-muted hover:bg-surface-alt hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sair
              </button>
            </form>
          </div>
        </header>

        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-10">
          {children}
        </main>
      </div>

      <BarraInferior papel={usuario.papel} nome={usuario.nome} />
    </div>
  );
}

function MolduraCarregando() {
  return (
    <div className="min-h-dvh bg-surface-alt" aria-busy="true" aria-label="Carregando o painel">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-3 border-r border-border bg-white px-4 py-6 md:flex">
        <Skeleton className="mb-6 h-9 w-40" />
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-xl" />
        ))}
      </aside>
      <div className="md:pl-64">
        <div className="flex h-16 items-center justify-end border-b border-border bg-white px-4 md:px-8">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="mx-auto max-w-6xl space-y-4 px-4 pt-6 md:px-8">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-32 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
