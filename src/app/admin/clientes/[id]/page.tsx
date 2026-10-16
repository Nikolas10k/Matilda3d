import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { FormularioCliente } from "@/components/painel/clientes/formulario-cliente";
import { CartaoIndicador, Secao, SeloStatus } from "@/components/painel/elementos";
import { SeloStatusEncomenda } from "@/components/painel/encomendas/selos";
import { Button } from "@/components/ui/button";
import type { StatusEncomenda } from "@/lib/encomenda";
import { formatarData, formatarMoeda, formatarWhatsApp } from "@/lib/format";
import { linkWhatsApp, type StatusPagamento } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { obterCliente } from "@/server/clientes";

export const metadata: Metadata = { title: "Cliente" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params = PageProps<"/admin/clientes/[id]">["params"];

export default function PaginaCliente({ params }: PageProps<"/admin/clientes/[id]">) {
  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/clientes" className="-mb-4 inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Clientes
      </Link>
      <Suspense fallback={<ConteudoCarregando />}>
        <Ficha params={params} />
      </Suspense>
    </section>
  );
}

async function Ficha({ params }: { params: Params }) {
  await exigirEquipe();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const c = await obterCliente(id);
  if (!c) notFound();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{c.nome}</h1>
          <p className="text-sm text-ink-muted">
            {c.whatsapp ? formatarWhatsApp(c.whatsapp) : "Sem WhatsApp"}
            {c.instagram && ` · @${c.instagram}`} · cliente desde {formatarData(c.criado_em)}
          </p>
        </div>
        {c.whatsapp && (
          <Button asChild variant="whatsapp" size="lg">
            <a href={linkWhatsApp(`Olá, ${c.nome.split(" ")[0]}! Aqui é da Matilda3D.`, c.whatsapp)} target="_blank" rel="noreferrer">
              <MessageCircle aria-hidden="true" />
              Abrir WhatsApp
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <CartaoIndicador rotulo="Compras" valor={String(c.totais.compras)} legenda="Vendas não canceladas" />
        <CartaoIndicador rotulo="Total gasto" valor={formatarMoeda(c.totais.totalGastoCentavos)} legenda="Soma das compras" />
        <CartaoIndicador
          rotulo="A receber"
          valor={formatarMoeda(c.totais.abertoCentavos)}
          legenda="Falta pagar"
          tom={c.totais.abertoCentavos > 0 ? "destaque" : "neutro"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Compras">
          {c.vendas.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma compra ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {c.vendas.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/vendas/${v.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-brand-strong">
                    <span>
                      <span className="block font-bold">Venda #{v.numero}</span>
                      <span className="block text-ink-muted">{formatarData(v.data_venda)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-0.5">
                      <span className={v.cancelada ? "tabular text-ink-muted line-through" : "tabular font-bold"}>{formatarMoeda(v.total_centavos)}</span>
                      <SeloStatus status={v.status_pagamento as StatusPagamento} cancelada={v.cancelada} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Encomendas">
          {c.encomendas.length === 0 ? (
            <p className="text-sm text-ink-muted">Nenhuma encomenda pelo site.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {c.encomendas.map((e) => (
                <li key={e.id}>
                  <Link href={`/admin/encomendas/${e.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-brand-strong">
                    <span>
                      <span className="block font-bold">
                        #{e.numero} · {e.tipo}
                      </span>
                      <span className="block text-ink-muted">Recebida em {formatarData(e.criado_em)}</span>
                    </span>
                    <SeloStatusEncomenda status={e.status as StatusEncomenda} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>

      <Secao titulo="Dados do cliente">
        <FormularioCliente
          inicial={{
            id: c.id,
            nome: c.nome,
            whatsapp: c.whatsapp ? formatarWhatsApp(c.whatsapp) : "",
            instagram: c.instagram ? `@${c.instagram}` : "",
          }}
        />
      </Secao>
    </>
  );
}
