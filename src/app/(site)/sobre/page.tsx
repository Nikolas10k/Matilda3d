import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Lightbulb, PackageCheck } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { botaoContorno, botaoPrimario, Faixa, TituloSecao } from "@/components/site/blocos";
import { IconeInstagram, linkInstagram } from "@/components/site/estrutura";
import { BUCKET_MARCA, urlPublica } from "@/lib/storage";
import { obterMarca } from "@/server/publico";
import { Revelar } from "@/components/site/revelar";

export const metadata: Metadata = {
  title: "Sobre nós",
  description: "A Matilda3D é uma marca de peças impressas em 3D criada por jovens criadores. Conheça a nossa história.",
  alternates: { canonical: "/sobre" },
};

const VALORES = [
  { titulo: "Ideia", texto: "Tudo começa com uma conversa: o que você imagina, para quem é e quando precisa.", icone: Lightbulb },
  { titulo: "Camada por camada", texto: "Modelamos e imprimimos cada peça em casa, acompanhando a impressora de perto.", icone: Layers },
  { titulo: "Acabamento", texto: "Revisamos, limpamos e embalamos com cuidado antes de entregar.", icone: PackageCheck },
];

export default async function PaginaSobre() {
  const marca = await obterMarca();
  const instagram = linkInstagram(marca.instagram);

  return (
    <>
      <Faixa className="bg-surface" conteudo="flex flex-wrap items-center gap-12">
        <div className="relative flex aspect-[4/3] min-w-0 max-w-[480px] flex-[1_1_320px] items-center justify-center overflow-hidden rounded-card bg-surface-strong">
          {marca.fotoCriadores ? (
            <Image src={urlPublica(BUCKET_MARCA, marca.fotoCriadores)} alt="Os criadores da Matilda3D" fill priority sizes="(min-width: 768px) 480px, 92vw" className="object-cover" />
          ) : (
            <Logo variante="principal" altura={180} priority className="h-auto w-[56%]" />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <span className="rotulo text-ink-muted">Sobre nós</span>
          <h1 className="text-[clamp(36px,7vw,52px)] leading-tight font-light">Jovens criadores, peças feitas com cuidado.</h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            {marca.textoSobre ??
              "A Matilda3D nasceu da curiosidade por tecnologia e criatividade. Cada peça é modelada, impressa e acabada à mão, em casa, com atenção a cada detalhe."}
          </p>
        </div>
      </Faixa>

      <Faixa className="bg-white" conteudo="flex flex-col gap-10">
        <TituloSecao rotulo="Do nosso jeito" centro subtitulo="Do jeito que a gente trabalha, cada peça é única.">
          Como nasce uma peça
        </TituloSecao>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {VALORES.map((v, i) => (
            <Revelar as="li" key={v.titulo} atraso={i} className="flex flex-col gap-4 rounded-card border border-border bg-surface p-7">
              <v.icone className="size-7 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              <h2 className="text-[22px] font-normal">{v.titulo}</h2>
              <p className="leading-relaxed text-ink-soft">{v.texto}</p>
            </Revelar>
          ))}
        </ol>
        <Revelar as="div" className="flex flex-wrap justify-center gap-3">
          <Link href="/produtos" className={botaoPrimario}>
            Ver produtos
            <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
          <a href={instagram.url} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
            <IconeInstagram className="size-[18px]" />
            Siga @{instagram.usuario}
          </a>
        </Revelar>
      </Faixa>
    </>
  );
}
