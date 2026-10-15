import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Calculadora de preço" };

export default function PaginaCalculadora() {
  return (
    <EmBreve
      titulo="Calculadora de preço"
      fase={3}
      descricao="Descubra o custo de cada peça e o preço certo para cobrar."
    />
  );
}
