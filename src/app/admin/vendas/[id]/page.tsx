import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { Secao, SeloStatus } from "@/components/painel/elementos";
import { AcoesVenda, EdicaoVenda } from "@/components/painel/vendas/acoes-venda";
import { formatarData, formatarDataHora, formatarMoeda, formatarWhatsApp } from "@/lib/format";
import { linkWhatsApp, mensagemRecibo, rotuloCanal, rotuloForma, type StatusPagamento } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { obterVenda } from "@/server/vendas";

export const metadata: Metadata = { title: "Venda" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Params = PageProps<"/admin/vendas/[id]">["params"];

export default function PaginaVenda({ params }: PageProps<"/admin/vendas/[id]">) {
  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/vendas" className="-mb-4 inline-flex min-h-11 items-center gap-1 self-start text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Vendas
      </Link>
      <Suspense fallback={<ConteudoCarregando />}>
        <DetalheVenda params={params} />
      </Suspense>
    </section>
  );
}

async function DetalheVenda({ params }: { params: Params }) {
  await exigirEquipe();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const venda = await obterVenda(id);
  if (!venda) notFound();

  const aberto = venda.total_centavos - venda.pago_centavos;
  const recibo = mensagemRecibo({
    numero: venda.numero,
    data: venda.data_venda,
    cliente: venda.clientes?.nome ?? null,
    itens: venda.venda_itens.map((i) => ({
      descricao: i.descricao,
      cor: i.cor,
      quantidade: i.quantidade,
      totalCentavos: i.total_centavos ?? i.quantidade * i.preco_unitario_centavos,
    })),
    descontoCentavos: venda.desconto_centavos,
    freteCentavos: venda.frete_centavos,
    totalCentavos: venda.total_centavos,
    pagoCentavos: venda.pago_centavos,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Venda #{venda.numero}</h1>
        <SeloStatus status={venda.status_pagamento as StatusPagamento} cancelada={venda.cancelada} />
      </div>
      <p className="-mt-4 text-sm text-ink-muted">
        {formatarData(venda.data_venda)} · {rotuloCanal(venda.canal)}
        {venda.perfis?.nome && ` · registrada por ${venda.perfis.nome}`}
        {venda.encomendas && (
          <>
            {" · "}
            <Link href={`/admin/encomendas/${venda.encomendas.id}`} className="font-medium text-ink hover:underline">
              Encomenda #{venda.encomendas.numero}
            </Link>
          </>
        )}
      </p>

      {venda.cancelada && (
        <div role="status" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm">
          <p className="font-bold text-danger">Venda cancelada{venda.cancelada_em && ` em ${formatarDataHora(venda.cancelada_em)}`}.</p>
          {venda.motivo_cancelamento && <p className="text-ink">Motivo: {venda.motivo_cancelamento}</p>}
          <p className="text-ink-muted">Os valores recebidos foram estornados no caixa.</p>
        </div>
      )}

      <AcoesVenda
        vendaId={venda.id}
        numero={venda.numero}
        abertoCentavos={aberto}
        cancelada={venda.cancelada}
        linkRecibo={linkWhatsApp(recibo, venda.clientes?.whatsapp)}
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Secao titulo="Itens">
          <ul className="flex flex-col divide-y divide-border">
            {venda.venda_itens.map((i) => (
              <li key={i.id} className="flex items-start justify-between gap-3 py-3">
                <span>
                  <span className="block font-bold">
                    {i.quantidade}x {i.descricao}
                  </span>
                  <span className="block text-sm text-ink-muted">
                    {i.cor ? `Cor: ${i.cor} · ` : ""}
                    {formatarMoeda(i.preco_unitario_centavos)} cada
                  </span>
                </span>
                <span className="tabular font-bold">{formatarMoeda(i.total_centavos ?? 0)}</span>
              </li>
            ))}
          </ul>
          <dl className="tabular flex flex-col gap-1 border-t border-border pt-3 text-sm">
            <Linha rotulo="Subtotal" valor={formatarMoeda(venda.subtotal_centavos)} />
            {venda.desconto_centavos > 0 && <Linha rotulo="Desconto" valor={`−${formatarMoeda(venda.desconto_centavos)}`} />}
            {venda.frete_centavos > 0 && <Linha rotulo="Frete" valor={formatarMoeda(venda.frete_centavos)} />}
            <Linha rotulo="Total" valor={formatarMoeda(venda.total_centavos)} forte />
            <Linha rotulo="Pago" valor={formatarMoeda(venda.pago_centavos)} />
            {!venda.cancelada && aberto > 0 && <Linha rotulo="Falta pagar" valor={formatarMoeda(aberto)} destaque />}
          </dl>
        </Secao>

        <div className="flex flex-col gap-6">
          <Secao titulo="Pagamentos recebidos">
            {venda.venda_pagamentos.length === 0 ? (
              <p className="text-sm text-ink-muted">Nenhum pagamento registrado ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {venda.venda_pagamentos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="block font-bold">{rotuloForma(p.forma)}</span>
                      <span className="block text-ink-muted">{formatarData(p.data)}</span>
                    </span>
                    <span className="tabular font-bold text-success">{formatarMoeda(p.valor_centavos)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Cliente e observações" descricao="Depois de salva, só estes dados podem mudar.">
            {venda.clientes?.whatsapp && (
              <a
                href={linkWhatsApp(`Olá, ${venda.clientes.nome.split(" ")[0]}!`, venda.clientes.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 self-start text-sm font-bold text-ink hover:underline"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                {formatarWhatsApp(venda.clientes.whatsapp)}
              </a>
            )}
            <EdicaoVenda
              vendaId={venda.id}
              cliente={venda.clientes ? { id: venda.clientes.id, nome: venda.clientes.nome, whatsapp: venda.clientes.whatsapp } : null}
              observacoes={venda.observacoes ?? ""}
            />
          </Secao>
        </div>
      </div>
    </>
  );
}

function Linha({ rotulo, valor, forte, destaque }: { rotulo: string; valor: string; forte?: boolean; destaque?: boolean }) {
  return (
    <div className={`flex justify-between ${forte ? "text-base font-bold" : ""} ${destaque ? "font-bold text-ink" : ""}`}>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}
