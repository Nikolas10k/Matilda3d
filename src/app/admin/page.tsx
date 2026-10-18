import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CalendarClock, Minus, Plus } from "lucide-react";
import { GraficoEntradasSaidas, GraficoSaldo } from "@/components/painel/dashboard/graficos";
import { CartaoIndicador, Secao, SeloStatus } from "@/components/painel/elementos";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatarData, formatarMoeda, formatarPercentual } from "@/lib/format";
import { periodoDosParametros } from "@/lib/periodo";
import { exigirEquipe } from "@/server/auth";
import { obterDashboard } from "@/server/dashboard";

export const metadata: Metadata = { title: "Início" };

type SearchParams = PageProps<"/admin">["searchParams"];
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

const ROTULO_STATUS_ENCOMENDA: Record<string, string> = {
  nova: "Nova",
  em_conversa: "Em conversa",
  orcada: "Orçada",
  aprovada: "Aprovada",
  em_producao: "Em produção",
  pronta: "Pronta",
};

export default function PaginaDashboard({ searchParams }: PageProps<"/admin">) {
  return (
    <section className="flex flex-col gap-6 pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={<Skeleton className="h-9 w-48" />}>
          <Saudacao />
        </Suspense>
        <AcoesRapidas className="hidden md:flex" />
      </div>
      <Suspense fallback={<DashboardCarregando />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
      {/* Ações rápidas fixas no celular, acima do menu inferior (docs/04) */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-white/95 px-4 py-2 backdrop-blur md:hidden">
        <AcoesRapidas className="grid grid-cols-2" />
      </div>
    </section>
  );
}

async function Saudacao() {
  const usuario = await exigirEquipe();
  return <h1 className="text-2xl font-bold md:text-3xl">Olá, {usuario.nome.split(" ")[0]}!</h1>;
}

function AcoesRapidas({ className }: { className?: string }) {
  return (
    <div className={`gap-2 ${className ?? ""}`}>
      <Button asChild>
        <Link href="/admin/vendas/nova">
          <Plus aria-hidden="true" />
          Nova venda
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/admin/caixa?nova=despesa">
          <Minus aria-hidden="true" />
          Nova despesa
        </Link>
      </Button>
    </div>
  );
}

function DashboardCarregando() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando o dashboard">
      <Skeleton className="h-11 w-full max-w-xl rounded-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-card" />
        <Skeleton className="h-80 rounded-card" />
      </div>
    </div>
  );
}

