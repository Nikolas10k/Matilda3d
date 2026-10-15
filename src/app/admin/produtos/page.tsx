import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Produtos" };

export default function PaginaProdutos() {
  return (
    <EmBreve
      titulo="Produtos"
      fase={3}
      descricao="Cadastro de produtos com fotos, preço, custo e margem."
    />
  );
}
