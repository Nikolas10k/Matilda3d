"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Menu } from "lucide-react";

// A gaveta (Radix) só é baixada quando a pessoa abre o menu: menos JavaScript
// na primeira visita (Lighthouse, docs/03).
const ConteudoMenu = dynamic(() => import("./menu-celular-conteudo").then((m) => m.ConteudoMenu), { ssr: false });

/** Menu em gaveta do celular (docs/03, Header). */
export function MenuCelular({ links, linkWhatsApp }: { links: { href: string; rotulo: string }[]; linkWhatsApp: string }) {
  const [usado, setUsado] = useState(false);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setUsado(true);
          setAberto(true);
        }}
        aria-label="Abrir menu"
        aria-haspopup="dialog"
        aria-expanded={aberto}
        className="flex size-11 items-center justify-center rounded-full hover:bg-surface-alt md:hidden"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      {usado && <ConteudoMenu links={links} linkWhatsApp={linkWhatsApp} aberto={aberto} setAberto={setAberto} />}
    </>
  );
}
