import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, ShoppingBag } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { Secao, SeloStatus } from "@/components/painel/elementos";
import { FormularioEncomenda } from "@/components/painel/encomendas/interativos";
import { SeloStatusEncomenda, SelosAtencao } from "@/components/painel/encomendas/selos";
import { Button } from "@/components/ui/button";
import { podeVirarVenda, rotuloStatusEncomenda } from "@/lib/encomenda";
import { centavosParaTexto, dataIsoSaoPaulo, formatarData, formatarDataHora, formatarMoeda, formatarWhatsApp } from "@/lib/format";
import { linkWhatsApp, type StatusPagamento } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { obterEncomenda } from "@/server/encomendas";

export const metadata: Metadata = { title: "Encomenda" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params = PageProps<"/admin/encomendas/[id]">["params"];

export default function PaginaEncomenda({ params }: PageProps<"/admin/encomendas/[id]">) {
  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/encomendas" className="-mb-4 inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Encomendas
      </Link>
      <Suspense fallback={<ConteudoCarregando />}>
        <Detalhe params={params} />
      </Suspense>
    </section>
  );
}

async function Detalhe({ params }: { params: Params }) {
  await exigirEquipe();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const e = await obterEncomenda(id);
  if (!e) notFound();

  const vendaAtiva = e.vendas && !e.vendas.cancelada ? e.vendas : null;
  const primeiroNome = e.nome_contato.split(" ")[0];
  const conversa = linkWhatsApp(
    `Olá, ${primeiroNome}! Aqui é da Matilda3D, sobre a sua encomenda #${e.numero} (${e.quantidade}x ${e.tipo}).`,
    e.whatsapp,
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Encomenda #{e.numero}</h1>
        <SeloStatusEncomenda status={e.status} />
      </div>
      <div className="-mt-4 flex flex-col gap-2">
        <p className="text-sm text-ink-muted">Recebida em {formatarDataHora(e.criado_em)}</p>
        <SelosAtencao status={e.status} dataDesejada={e.data_desejada} criadoEm={e.criado_em} hoje={dataIsoSaoPaulo()} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild variant="whatsapp" size="lg">
          <a href={conversa} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden="true" />
            Abrir conversa no WhatsApp
          </a>
        </Button>
        {podeVirarVenda(e.status, Boolean(vendaAtiva)) && (
          <Button asChild size="lg">
            <Link href={`/admin/vendas/nova?encomenda=${e.id}`}>
              <ShoppingBag aria-hidden="true" />
              Transformar em venda
            </Link>
          </Button>
        )}
      </div>

      {vendaAtiva && (
        <Link
          href={`/admin/vendas/${vendaAtiva.id}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm hover:border-success"
        >
          <span>
            <span className="font-bold">Venda #{vendaAtiva.numero}</span> vinculada · {formatarMoeda(vendaAtiva.total_centavos)}
          </span>
          <span className="flex items-center gap-2">
            <SeloStatus status={vendaAtiva.status_pagamento as StatusPagamento} />
            <ArrowRight className="size-4" aria-hidden="true" />
          </span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Secao titulo="Pedido">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Dado rotulo="Tipo de peça" valor={e.tipo} />
              <Dado rotulo="Quantidade" valor={String(e.quantidade)} />
              <Dado rotulo="Data desejada" valor={e.data_desejada ? formatarData(e.data_desejada) : "Sem data"} />
              <Dado rotulo="Cores" valor={e.cores || "Não informou"} />
            </dl>
            <div>
              <p className="text-sm font-bold">Ideia do cliente</p>
              <p className="mt-1 whitespace-pre-line text-ink">{e.descricao}</p>
            </div>
            {e.urlImagem && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold">Imagem de referência</p>
                <a href={e.urlImagem} target="_blank" rel="noreferrer" className="block max-w-sm overflow-hidden rounded-xl border border-border">
                  {/* Link assinado e temporário (bucket privado): next/image não otimiza URLs que expiram. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.urlImagem} alt={`Referência enviada para a encomenda #${e.numero}`} className="h-auto w-full" />
                </a>
              </div>
            )}
          </Secao>

          <Secao titulo="Cliente">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <Dado rotulo="Nome" valor={e.nome_contato} />
              <Dado rotulo="WhatsApp" valor={formatarWhatsApp(e.whatsapp)} />
            </dl>
            <p className="text-sm text-ink-muted">
              {e.consentimento_contato ? "Autorizou contato pelo WhatsApp sobre esta encomenda." : "Sem autorização de contato registrada."}
            </p>
            {e.clientes && (
              <Link href={`/admin/clientes/${e.clientes.id}`} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-brand-strong hover:underline">
                Ver ficha do cliente
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
          </Secao>
        </div>

        <div className="flex flex-col gap-6">
          <Secao titulo="Andamento">
            <FormularioEncomenda
              inicial={{
                id: e.id,
                status: e.status,
                valorOrcado: centavosParaTexto(e.valor_orcado_centavos),
                previsaoEntrega: e.previsao_entrega ?? "",
                notasInternas: e.notas_internas ?? "",
              }}
            />
          </Secao>

          <Secao titulo="Histórico">
            <ol className="flex flex-col gap-3 border-l-2 border-border pl-4">
              {e.historico.map((h, i) => (
                <li key={i} className="text-sm">
                  <p className="font-bold">
                    {h.status_anterior ? `${rotuloStatusEncomenda(h.status_anterior)} → ${rotuloStatusEncomenda(h.status_novo)}` : `Recebida como ${rotuloStatusEncomenda(h.status_novo)}`}
                  </p>
                  <p className="text-ink-muted">
                    {formatarDataHora(h.criado_em)} · {h.perfis?.nome ?? (h.status_anterior ? "Equipe" : "Site")}
                  </p>
                </li>
              ))}
            </ol>
          </Secao>
        </div>
      </div>
    </>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-ink-muted">{rotulo}</dt>
      <dd className="font-bold">{valor}</dd>
    </div>
  );
}
