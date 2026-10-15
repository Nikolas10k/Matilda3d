import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Encomendas" };

export default function PaginaEncomendas() {
  return (
    <EmBreve
      titulo="Encomendas"
      fase={6}
      descricao="Acompanhe os pedidos personalizados do site, do primeiro contato à entrega."
    />
  );
}
