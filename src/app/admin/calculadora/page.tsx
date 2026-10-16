import type { Metadata } from "next";
import { Suspense } from "react";
import { FormularioCarregando } from "@/components/painel/carregando";
import { Calculadora } from "@/components/painel/calculadora";
import { exigirEquipe } from "@/server/auth";
import { obterPadroesCalculadora } from "@/server/produtos";

export const metadata: Metadata = { title: "Calculadora de preço" };

export default function PaginaCalculadora() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Calculadora de preço</h1>
        <p className="mt-1 max-w-2xl text-ink-muted">
          Descubra quanto custa fazer uma peça e quanto cobrar por ela. Preencha os gramas e o tempo de impressão que
          o fatiador mostra.
        </p>
      </div>
      <Suspense fallback={<FormularioCarregando />}>
        <CalculadoraComPadroes />
      </Suspense>
    </section>
  );
}

async function CalculadoraComPadroes() {
  await exigirEquipe();
  const padroes = await obterPadroesCalculadora();
  return <Calculadora padroes={padroes} />;
}
