"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Origem = "card" | "pagina_produto" | "header" | "encomenda";

/** Ícone de balão (o mesmo da prévia aprovada). */
export function IconeWhatsApp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z" />
    </svg>
  );
}

/**
 * Link para o WhatsApp da loja com a mensagem pronta. Ao clicar, registra um
 * clique anônimo (sendBeacon não atrasa a abertura do WhatsApp).
 */
export function BotaoWhatsApp({
  href,
  origem,
  produtoId,
  children,
  className,
  rotuloAcessivel,
}: {
  href: string;
  origem: Origem;
  produtoId?: string;
  children: ReactNode;
  className?: string;
  rotuloAcessivel?: string;
}) {
  function registrar() {
    try {
      const corpo = JSON.stringify({ produtoId: produtoId ?? null, origem });
      if (!navigator.sendBeacon?.("/api/clique", new Blob([corpo], { type: "application/json" }))) {
        void fetch("/api/clique", { method: "POST", body: corpo, keepalive: true });
      }
    } catch {
      // O pedido nunca depende do registro do clique.
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={registrar}
      aria-label={rotuloAcessivel}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-whatsapp px-4 font-bold text-white transition-colors hover:bg-[#18643a] focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <IconeWhatsApp className="size-4 shrink-0" />
      {children}
    </a>
  );
}
