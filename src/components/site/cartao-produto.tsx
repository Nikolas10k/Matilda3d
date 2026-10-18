import Image from "next/image";
import Link from "next/link";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { formatarMoeda } from "@/lib/format";
import { urlFotoProduto } from "@/lib/storage";
import { linkPedido, mensagemPedido } from "@/lib/whatsapp-site";
import { Revelar } from "@/components/site/revelar";
import { SimboloPlaceholder } from "@/components/site/blocos";
import type { ProdutoPublico } from "@/server/publico";

export function precoTexto(centavos: number | null) {
  return centavos == null ? "Sob consulta" : formatarMoeda(centavos);
}

/** Produto ainda sem foto: placeholder da marca (Pérola + símbolo) e aviso discreto. */
export function FotoVazia({ grande = false }: { grande?: boolean }) {
  return (
    <div className="relative h-full w-full">
      <SimboloPlaceholder tamanho={grande ? 96 : 64} />
      <span className="rotulo absolute inset-x-0 bottom-4 text-center text-[11px] text-ink-soft">Foto em breve</span>
    </div>
  );
}

/** Card da vitrine (docs/03): foto 4:3, categoria, nome, descrição curta, preço e "Pedir". */
export function CartaoProduto({
  produto,
  numeroLoja,
  indice = 0,
  prioridade = false,
}: {
  produto: ProdutoPublico;
  numeroLoja: string | null;
  indice?: number;
  prioridade?: boolean;
}) {
  const link = linkPedido(numeroLoja, mensagemPedido({ nome: produto.nome, precoCentavos: produto.precoCentavos, slug: produto.slug }));

  return (
    <Revelar
      as="article"
      atraso={indice % 3}
      data-categoria={produto.categoria?.slug ?? ""}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-white transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_1px_2px_rgb(47_47_49/0.06)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {produto.fotos[0] ? (
          <Image
            src={urlFotoProduto(produto.fotos[0])}
            alt={produto.nome}
            fill
            priority={prioridade}
            sizes="(min-width: 1180px) 360px, (min-width: 640px) 45vw, 92vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <FotoVazia />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {produto.categoria && (
          <span className="self-start rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted">{produto.categoria.nome}</span>
        )}
        <h3 className="font-heading text-xl font-normal">
          {/* O link cobre o card todo (área de toque grande); o botão "Pedir" fica por cima. */}
          <Link href={`/produtos/${produto.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {produto.nome}
          </Link>
        </h3>
        {produto.descricaoCurta && <p className="line-clamp-2 flex-1 text-[15px] leading-relaxed text-ink-soft">{produto.descricaoCurta}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <span className="text-lg font-medium">{precoTexto(produto.precoCentavos)}</span>
          <BotaoWhatsApp
            href={link}
            origem="card"
            produtoId={produto.id}
            rotuloAcessivel={`Pedir ${produto.nome} pelo WhatsApp`}
            className="relative z-10 text-sm"
          >
            Pedir
          </BotaoWhatsApp>
        </div>
      </div>
    </Revelar>
  );
}
