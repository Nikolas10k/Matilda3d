import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Relatórios" };

export default function PaginaRelatorios() {
  return (
    <EmBreve
      titulo="Relatórios"
      fase={5}
      descricao="Resumo mensal e exportação das vendas e do caixa em planilha."
    />
  );
}
