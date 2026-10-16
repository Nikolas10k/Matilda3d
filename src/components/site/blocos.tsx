import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Revelar } from "@/components/site/revelar";

/** Container das seções (1180px, respiro de 80px no desktop e 56px no celular — docs/02). */
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
      <div className={cn("mx-auto max-w-[1180px] px-4 py-14 md:px-6 md:py-20", conteudo)}>{children}</div>
    </section>
  );
}

export function TituloSecao({ children, subtitulo, centro = false }: { children: ReactNode; subtitulo?: ReactNode; centro?: boolean }) {
  return (
    <Revelar as="div" className={cn("flex flex-col gap-2", centro && "items-center text-center")}>
      <h2 className="text-[clamp(30px,6vw,40px)] leading-tight font-bold tracking-tight">{children}</h2>
      {subtitulo && <p className="max-w-2xl text-[17px] text-ink-muted">{subtitulo}</p>}
    </Revelar>
  );
}

/** Ilustração do hero da prévia aprovada: impressora 3D imprimindo uma peça em camadas. */
export function IlustracaoImpressora({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="Ilustração de uma peça sendo impressa em 3D" className={className}>
      <rect x="40" y="40" width="220" height="14" rx="7" fill="#1E1B33" />
      <rect x="128" y="54" width="44" height="26" rx="6" fill="#1E1B33" />
      <path d="M142 80 L158 80 L150 94 Z" fill="#1E1B33" />
      <path d="M150 94 L150 112" stroke="#FF6A3D" strokeWidth="3" strokeDasharray="4 4" />
      <path d="M150 116 C118 116 104 140 104 168 L104 236 L196 236 L196 168 C196 140 182 116 150 116 Z" fill="#FF6A3D" />
      <g stroke="#FFFFFF" strokeOpacity="0.45" strokeWidth="2">
        <line x1="106" y1="150" x2="194" y2="150" />
        <line x1="104" y1="164" x2="196" y2="164" />
        <line x1="104" y1="178" x2="196" y2="178" />
        <line x1="104" y1="192" x2="196" y2="192" />
        <line x1="104" y1="206" x2="196" y2="206" />
        <line x1="104" y1="220" x2="196" y2="220" />
        <line x1="114" y1="136" x2="186" y2="136" />
        <line x1="128" y1="124" x2="172" y2="124" />
      </g>
      <rect x="70" y="236" width="160" height="12" rx="6" fill="#D9D5E6" />
      <circle cx="236" cy="96" r="10" fill="#FFB48F" />
      <circle cx="64" cy="128" r="6" fill="#FFB48F" />
      <circle cx="250" cy="196" r="5" fill="#D9D5E6" />
    </svg>
  );
}
