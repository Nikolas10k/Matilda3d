import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { FormularioCarregando } from "@/components/painel/carregando";
import { FormularioProduto } from "@/components/painel/produtos/formulario-produto";
import { ehAdmin, exigirEquipe } from "@/server/auth";
import { listarCategorias, obterPadroesCalculadora } from "@/server/produtos";
import { valoresDeProdutoNovo } from "../valores-iniciais";

export const metadata: Metadata = { title: "Novo produto" };

type Params = PageProps<"/admin/produtos/novo">["searchParams"];

export default function PaginaNovoProduto({ searchParams }: PageProps<"/admin/produtos/novo">) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link href="/admin/produtos" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Produtos
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">Novo produto</h1>
      </div>
      <Suspense fallback={<FormularioCarregando />}>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Formulario({ searchParams }: { searchParams: Params }) {
  const usuario = await exigirEquipe();
  const params = await searchParams;
  const [categorias, padroes] = await Promise.all([listarCategorias(), obterPadroesCalculadora()]);
  const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  return (
    <FormularioProduto
      novo
      valoresIniciais={valoresDeProdutoNovo(crypto.randomUUID(), {
        preco: texto(params.preco),
        custo: texto(params.custo),
        gramas: texto(params.gramas),
        minutos: texto(params.minutos),
      })}
      categorias={categorias}
      padroes={padroes}
      podeExcluir={ehAdmin(usuario)}
    />
  );
}
