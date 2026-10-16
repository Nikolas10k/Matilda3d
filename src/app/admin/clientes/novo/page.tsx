import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioCliente } from "@/components/painel/clientes/formulario-cliente";
import { Secao } from "@/components/painel/elementos";

export const metadata: Metadata = { title: "Novo cliente" };

// A autenticação é garantida pelo layout do painel e pela Server Action (exigirEquipe).
export default function PaginaNovoCliente() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link href="/admin/clientes" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Clientes
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">Novo cliente</h1>
      </div>
      <Secao titulo="Dados do cliente">
        <FormularioCliente inicial={{ nome: "", whatsapp: "", instagram: "" }} />
      </Secao>
    </section>
  );
}
