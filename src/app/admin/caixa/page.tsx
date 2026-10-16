import type { Metadata } from "next";
import { Suspense } from "react";
import { BotoesCaixa, ListaCaixa } from "@/components/painel/caixa/lista-caixa";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { CartaoIndicador, classeSelect } from "@/components/painel/elementos";
import { FiltroPeriodo } from "@/components/painel/filtro-periodo";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMoeda } from "@/lib/format";
import { periodoDosParametros } from "@/lib/periodo";
import { CATEGORIAS_AUTOMATICAS, CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA } from "@/lib/validacao/caixa";
import { exigirEquipe } from "@/server/auth";
import { obterCaixa } from "@/server/caixa";

export const metadata: Metadata = { title: "Caixa" };

type SearchParams = PageProps<"/admin/caixa">["searchParams"];
const texto = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const TODAS_CATEGORIAS = [...new Set([...CATEGORIAS_SAIDA, ...CATEGORIAS_ENTRADA, ...CATEGORIAS_AUTOMATICAS])].sort();

export default function PaginaCaixa({ searchParams }: PageProps<"/admin/caixa">) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">Caixa</h1>
      <Suspense fallback={<ConteudoCarregando />}>
        <LivroCaixa searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function LivroCaixa({ searchParams }: { searchParams: SearchParams }) {
  const usuario = await exigirEquipe();
  const p = await searchParams;
  const periodo = periodoDosParametros({ periodo: texto(p.periodo), de: texto(p.de), ate: texto(p.ate) });
  const tipo = p.tipo === "entrada" || p.tipo === "saida" ? p.tipo : undefined;
  const categoria = TODAS_CATEGORIAS.find((c) => c === p.categoria);

  const caixa = await obterCaixa({ de: periodo.de, ate: periodo.ate, tipo, categoria }, usuario);
  const resultado = caixa.entradasCentavos - caixa.saidasCentavos;

  return (
    <>
      <div className="-mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">O caixa conta a partir de {formatarData(caixa.dataInicioCaixa)}.</p>
        <BotoesCaixa usuarioId={usuario.id} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <CartaoIndicador
          rotulo="Saldo em caixa"
          valor={formatarMoeda(caixa.saldoAtualCentavos)}
          legenda="Quanto dinheiro vocês têm, somando o que entrou e tirando o que saiu"
          tom={caixa.saldoAtualCentavos < 0 ? "negativo" : "destaque"}
        />
        <CartaoIndicador rotulo="Entradas" valor={formatarMoeda(caixa.entradasCentavos)} legenda="Todo dinheiro que entrou no período" tom="positivo" />
        <CartaoIndicador rotulo="Saídas" valor={formatarMoeda(caixa.saidasCentavos)} legenda="Tudo o que foi gasto no período" tom="negativo" />
        <CartaoIndicador
          rotulo="Resultado"
          valor={formatarMoeda(resultado)}
          legenda="Entradas − saídas. Positivo = sobrou dinheiro"
          tom={resultado < 0 ? "negativo" : "positivo"}
        />
      </div>

      <FiltroPeriodo atalho={periodo.atalho} de={periodo.de} ate={periodo.ate} />

      <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" aria-label="Filtros do caixa">
        {texto(p.periodo) && <input type="hidden" name="periodo" value={texto(p.periodo)} />}
        {texto(p.de) && <input type="hidden" name="de" value={texto(p.de)} />}
        {texto(p.ate) && <input type="hidden" name="ate" value={texto(p.ate)} />}
        <label className="sr-only" htmlFor="f-tipo">Tipo</label>
        <select id="f-tipo" name="tipo" defaultValue={tipo ?? ""} className={classeSelect}>
          <option value="">Entradas e saídas</option>
          <option value="entrada">Só entradas</option>
          <option value="saida">Só saídas</option>
        </select>
        <label className="sr-only" htmlFor="f-categoria">Categoria</label>
        <select id="f-categoria" name="categoria" defaultValue={categoria ?? ""} className={classeSelect}>
          <option value="">Todas as categorias</option>
          {TODAS_CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Button type="submit" variant="outline">Filtrar</Button>
      </form>

      <ListaCaixa lancamentos={caixa.lancamentos} usuarioId={usuario.id} />
    </>
  );
}