async function Dashboard({ searchParams }: { searchParams: SearchParams }) {
  await exigirEquipe();
  const p = await searchParams;
  const periodo = periodoDosParametros({ periodo: texto(p.periodo), de: texto(p.de), ate: texto(p.ate) });
  const d = await obterDashboard(periodo);
  const i = d.indicadores;

  return (
    <>
      <FiltroPeriodo atalho={periodo.atalho} de={periodo.de} ate={periodo.ate} />
      <p className="-mt-3 text-sm text-ink-muted">
        De {formatarData(periodo.de)} a {formatarData(periodo.ate)}
      </p>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoIndicador rotulo="Entradas" valor={formatarMoeda(i.entradasCentavos)} legenda="Todo dinheiro que entrou" tom="positivo" />
        <CartaoIndicador rotulo="Saídas" valor={formatarMoeda(i.saidasCentavos)} legenda="Tudo o que foi gasto" tom="negativo" />
        <CartaoIndicador
          rotulo="Resultado"
          valor={formatarMoeda(i.resultadoCentavos)}
          legenda="Entradas − saídas. Se positivo, o negócio deu lucro no período"
          tom={i.resultadoCentavos < 0 ? "negativo" : "positivo"}
        />
        <CartaoIndicador
          rotulo="Saldo em caixa"
          valor={formatarMoeda(i.saldoCaixaCentavos)}
          legenda="Quanto dinheiro vocês têm agora"
          tom={i.saldoCaixaCentavos < 0 ? "negativo" : "destaque"}
        />
        <CartaoIndicador rotulo="Vendas" valor={String(i.quantidadeVendas)} legenda="Número de pedidos fechados (sem os cancelados)" />
        <CartaoIndicador rotulo="Ticket médio" valor={formatarMoeda(i.ticketMedioCentavos)} legenda="Quanto cada cliente gasta, em média" />
        <CartaoIndicador
          rotulo="A receber"
          valor={formatarMoeda(i.aReceberCentavos)}
          legenda="Dinheiro de vendas que ainda não foi pago"
          tom={i.aReceberCentavos > 0 ? "destaque" : "neutro"}
        />
        <CartaoIndicador
          rotulo="Lucro bruto estimado"
          valor={formatarMoeda(d.lucro.lucroCentavos)}
          legenda="Preço − custo das peças vendidas no período"
          aviso={
            d.lucro.itensSemCusto > 0
              ? `${d.lucro.itensSemCusto} ${d.lucro.itensSemCusto === 1 ? "item sem custo" : "itens sem custo"}: o lucro pode estar maior do que o real`
              : undefined
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Entradas × saídas" descricao="Últimos 6 meses">
          <GraficoEntradasSaidas meses={d.meses} />
        </Secao>
        <Secao titulo="Saldo em caixa" descricao="No fim de cada mês, últimos 6 meses">
          <GraficoSaldo meses={d.meses} />
        </Secao>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Saídas por categoria" descricao="Para onde foi o dinheiro no período">
          {d.categorias.length === 0 ? (
            <Vazio texto="Nenhuma saída no período." />
          ) : (
            <ul className="flex flex-col gap-3">
              {d.categorias.map((c) => (
                <li key={c.categoria} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium">{c.categoria}</span>
                    <span className="tabular text-ink-muted">
                      <span className="font-bold text-ink">{formatarMoeda(c.valorCentavos)}</span> · {formatarPercentual(c.fracao, 0)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
                    <div className="h-full rounded-full bg-[#A85A32]" style={{ width: `${Math.max(c.fracao * 100, 2)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao
          titulo="Encomendas que precisam de atenção"
          descricao="Novas ou com data desejada nos próximos 7 dias"
          acao={
            <Link href="/admin/encomendas" className="inline-flex min-h-11 items-center text-sm font-medium text-ink hover:underline">
              Ver todas
            </Link>
          }
        >
          {d.encomendas.length === 0 ? (
            <Vazio texto="Nenhuma encomenda pendente. Tudo em dia!" />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {d.encomendas.map((e) => {
                const urgente = e.data_desejada && e.data_desejada <= d.hoje;
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span>
                      <span className="block font-bold">
                        #{e.numero} · {e.nome_contato}
                      </span>
                      <span className="block text-ink-muted">
                        {e.tipo} · {ROTULO_STATUS_ENCOMENDA[e.status] ?? e.status}
                      </span>
                    </span>
                    {e.data_desejada && (
                      <span className={`flex shrink-0 items-center gap-1 font-medium ${urgente ? "text-danger" : "text-warning"}`}>
                        {urgente ? <AlertTriangle className="size-4" aria-hidden="true" /> : <CalendarClock className="size-4" aria-hidden="true" />}
                        {formatarData(e.data_desejada)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Secao titulo="Mais vendidos" descricao="No período, por quantidade">
          {d.maisVendidos.length === 0 ? (
            <Vazio texto="Nenhuma venda no período." />
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {d.maisVendidos.map((p, n) => (
                <li key={p.nome} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate">
                    <span className="mr-2 text-ink-muted">{n + 1}.</span>
                    <span className="font-bold">{p.nome}</span>
                  </span>
                  <span className="tabular shrink-0 text-ink-muted">
                    {p.quantidade} un · <span className="font-bold text-ink">{formatarMoeda(p.totalCentavos)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Secao>

        <Secao titulo="Mais procurados no site" descricao="Cliques no botão do WhatsApp">
          {d.maisProcurados.length === 0 ? (
            <Vazio texto="Ainda sem cliques no período. Os cliques começam a contar quando o site for ao ar." />
          ) : (
            <ol className="flex flex-col divide-y divide-border">
              {d.maisProcurados.map((p, n) => (
                <li key={p.nome} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="truncate">
                    <span className="mr-2 text-ink-muted">{n + 1}.</span>
                    <span className="font-bold">{p.nome}</span>
                  </span>
                  <span className="tabular shrink-0 text-ink-muted">{p.cliques} cliques</span>
                </li>
              ))}
            </ol>
          )}
        </Secao>

        <Secao
          titulo="Últimas vendas"
          acao={
            <Link href="/admin/vendas" className="inline-flex min-h-11 items-center text-sm font-medium text-ink hover:underline">
              Ver todas
            </Link>
          }
        >
          {d.ultimasVendas.length === 0 ? (
            <Vazio texto="Nenhuma venda registrada ainda." />
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {d.ultimasVendas.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/vendas/${v.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-ink-soft">
                    <span className="min-w-0">
                      <span className="block truncate font-bold">
                        #{v.numero} · {v.cliente ?? "Venda avulsa"}
                      </span>
                      <span className="block text-ink-muted">{formatarData(v.data)}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className={v.cancelada ? "tabular text-ink-muted line-through" : "tabular font-bold"}>{formatarMoeda(v.totalCentavos)}</span>
                      <SeloStatus status={v.status} cancelada={v.cancelada} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <p className="rounded-xl bg-surface px-4 py-6 text-center text-sm text-ink-muted">{texto}</p>;
}
