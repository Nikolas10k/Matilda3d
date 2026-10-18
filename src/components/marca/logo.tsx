import Image from "next/image";
import { cn } from "@/lib/utils";

// Arquivos de marca aprovados (docs/02, conceito B "Casinhas"). Não recriar em código.
const ARQUIVOS = {
  horizontal: { src: "/brand/logo-horizontal", largura: 323, altura: 100 },
  principal: { src: "/brand/logo-principal", largura: 313, altura: 231 },
  simbolo: { src: "/brand/simbolo", largura: 100, altura: 100 },
} as const;

type LogoProps = {
  variante?: keyof typeof ARQUIVOS;
  /** Altura em px; a largura acompanha a proporção do arquivo. */
  altura?: number;
  /** Versão branca, para fundos grafite. */
  claro?: boolean;
  className?: string;
  priority?: boolean;
};

export function Logo({ variante = "horizontal", altura = 40, claro = false, className, priority }: LogoProps) {
  const a = ARQUIVOS[variante];
  return (
    <Image
      src={`${a.src}${claro ? "-branco" : ""}.svg`}
      alt="Matilda3D"
      width={Math.round((a.largura / a.altura) * altura)}
      height={altura}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}
