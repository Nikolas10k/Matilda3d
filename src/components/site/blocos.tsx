import type { ReactNode } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Revelar } from "@/components/site/revelar";

/** Container das seções (1180px, respiro de 96px no desktop e 64px no celular — docs/02). */
export function Faixa({
  id,
  className,
  conteudo,
  children,
}: {
  id?: string;
  className?: string;
  conteudo?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className={cn("mx-auto max-w-[1180px] px-4 py-16 md:px-6 md:py-24", conteudo)}>{children}</div>
    </section>
  );
}

/** Título de seção: label opcional (Jost 500, maiúsculas) + título em Jost 300. */
export function TituloSecao({
  children,
  rotulo,
  subtitulo,
  centro = false,
}: {
  children: ReactNode;
  rotulo?: string;
  subtitulo?: ReactNode;
  centro?: boolean;
}) {
  return (
    <Revelar as="div" className={cn("flex flex-col gap-3", centro && "items-center text-center")}>
      {rotulo && <span className="rotulo text-ink-muted">{rotulo}</span>}
      <h2 className="text-[clamp(30px,6vw,40px)] leading-tight font-light">{children}</h2>
      {subtitulo && <p className="max-w-2xl text-[17px] leading-relaxed text-ink-soft">{subtitulo}</p>}
    </Revelar>
  );
}

/**
 * Placeholder de foto (docs/02): fundo Pérola com o símbolo da marca, suave,
 * no centro. Usa o arquivo de marca, sem recriar o desenho em código.
 */
export function SimboloPlaceholder({ tamanho = 56, className }: { tamanho?: number; className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center bg-surface-strong", className)}>
      <Image src="/brand/simbolo.svg" alt="" width={tamanho} height={tamanho} className="opacity-40" />
    </div>
  );
}

/** Botões da marca: pill grafite (primário) e contorno grafite (secundário). */
export const botaoPrimario =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-medium text-white transition-colors duration-200 hover:bg-ink-soft";
export const botaoContorno =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-ink bg-transparent px-6 text-base font-medium text-ink transition-colors duration-200 hover:bg-ink hover:text-white";
