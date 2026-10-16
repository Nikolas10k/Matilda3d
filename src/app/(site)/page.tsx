import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessagesSquare, PackageCheck, Sparkles } from "lucide-react";
import { Faixa, IlustracaoImpressora, TituloSecao } from "@/components/site/blocos";
import { CartaoProduto } from "@/components/site/cartao-produto";
import { IconeInstagram, linkInstagram } from "@/components/site/estrutura";
import { BUCKET_MARCA, urlPublica } from "@/lib/storage";
import { numeroDaLoja } from "@/lib/whatsapp-site";
import { listarProdutosPublicos, obterMarca } from "@/server/publico";
import { Revelar } from "@/components/site/revelar";

const PASSOS = [
  {
    titulo: "Escolha ou imagine",
    texto: "Escolha um modelo da vitrine ou mande a sua ideia, com cor, tamanho e nome se quiser personalizar.",
    icone: Sparkles,
  },
  {
    titulo: "Combine pelo WhatsApp",
    texto: "A gente confirma os detalhes, o valor e o prazo de produção antes de começar a imprimir.",
    icone: MessagesSquare,
  },
  {
    titulo: "Receba a sua peça",
    texto: "Impressa camada por camada, revisada e embalada com cuidado para entrega ou retirada.",
    icone: PackageCheck,
  },
];

const IDEIAS = ["Lembrancinhas de festa", "Topo de bolo", "Nome em 3D", "Peça de reposição", "Presente único"];

