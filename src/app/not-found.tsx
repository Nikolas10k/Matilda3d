import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { botaoContorno, botaoPrimario } from "@/components/site/blocos";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

// 404 amigável (docs/07, Fase 8).
export default function NaoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-8 bg-surface px-4 py-12 text-center">
      <Link href="/" aria-label="Matilda3D, página inicial" className="rounded-lg">
        <Logo variante="principal" altura={140} priority />
      </Link>
      <div className="flex max-w-md flex-col gap-3">
        <p className="rotulo text-ink-muted">Erro 404</p>
        <h1 className="text-[clamp(28px,5vw,38px)] leading-tight font-light">Essa página ainda não saiu da impressora.</h1>
        <p className="text-ink-soft">O endereço pode estar errado ou o produto pode ter saído da vitrine.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className={botaoPrimario}>
          Ir para o início
        </Link>
        <Link href="/produtos" className={botaoContorno}>
          Ver produtos
        </Link>
      </div>
    </main>
  );
}
