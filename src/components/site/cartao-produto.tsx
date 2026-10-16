import Image from "next/image";
import Link from "next/link";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { formatarMoeda } from "@/lib/format";
import { urlFotoProduto } from "@/lib/storage";
import { linkPedido, mensagemPedido } from "@/lib/whatsapp-site";
import { Revelar } from "@/components/site/revelar";
import type { ProdutoPublico } from "@/server/publico";

// Fundos suaves da prévia para produtos ainda sem foto.
const FUNDOS = ["#FFE7DC", "#EDE7FB", "#DDF3EC", "#FFF1D6", "#E4EEFB", "#F7E3EC"];

export function precoTexto(centavos: number | null) {
  return centavos == null ? "Sob consulta" : formatarMoeda(centavos);
}

export function FotoVazia({ indice = 0, grande = false }: { indice?: number; grande?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2" style={{ background: FUNDOS[indice % FUNDOS.length] }}>
      <svg width={grande ? 88 : 56} height={grande ? 88 : 56} viewBox="0 0 40 40" aria-hidden="true">
        <path d="M20 4 L35 12.5 L35 27.5 L20 36 L5 27.5 L5 12.5 Z" fill="none" stroke="#1E1B33" strokeOpacity="0.35" strokeWidth="1.5" />
        <path d="M5 12.5 L20 21 L35 12.5 M20 21 L20 36" fill="none" stroke="#1E1B33" strokeOpacity="0.35" strokeWidth="1.5" />
      </svg>
      <span className="text-xs font-bold tracking-wide text-[#5A5670] uppercase">Foto em breve</span>
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
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-white transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(30,27,51,0.25)]"
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
          <FotoVazia indice={indice} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {produto.categoria && (
          <span className="self-start rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-[#9A3412]">{produto.categoria.nome}</span>
        )}
        <h3 className="text-xl font-semibold">
          {/* O link cobre o card todo (área de toque grande); o botão "Pedir" fica por cima. */}
          <Link href={`/produtos/${produto.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {produto.nome}
          </Link>
        </h3>
        {produto.descricaoCurta && <p className="line-clamp-2 flex-1 text-[15px] leading-relaxed text-ink-muted">{produto.descricaoCurta}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1.5">
          <span className="font-heading text-lg font-semibold">{precoTexto(produto.precoCentavos)}</span>
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
