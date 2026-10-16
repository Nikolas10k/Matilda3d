import type { Metadata } from "next";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { Secao } from "@/components/painel/elementos";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { formatarData, formatarMoeda } from "@/lib/format";
import { periodoDosParametros } from "@/lib/periodo";
import { cn } from "@/lib/utils";
import { exigirEquipe } from "@/server/auth";
import { obterRelatorioMensal } from "@/server/dashboard";

export const metadata: Metadata = { title: "Relatórios" };

type SearchParams = PageProps<"/admin/relatorios">["searchParams"];
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

const EXPORTACOES = [
  { tipo: "vendas", rotulo: "Vendas", descricao: "Uma linha por venda, com totais, pagamento e status." },
  { tipo: "itens", rotulo: "Itens vendidos", descricao: "Uma linha por item, com custo e lucro estimado." },
  { tipo: "caixa", rotulo: "Caixa", descricao: "Todos os lançamentos de entrada e saída." },
];

export default function PaginaRelatorios({ searchParams }: PageProps<"/admin/relatorios">) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Relatórios</h1>
      <Suspense fallback={<ConteudoCarregando />}>
        <Relatorios searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Relatorios({ searchParams }: { searchParams: SearchParams }) {
  await exigirEquipe();
  const p = await searchParams;
  const periodo = periodoDosParametros({ periodo: texto(p.periodo), de: texto(p.de), ate: texto(p.ate) });
  const meses = await obterRelatorioMensal(12);

  return (
    <>
      <Secao titulo="Exportar planilhas" descricao="Arquivos CSV que abrem no Excel ou no Google Planilhas, com acentos e valores certos.">
        <FiltroPeriodo atalho={periodo.atalho} de={periodo.de} ate={periodo.ate} />
        <p className="text-sm text-ink-muted">
          Período: {formatarData(periodo.de)} a {formatarData(periodo.ate)}
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {EXPORTACOES.map((e) => (
            <li key={e.tipo}>
              <a
                href={`/admin/relatorios/exportar?${new URLSearchParams({ tipo: e.tipo, de: periodo.de, ate: periodo.ate })}`}
                download
                className="flex h-full flex-col gap-1 rounded-xl border border-border p-4 transition hover:border-ink hover:shadow-sm"
              >
                <span className="flex items-center gap-2 font-bold">
                  <Download className="size-4 text-brand-strong" aria-hidden="true" />
                  {e.rotulo}
                </span>
                <span className="text-sm text-ink-muted">{e.descricao}</span>
              </a>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Resumo mensal" descricao="Últimos 12 meses. Entradas e saídas pelo dia em que o dinheiro entrou ou saiu.">
        <div className="-mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-left text-ink-muted">
              <tr>
                <th scope="col" className="py-2 pr-4 font-medium">Mês</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Entradas</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Saídas</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Resultado</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Saldo no fim</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Vendas</th>
                <th scope="col" className="py-2 text-right font-medium">Ticket médio</th>
              </tr>
            </thead>
            <tbody>
              {meses.map((m) => (
                <tr key={m.mes} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-bold capitalize">{m.rotulo}</th>
                  <td className="tabular py-2 pr-4 text-right">{formatarMoeda(m.entradasCentavos)}</td>
                  <td className="tabular py-2 pr-4 text-right">{formatarMoeda(m.saidasCentavos)}</td>
                  <td className={cn("tabular py-2 pr-4 text-right font-bold", m.resultadoCentavos < 0 ? "text-danger" : m.resultadoCentavos > 0 ? "text-success" : "")}>
                    {formatarMoeda(m.resultadoCentavos)}
                  </td>
                  <td className="tabular py-2 pr-4 text-right">{formatarMoeda(m.saldoCentavos)}</td>
                  <td className="tabular py-2 pr-4 text-right">{m.quantidadeVendas}</td>
                  <td className="tabular py-2 text-right">{formatarMoeda(m.ticketMedioCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>
    </>
  );
}
