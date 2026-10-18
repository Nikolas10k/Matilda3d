import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { CartaoIndicador, classeSelect, SeloStatus } from "@/components/painel/elementos";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMoeda } from "@/lib/format";
import { periodoDosParametros } from "@/lib/periodo";
import { CANAIS, FORMAS_PAGAMENTO, rotuloCanal, type Canal, type FormaPagamento } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { listarVendas, type FiltroVendas } from "@/server/vendas";

export const metadata: Metadata = { title: "Vendas" };

type SearchParams = PageProps<"/admin/vendas">["searchParams"];

const STATUS = [
  { valor: "pago", rotulo: "Pago" },
  { valor: "parcial", rotulo: "Parcial" },
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "cancelada", rotulo: "Cancelada" },
] as const;

const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default function PaginaVendas({ searchParams }: PageProps<"/admin/vendas">) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Vendas</h1>
        <Button asChild>
          <Link href="/admin/vendas/nova">
            <Plus aria-hidden="true" />
            Nova venda
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ConteudoCarregando />}>
        <ListaVendas searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function ListaVendas({ searchParams }: { searchParams: SearchParams }) {
  await exigirEquipe();
  const p = await searchParams;
  const periodo = periodoDosParametros({ periodo: texto(p.periodo), de: texto(p.de), ate: texto(p.ate) });
  const filtro: FiltroVendas = {
    de: periodo.de,
    ate: periodo.ate,
    status: STATUS.find((s) => s.valor === p.status)?.valor,
    canal: CANAIS.find((c) => c.valor === p.canal)?.valor as Canal | undefined,
    forma: FORMAS_PAGAMENTO.find((f) => f.valor === p.forma)?.valor as FormaPagamento | undefined,
  };
  const { vendas, totais } = await listarVendas(filtro);

  return (
    <>
      <FiltroPeriodo atalho={periodo.atalho} de={periodo.de} ate={periodo.ate} />

      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]" aria-label="Filtros de vendas">
        {texto(p.periodo) && <input type="hidden" name="periodo" value={texto(p.periodo)} />}
        {texto(p.de) && <input type="hidden" name="de" value={texto(p.de)} />}
        {texto(p.ate) && <input type="hidden" name="ate" value={texto(p.ate)} />}
        <label className="sr-only" htmlFor="f-status">Status</label>
        <select id="f-status" name="status" defaultValue={filtro.status ?? ""} className={classeSelect}>
          <option value="">Todos os status</option>
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>{s.rotulo}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-canal">Canal</label>
        <select id="f-canal" name="canal" defaultValue={filtro.canal ?? ""} className={classeSelect}>
          <option value="">Todos os canais</option>
          {CANAIS.map((c) => (
            <option key={c.valor} value={c.valor}>{c.rotulo}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="f-forma">Forma de pagamento</label>
        <select id="f-forma" name="forma" defaultValue={filtro.forma ?? ""} className={classeSelect}>
          <option value="">Todas as formas</option>
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f.valor} value={f.valor}>{f.rotulo}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoIndicador rotulo="Vendas" valor={String(totais.quantidade)} legenda="Pedidos fechados (sem as canceladas)" />
        <CartaoIndicador rotulo="Total vendido" valor={formatarMoeda(totais.totalCentavos)} legenda="Soma das vendas do filtro" />
        <CartaoIndicador rotulo="Recebido" valor={formatarMoeda(totais.pagoCentavos)} legenda="O que já foi pago" tom="positivo" />
        <CartaoIndicador
          rotulo="A receber"
          valor={formatarMoeda(totais.abertoCentavos)}
          legenda="O que ainda falta pagar"
          tom={totais.abertoCentavos > 0 ? "destaque" : "neutro"}
        />
      </div>

      {vendas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white p-10 text-center">
          <ShoppingBag className="size-10 text-ink-muted" aria-hidden="true" />
          <p className="font-bold">Nenhuma venda neste período.</p>
          <Button asChild>
            <Link href="/admin/vendas/nova">Registrar uma venda</Link>
          </Button>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {vendas.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/vendas/${v.id}`} className="flex flex-col gap-1 rounded-card border border-border bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      #{v.numero} · {v.cliente ?? "Venda avulsa"}
                    </span>
                    <SeloStatus status={v.status} cancelada={v.cancelada} />
                  </div>
                  <span className="line-clamp-1 text-sm text-ink-muted">{v.itens}</span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-muted">
                      {formatarData(v.data)} · {rotuloCanal(v.canal)}
                    </span>
                    <span className={v.cancelada ? "tabular font-bold text-ink-muted line-through" : "tabular font-bold"}>
                      {formatarMoeda(v.totalCentavos)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-card border border-border bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Nº</th>
                  <th scope="col" className="px-4 py-3 font-medium">Data</th>
                  <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
                  <th scope="col" className="px-4 py-3 font-medium">Itens</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Pago</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Canal</th>
                </tr>
              </thead>
              <tbody>
                {vendas.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/vendas/${v.id}`} className="font-bold hover:text-ink-soft hover:underline">
                        #{v.numero}
                      </Link>
                    </td>
                    <td className="tabular px-4 py-3">{formatarData(v.data)}</td>
                    <td className="px-4 py-3">{v.cliente ?? <span className="text-ink-muted">Avulsa</span>}</td>
                    <td className="max-w-64 truncate px-4 py-3 text-ink-muted">{v.itens}</td>
                    <td className={v.cancelada ? "tabular px-4 py-3 text-right text-ink-muted line-through" : "tabular px-4 py-3 text-right font-bold"}>
                      {formatarMoeda(v.totalCentavos)}
                    </td>
                    <td className="tabular px-4 py-3 text-right">{formatarMoeda(v.pagoCentavos)}</td>
                    <td className="px-4 py-3">
                      <SeloStatus status={v.status} cancelada={v.cancelada} />
                    </td>
                    <td className="px-4 py-3">{rotuloCanal(v.canal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
