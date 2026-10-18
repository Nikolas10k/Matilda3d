import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Faixa } from "@/components/site/blocos";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { linkPedido, mensagemEncomendaEnviada, numeroDaLoja } from "@/lib/whatsapp-site";
import { obterMarca } from "@/server/publico";

export const metadata: Metadata = {
  title: "Encomenda enviada",
  robots: { index: false, follow: false },
};

export default function PaginaObrigado({ searchParams }: PageProps<"/obrigado">) {
  return (
    <Faixa conteudo="flex flex-col items-center gap-5 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="size-9" aria-hidden="true" />
      </span>
      <h1 className="text-[clamp(32px,6vw,44px)] leading-tight font-light">Encomenda enviada!</h1>
      <Suspense fallback={<p className="text-lg text-ink-muted">Recebemos a sua ideia.</p>}>
        <Confirmacao searchParams={searchParams} />
      </Suspense>
      <Link href="/produtos" className="inline-flex min-h-11 items-center font-medium text-ink underline-offset-4 hover:underline">
        Ver a vitrine enquanto isso
      </Link>
    </Faixa>
  );
}

async function Confirmacao({ searchParams }: { searchParams: PageProps<"/obrigado">["searchParams"] }) {
  const params = await searchParams;
  const numero = typeof params.n === "string" && /^\d{1,9}$/.test(params.n) ? Number(params.n) : null;
  const marca = await obterMarca();
  const link = linkPedido(numeroDaLoja(marca.whatsapp), mensagemEncomendaEnviada(numero));

  return (
    <>
      <p className="max-w-lg text-lg text-ink-muted">
        {numero ? (
          <>
            Recebemos a sua encomenda <strong className="text-ink">#{numero}</strong>.{" "}
          </>
        ) : (
          "Recebemos a sua encomenda. "
        )}
        A gente responde pelo WhatsApp com o valor e o prazo. Se quiser adiantar a conversa, é só tocar no botão abaixo.
      </p>
      <BotaoWhatsApp href={link} origem="encomenda" className="min-h-[52px] px-8 text-base">
        Continuar no WhatsApp
      </BotaoWhatsApp>
    </>
  );
}
