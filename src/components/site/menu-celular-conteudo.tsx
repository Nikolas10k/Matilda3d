"use client";

import Link from "next/link";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

/** Gaveta do menu do celular. Carregada só quando a pessoa toca no menu (ver menu-celular.tsx). */
export function ConteudoMenu({
  links,
  linkWhatsApp,
  aberto,
  setAberto,
}: {
  links: { href: string; rotulo: string }[];
  linkWhatsApp: string;
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
}) {
  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetContent side="right" className="w-[85vw] max-w-sm">
        <SheetHeader>
          <SheetTitle className="text-xl font-medium">Menu</SheetTitle>
          <SheetDescription className="sr-only">Navegação do site</SheetDescription>
        </SheetHeader>
        <nav aria-label="Menu principal" className="flex flex-col gap-1 px-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setAberto(false)}
              className="flex min-h-12 items-center rounded-xl px-3 text-lg font-medium hover:bg-surface"
            >
              {l.rotulo}
            </Link>
          ))}
          <BotaoWhatsApp href={linkWhatsApp} origem="header" className="mt-4 min-h-12 text-base">
            Fale no WhatsApp
          </BotaoWhatsApp>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
