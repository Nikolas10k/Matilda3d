import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { precoTexto } from "@/components/site/cartao-produto";
import { Galeria, PedidoProduto } from "@/components/site/pagina-produto";
import { Skeleton } from "@/components/ui/skeleton";
import { urlFotoProduto } from "@/lib/storage";
import { numeroDaLoja, URL_SITE } from "@/lib/whatsapp-site";
import { listarSlugsPublicos, obterMarca, obterProdutoPublico } from "@/server/publico";

type Params = PageProps<"/produtos/[slug]">["params"];

/** Pré-gera as páginas dos produtos ativos; os novos são gerados na primeira visita (ISR). */
export async function generateStaticParams() {
  const slugs = await listarSlugsPublicos();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "__vazio__" }];
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const produto = await obterProdutoPublico(slug);
  if (!produto) return { title: "Produto não encontrado" };
  const descricao = produto.descricaoCurta ?? `${produto.nome} impresso em 3D pela Matilda3D. Peça pelo WhatsApp.`;
  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/produtos/${produto.slug}` },
    openGraph: {
      title: `${produto.nome} | Matilda3D`,
      description: descricao,
      type: "website",
      images: produto.fotos[0] ? [{ url: urlFotoProduto(produto.fotos[0]), alt: produto.nome }] : undefined,
    },
  };
}

export default function PaginaProduto({ params }: PageProps<"/produtos/[slug]">) {
  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 md:px-6 md:py-12">
      <Link href="/produtos" className="mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Voltar para a vitrine
      </Link>
      <Suspense fallback={<ProdutoCarregando />}>
        <Produto params={params} />
      </Suspense>
    </div>
  );
}

function ProdutoCarregando() {
  return (
    <div className="grid gap-10 lg:grid-cols-2" aria-busy="true" aria-label="Carregando produto">
      <Skeleton className="aspect-[4/3] rounded-card" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}

async function Produto({ params }: { params: Params }) {
  const { slug } = await params;
  const [produto, marca] = await Promise.all([obterProdutoPublico(slug), obterMarca()]);
  if (!produto) notFound();

  // Dados estruturados para buscadores (docs/03, SEO).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    description: produto.descricao ?? produto.descricaoCurta ?? undefined,
    image: produto.fotos.map(urlFotoProduto),
    category: produto.categoria?.nome,
    brand: { "@type": "Brand", name: "Matilda3D" },
    url: `${URL_SITE}/produtos/${produto.slug}`,
    ...(produto.precoCentavos != null && {
      offers: {
        "@type": "Offer",
        priceCurrency: "BRL",
        price: (produto.precoCentavos / 100).toFixed(2),
        availability: "https://schema.org/InStock",
        url: `${URL_SITE}/produtos/${produto.slug}`,
      },
    }),
  };

  return (
    <article className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Galeria fotos={produto.fotos} nome={produto.nome} />
      <div className="flex flex-col gap-5">
        {produto.categoria && (
          <Link
            href={`/produtos?categoria=${produto.categoria.slug}`}
            className="self-start rounded-full border border-border bg-surface px-3 py-1 text-sm font-medium text-ink-muted hover:underline"
          >
            {produto.categoria.nome}
          </Link>
        )}
        <h1 className="text-[clamp(32px,6vw,44px)] leading-tight font-light">{produto.nome}</h1>
        <p className="text-3xl font-medium">{precoTexto(produto.precoCentavos)}</p>
        {produto.descricaoCurta && <p className="text-lg text-ink-muted">{produto.descricaoCurta}</p>}
        <PedidoProduto
          produto={{ id: produto.id, nome: produto.nome, slug: produto.slug, precoCentavos: produto.precoCentavos, cores: produto.cores }}
          numeroLoja={numeroDaLoja(marca.whatsapp)}
        />
        {produto.descricao && (
          <div className="border-t border-border pt-5">
            <h2 className="mb-2 text-xl font-medium">Sobre a peça</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink-muted">{produto.descricao}</p>
          </div>
        )}
      </div>
    </article>
  );
}
