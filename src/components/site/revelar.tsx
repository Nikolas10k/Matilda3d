"use client";

import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

type Props = {
  /** Tag HTML do elemento (padrão: div). */
  as?: ElementType;
  /** Posição na sequência (0, 1, 2...): cada item entra 80 ms depois do anterior. */
  atraso?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
} & Record<string, unknown>;

/**
 * Entrada ao rolar (docs/02, "Movimento"): o elemento sobe de leve e aparece
 * quando ~15% dele entra na tela, uma vez só. O estado fica no próprio React
 * (sem mexer no HTML por fora), então não há conflito na hidratação.
 * Sem JavaScript ou com "reduzir movimento", tudo aparece direto (ver globals.css).
 */
export function Revelar({ as: Tag = "div", atraso = 0, className, style, children, ...resto }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setVisivel(true);
          observador.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -5% 0px" },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-revelar=""
      data-visivel={visivel ? "true" : undefined}
      className={className}
      style={atraso ? { ...style, ["--atraso" as string]: atraso } : style}
      {...resto}
    >
      {children}
    </Tag>
  );
}
