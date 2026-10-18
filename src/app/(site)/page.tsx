import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MessagesSquare, PackageCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/marca/logo";
import { botaoContorno, botaoPrimario, Faixa, SimboloPlaceholder, TituloSecao } from "@/components/site/blocos";
import { CartaoProduto } from "@/components/site/cartao-produto";
import { IconeInstagram, linkInstagram } from "@/components/site/estrutura";
import { BUCKET_MARCA, urlFotoProduto, urlPublica } from "@/lib/storage";
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

const IDEIAS = ["Chaveiro com nome", "Lembrancinhas", "Topo de bolo", "Peças para casa", "Presente único"];

export default async function PaginaInicial() {
  const [marca, destaques] = await Promise.all([obterMarca(), listarProdutosPublicos({ destaques: true })]);
  const vitrine = destaques.length ? destaques : (await listarProdutosPublicos()).slice(0, 6);
  const numeroLoja = numeroDaLoja(marca.whatsapp);
  const instagram = linkInstagram(marca.instagram);
  // Foto de destaque do hero (docs/03): a do primeiro produto da vitrine que tiver foto.
  const fotoHero = vitrine.find((p) => p.fotos[0]);

  return (
    <>
      {/* 1. Hero — o texto já carrega visível (não pode atrasar o LCP) */}
      <section className="bg-surface">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-4 pt-14 pb-16 md:px-6 md:pt-24 md:pb-24">
          <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
            <span className="rotulo text-ink-muted">Impressão 3D</span>
            <h1 className="text-[clamp(40px,8vw,60px)] leading-[1.08] font-light">
              Chaveiros e peças para casa, feitos camada por camada
            </h1>
            <p className="max-w-[500px] text-lg leading-relaxed text-ink-soft">
              Peças delicadas, impressas em casa na cor que você escolher. Escolha um modelo da vitrine ou conte a sua ideia.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/produtos" className={botaoPrimario}>
                Ver produtos
              </Link>
              <Link href="/encomenda" className={botaoContorno}>
                Quero algo personalizado
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-[1_1_380px] justify-center">
            <div className="m3d-entrada-hero relative flex aspect-square w-full max-w-[440px] items-center justify-center overflow-hidden rounded-card bg-surface-strong">
              {fotoHero ? (
                <Image
                  src={urlFotoProduto(fotoHero.fotos[0])}
                  alt={fotoHero.nome}
                  fill
                  priority
                  sizes="(min-width: 768px) 440px, 92vw"
                  className="object-cover"
                />
              ) : (
                <Logo variante="principal" altura={200} priority className="h-auto w-[62%]" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Destaques */}
      <Faixa id="vitrine" className="bg-white" conteudo="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TituloSecao rotulo="Vitrine" subtitulo="Toque em um produto para ver detalhes ou pedir direto pelo WhatsApp.">
            Destaques
          </TituloSecao>
          <Revelar as="div">
            <Link href="/produtos" className="inline-flex min-h-11 items-center gap-1.5 font-medium underline-offset-4 hover:underline">
              Ver todos os produtos
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </Revelar>
        </div>
        {vitrine.length === 0 ? (
          <Revelar as="p" className="rounded-card bg-surface p-8 text-center text-ink-soft">
            A vitrine está sendo montada. Enquanto isso, conte sua ideia pelo formulário de encomenda.
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
      <Faixa id="como-encomendar" className="bg-surface" conteudo="flex flex-col gap-10">
        <TituloSecao rotulo="Passo a passo" centro>
          Como encomendar
        </TituloSecao>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          {PASSOS.map((passo, i) => (
            <Revelar as="li" key={passo.titulo} atraso={i} className="flex flex-col gap-4 rounded-card border border-border bg-white p-7">
              <span className="flex items-center justify-between">
                <span className="font-heading text-[40px] leading-none font-light text-ink-muted" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <passo.icone className="size-6 text-ink-muted" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="text-[22px] font-normal">{passo.titulo}</h3>
              <p className="leading-relaxed text-ink-soft">{passo.texto}</p>
            </Revelar>
          ))}
        </ol>
      </Faixa>

      {/* 4. Encomenda personalizada */}
      <Faixa id="personalizado" className="bg-white" conteudo="flex flex-wrap items-center gap-12">
        <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
          <TituloSecao
            rotulo="Sob encomenda"
            subtitulo="Conte o que você imagina, mande uma foto de referência se tiver, e a gente responde pelo WhatsApp com o valor e o prazo."
          >
            Tem uma ideia? A gente imprime.
          </TituloSecao>
          <Revelar as="ul" className="flex flex-wrap gap-2 pt-1">
            {IDEIAS.map((ideia) => (
              <li key={ideia} className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-ink-soft">
                {ideia}
              </li>
            ))}
          </Revelar>
        </div>
        <Revelar as="div" atraso={1} className="flex min-w-0 flex-[1_1_420px] flex-col gap-5 rounded-card bg-surface p-7 md:p-9">
          <p className="font-heading text-[26px] font-light">Encomenda personalizada</p>
          <ul className="flex flex-col gap-3 text-ink-soft">
            {[
              "Preencha um formulário rápido com a sua ideia.",
              "A gente avalia e manda o orçamento pelo WhatsApp.",
              "Aprovou? A impressora começa a trabalhar.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-3 h-px w-4 shrink-0 bg-line" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/encomenda" className={botaoPrimario}>
            Pedir orçamento
            <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </Revelar>
      </Faixa>

      {/* 5. Sobre */}
      <Faixa id="sobre" className="bg-surface" conteudo="flex flex-wrap items-center gap-12">
        <Revelar
          as="div"
          className="relative flex aspect-[4/3] min-w-0 max-w-[460px] flex-[1_1_320px] items-center justify-center overflow-hidden rounded-card"
        >
          {marca.fotoCriadores ? (
            <Image src={urlPublica(BUCKET_MARCA, marca.fotoCriadores)} alt="Os criadores da Matilda3D" fill sizes="(min-width: 768px) 460px, 92vw" className="object-cover" />
          ) : (
            <SimboloPlaceholder tamanho={96} />
          )}
        </Revelar>
        <Revelar as="div" atraso={1} className="flex min-w-0 flex-[1_1_420px] flex-col gap-4">
          <span className="rotulo text-ink-muted">Sobre nós</span>
          <h2 className="text-[clamp(30px,6vw,40px)] leading-tight font-light">Jovens criadores, peças feitas com cuidado.</h2>
          <p className="text-[17px] leading-relaxed text-ink-soft">
            {marca.textoSobre ??
              "A Matilda3D nasceu da curiosidade por tecnologia e criatividade. Cada peça é modelada, impressa e acabada à mão, em casa, com atenção a cada detalhe."}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a href={instagram.url} target="_blank" rel="noopener noreferrer" className={botaoContorno}>
              <IconeInstagram className="size-[18px]" />
              Siga @{instagram.usuario}
            </a>
            <Link href="/sobre" className="inline-flex min-h-[52px] items-center gap-1.5 rounded-full px-4 font-medium underline-offset-4 hover:underline">
              Nossa história
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>
        </Revelar>
      </Faixa>
    </>
  );
}
