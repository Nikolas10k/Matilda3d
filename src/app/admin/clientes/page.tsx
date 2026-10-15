import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Clientes" };

export default function PaginaClientes() {
  return (
    <EmBreve
      titulo="Clientes"
      fase={6}
      descricao="Histórico de compras e encomendas de cada cliente."
    />
  );
}
