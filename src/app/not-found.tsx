import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { IlustracaoImpressora } from "@/components/site/blocos";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

// 404 amigável (docs/07, Fase 8).
export default function NaoEncontrada() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-6 bg-brand-soft px-4 py-12 text-center">
      <Link href="/" aria-label="Matilda3D, página inicial" className="rounded-full">
        <Logo tamanho={40} />
      </Link>
      <IlustracaoImpressora className="h-auto w-48 max-w-full" />
      <div className="flex max-w-md flex-col gap-2">
        <p className="font-heading text-6xl font-bold text-brand-strong">404</p>
        <h1 className="text-[clamp(26px,5vw,34px)] leading-tight font-bold">Essa página ainda não saiu da impressora.</h1>
        <p className="text-ink-muted">O endereço pode estar errado ou o produto pode ter saído da vitrine.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-[52px] items-center rounded-full bg-ink px-6 font-bold text-white hover:bg-[#2c2848]">
          Ir para o início
        </Link>
        <Link href="/produtos" className="inline-flex min-h-[52px] items-center rounded-full border-2 border-ink bg-white px-6 font-bold hover:bg-ink hover:text-white">
          Ver produtos
        </Link>
      </div>
    </main>
  );
}
