import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Lightbulb, PackageCheck } from "lucide-react";
import { Faixa, IlustracaoImpressora, TituloSecao } from "@/components/site/blocos";
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
      <Faixa className="bg-ink text-white" conteudo="flex flex-wrap items-center gap-12">
        <div className="relative flex aspect-[4/3] min-w-0 max-w-[480px] flex-[1_1_320px] items-center justify-center overflow-hidden rounded-3xl bg-[#2C2848]">
          {marca.fotoCriadores ? (
            <Image src={urlPublica(BUCKET_MARCA, marca.fotoCriadores)} alt="Os criadores da Matilda3D" fill priority sizes="(min-width: 768px) 480px, 92vw" className="object-cover" />
          ) : (
            <IlustracaoImpressora className="h-auto w-1/2" />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <span className="text-sm font-bold tracking-wide text-[#FFB48F] uppercase">Sobre nós</span>
          <h1 className="text-[clamp(34px,7vw,48px)] leading-tight font-bold tracking-tight">Jovens criadores, ideias grandes.</h1>
          <p className="text-lg leading-relaxed text-[#D9D5E6]">
            {marca.textoSobre ??
              "A Matilda3D nasceu da curiosidade por tecnologia e criatividade. Cada peça é modelada, impressa e acabada à mão, em casa, com atenção a cada detalhe."}
          </p>
        </div>
      </Faixa>

      <Faixa conteudo="flex flex-col gap-9">
        <TituloSecao centro subtitulo="Do jeito que a gente trabalha, cada peça é única.">
          Como nasce uma peça
        </TituloSecao>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {VALORES.map((v, i) => (
            <Revelar as="li" key={v.titulo} atraso={i} className="flex flex-col gap-3 rounded-card border border-border bg-white p-7">
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-brand-soft text-brand-strong">
                <v.icone className="size-6" aria-hidden="true" />
              </span>
              <h2 className="text-[22px] font-semibold">{v.titulo}</h2>
              <p className="leading-relaxed text-ink-muted">{v.texto}</p>
            </Revelar>
          ))}
        </ol>
        <Revelar as="div" className="flex flex-wrap justify-center gap-3">
          <Link href="/produtos" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-ink px-6 font-bold text-white hover:bg-[#2c2848]">
            Ver produtos
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[52px] items-center gap-2 rounded-full border-2 border-ink px-6 font-bold hover:bg-ink hover:text-white"
          >
            <IconeInstagram className="size-[18px]" />
            Siga @{instagram.usuario}
          </a>
        </Revelar>
      </Faixa>
    </>
  );
}
