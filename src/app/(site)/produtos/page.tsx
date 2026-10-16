import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Faixa, TituloSecao } from "@/components/site/blocos";
import { CartaoProduto } from "@/components/site/cartao-produto";
import { ChipsCategorias, FiltroVitrine } from "@/components/site/filtro-vitrine";
import { numeroDaLoja } from "@/lib/whatsapp-site";
import { listarCategoriasPublicas, listarProdutosPublicos, obterMarca } from "@/server/publico";

export const metadata: Metadata = {
  title: "Produtos",
  description: "Chaveiros, decoração, presentes, miniaturas e peças personalizadas impressas em 3D. Peça pelo WhatsApp.",
  alternates: { canonical: "/produtos" },
};

// Página estática com todos os produtos; o filtro ?categoria= é aplicado no
// navegador (FiltroVitrine), para a vitrine abrir rápido.
export default async function PaginaVitrine() {
  const [categoriasBase, produtos, marca] = await Promise.all([listarCategoriasPublicas(), listarProdutosPublicos(), obterMarca()]);
  const categorias = categoriasBase.map((c) => ({ ...c, quantidade: produtos.filter((p) => p.categoria?.slug === c.slug).length }));
  const numeroLoja = numeroDaLoja(marca.whatsapp);

  return (
    <Faixa conteudo="flex flex-col gap-8">
      <TituloSecao subtitulo="Toque em um produto para ver detalhes ou pedir direto pelo WhatsApp.">
        <span className="text-[clamp(36px,7vw,48px)]">Vitrine</span>
      </TituloSecao>
      <Suspense fallback={<ChipsCategorias categorias={categorias} atual={null} />}>
        <FiltroVitrine categorias={categorias} />
      </Suspense>
      {produtos.length === 0 ? (
        <p className="rounded-card bg-surface-alt p-8 text-center text-ink-muted">
          A vitrine está sendo montada.{" "}
          <Link href="/encomenda" className="font-bold text-brand-strong underline-offset-4 hover:underline">
            Conte sua ideia pelo formulário de encomenda!
          </Link>
        </p>
      ) : (
        <div data-vitrine className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
          {produtos.map((p, i) => (
            <CartaoProduto key={p.id} produto={p} numeroLoja={numeroLoja} indice={i} prioridade={i < 2} />
          ))}
        </div>
      )}
    </Faixa>
  );
}
