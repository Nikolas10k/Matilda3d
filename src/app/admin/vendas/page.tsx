import type { Metadata } from "next";
import { EmBreve } from "@/components/painel/em-breve";

export const metadata: Metadata = { title: "Vendas" };

export default function PaginaVendas() {
  return (
    <EmBreve
      titulo="Vendas"
      fase={4}
      descricao="Registre vendas, pagamentos e envie recibos pelo WhatsApp."
    />
  );
}
