import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  /** Tamanho do ícone em px; o texto acompanha. */
  tamanho?: number;
  /** Texto branco, para fundos escuros. */
  claro?: boolean;
  semTexto?: boolean;
};

// Logo provisório da prévia aprovada (cubo em camadas + "Matilda" e "3D").
export function Logo({ className, tamanho = 36, claro = false, semTexto = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width={tamanho} height={tamanho} viewBox="0 0 40 40" aria-hidden="true" className="shrink-0">
        <path d="M20 3 L36 12 L36 28 L20 37 L4 28 L4 12 Z" fill="#FF6A3D" />
        <path d="M20 3 L36 12 L20 21 L4 12 Z" fill="#FFB48F" />
        <path d="M20 21 L20 37 L4 28 L4 12 Z" fill="#C2410C" />
        <path
          d="M6 17 L20 25 M6 22 L20 30 M6 26 L20 34 M34 17 L20 25 M34 22 L20 30 M34 26 L20 34"
          stroke="#FFFFFF"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
      {!semTexto && (
        <span
          className={cn(
            "font-heading font-bold tracking-tight",
            claro ? "text-white" : "text-ink",
          )}
          style={{ fontSize: tamanho * 0.68 }}
        >
          Matilda<span className="text-brand">3D</span>
        </span>
      )}
    </span>
  );
}
