import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { FormularioCarregando } from "@/components/painel/carregando";
import { FormularioProduto } from "@/components/painel/produtos/formulario-produto";
import { Skeleton } from "@/components/ui/skeleton";
import { ehAdmin, exigirEquipe } from "@/server/auth";
import { listarCategorias, obterPadroesCalculadora, obterProduto } from "@/server/produtos";
import { valoresDoProduto } from "../valores-iniciais";

export const metadata: Metadata = { title: "Editar produto" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Params = PageProps<"/admin/produtos/[id]">["params"];

export default function PaginaEditarProduto({ params }: PageProps<"/admin/produtos/[id]">) {
  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/produtos" className="-mb-6 inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Produtos
      </Link>
      <Suspense
        fallback={
          <>
            <Skeleton className="h-9 w-64" />
            <FormularioCarregando />
          </>
        }
      >
        <Edicao params={params} />
      </Suspense>
    </section>
  );
}

async function Edicao({ params }: { params: Params }) {
  const usuario = await exigirEquipe();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [produto, categorias, padroes] = await Promise.all([
    obterProduto(id),
    listarCategorias(),
    obterPadroesCalculadora(),
  ]);
  if (!produto) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">{produto.nome}</h1>
        {produto.ativo && (
          <a
            href={`/produtos/${produto.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-strong hover:underline"
          >
            Ver no site
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
      <FormularioProduto
        novo={false}
        valoresIniciais={valoresDoProduto(produto)}
        categorias={categorias}
        padroes={padroes}
        podeExcluir={ehAdmin(usuario)}
      />
    </>
  );
}