export default async function PaginaInicial() {
  const [marca, destaques] = await Promise.all([obterMarca(), listarProdutosPublicos({ destaques: true })]);
  const vitrine = destaques.length ? destaques : (await listarProdutosPublicos()).slice(0, 6);
  const numeroLoja = numeroDaLoja(marca.whatsapp);
  const instagram = linkInstagram(marca.instagram);

  return (
    <>
      {/* 1. Hero — o texto já carrega visível (não pode atrasar o LCP) */}
      <section className="bg-brand-soft">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-4 pt-12 pb-16 md:px-6 md:pt-[72px] md:pb-20">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5">
            <span className="self-start rounded-full border border-[#FFD3BF] bg-white px-3.5 py-1.5 text-sm font-bold text-[#9A3412]">
              Feito camada por camada, com carinho
            </span>
            <h1 className="text-[clamp(36px,8vw,56px)] leading-[1.05] font-bold tracking-tight">
              Ideias que saem da impressora <span className="text-brand-strong">direto pra sua mão.</span>
            </h1>
            <p className="max-w-[520px] text-lg leading-relaxed text-ink-muted md:text-[19px]">
              Chaveiros, decoração, presentes e peças personalizadas impressas em 3D. Escolha um modelo da vitrine ou conte a sua
              ideia que a gente cria.
            </p>
            <div className="flex flex-wrap gap-3 pt-1.5">
              <Link href="/produtos" className="inline-flex min-h-[52px] items-center rounded-full bg-ink px-6 text-base font-bold text-white transition-colors hover:bg-[#2c2848]">
                Ver produtos
              </Link>
              <Link
                href="/encomenda"
                className="inline-flex min-h-[52px] items-center rounded-full border-2 border-ink bg-white px-6 text-base font-bold transition-colors hover:bg-ink hover:text-white"
              >
                Quero algo personalizado
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] justify-center">
            <div className="m3d-entrada-hero flex aspect-square w-full max-w-[440px] items-center justify-center overflow-hidden rounded-[32px] border border-[#FFD3BF] bg-white">
              <IlustracaoImpressora className="h-auto w-[78%]" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Destaques */}
      <Faixa id="vitrine" conteudo="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TituloSecao subtitulo="Toque em um produto para ver detalhes ou pedir direto pelo WhatsApp.">Destaques</TituloSecao>
          <Revelar as="div">
            <Link href="/produtos" className="inline-flex min-h-11 items-center gap-1.5 font-bold text-brand-strong hover:underline">
              Ver todos os produtos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Revelar>
        </div>
        {vitrine.length === 0 ? (
          <Revelar as="p" className="rounded-card bg-surface-alt p-8 text-center text-ink-muted">
            A vitrine está sendo montada. Enquanto isso, conte sua ideia pelo formulário de encomenda!
          </Revelar>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
            {vitrine.map((p, i) => (
              <CartaoProduto key={p.id} produto={p} numeroLoja={numeroLoja} indice={i} />
            ))}
          </div>
        )}
      </Faixa>

      {/* 3. Como encomendar */}
      <Faixa id="como-encomendar" className="bg-surface-alt" conteudo="flex flex-col gap-9">
        <TituloSecao centro>Como encomendar</TituloSecao>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {PASSOS.map((passo, i) => (
            <Revelar as="li" key={passo.titulo} atraso={i} className="flex flex-col gap-3 rounded-card bg-white p-7">
              <span className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-[14px] bg-brand font-heading text-[22px] font-bold text-ink">{i + 1}</span>
                <passo.icone className="size-6 text-brand-strong" aria-hidden="true" />
              </span>
              <h3 className="text-[22px] font-semibold">{passo.titulo}</h3>
              <p className="leading-relaxed text-ink-muted">{passo.texto}</p>
            </Revelar>
          ))}
        </ol>
      </Faixa>

      {/* 4. Encomenda personalizada */}
      <Faixa id="personalizado" conteudo="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          <TituloSecao subtitulo="Conte o que você imagina, mande uma foto de referência se tiver, e a gente responde pelo WhatsApp com o valor e o prazo.">
            Tem uma ideia? A gente imprime.
          </TituloSecao>
          <Revelar as="ul" className="flex flex-wrap gap-2 pt-1">
            {IDEIAS.map((ideia) => (
              <li key={ideia} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium">
                {ideia}
              </li>
            ))}
          </Revelar>
        </div>
        <Revelar as="div" atraso={1} className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-3xl bg-brand-soft p-7 md:p-9">
          <p className="font-heading text-2xl font-bold">Encomenda personalizada</p>
          <ul className="flex flex-col gap-3 text-ink-muted">
            <li className="flex gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> Preencha um formulário rápido com a sua ideia.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> A gente avalia e manda o orçamento pelo WhatsApp.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-brand" aria-hidden="true" /> Aprovou? A impressora começa a trabalhar.
            </li>
          </ul>
          <Link href="/encomenda" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-ink px-6 font-bold text-white transition-colors hover:bg-[#2c2848]">
            Pedir orçamento
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Revelar>
      </Faixa>

      {/* 5. Sobre */}
      <Faixa id="sobre" className="bg-ink text-white" conteudo="flex flex-wrap items-center gap-12">
        <Revelar as="div"
         
          className="relative flex aspect-[4/3] min-w-0 max-w-[460px] flex-[1_1_320px] items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#6B6590] bg-[#2C2848]"
        >
          {marca.fotoCriadores ? (
            <Image src={urlPublica(BUCKET_MARCA, marca.fotoCriadores)} alt="Os criadores da Matilda3D" fill sizes="(min-width: 768px) 460px, 92vw" className="object-cover" />
          ) : (
            <IlustracaoImpressora className="h-auto w-1/2 opacity-80" />
          )}
        </Revelar>
        <Revelar as="div" atraso={1} className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <span className="text-sm font-bold tracking-wide text-[#FFB48F] uppercase">Sobre nós</span>
          <h2 className="text-[clamp(30px,6vw,40px)] leading-tight font-bold tracking-tight">Jovens criadores, ideias grandes.</h2>
          <p className="text-[17px] leading-relaxed text-[#D9D5E6]">
            {marca.textoSobre ??
              "A Matilda3D nasceu da curiosidade por tecnologia e criatividade. Cada peça é modelada, impressa e acabada à mão, em casa, com atenção a cada detalhe."}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href={instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-bold text-ink transition-colors hover:bg-brand-soft"
            >
              <IconeInstagram className="size-[18px]" />
              Siga @{instagram.usuario}
            </a>
            <Link href="/sobre" className="inline-flex min-h-12 items-center gap-1.5 rounded-full px-4 font-bold text-white hover:bg-white/10">
              Nossa história
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Revelar>
      </Faixa>
    </>
  );
}
