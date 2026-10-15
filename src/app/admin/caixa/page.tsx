import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Caixa" };

export default function PaginaCaixa() {
  return (
    <EmBreve
      titulo="Caixa"
      fase={4}
      descricao="Livro caixa com entradas, despesas e saldo atualizado."
    />
  );
}
