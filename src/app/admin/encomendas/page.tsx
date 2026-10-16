import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClipboardList, ImageIcon } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { BotaoAvancar } from "@/components/painel/encomendas/interativos";
import { SelosAtencao } from "@/components/painel/encomendas/selos";
import { STATUS_ENCOMENDA, type StatusEncomenda } from "@/lib/encomenda";
import { dataIsoSaoPaulo, formatarMoeda } from "@/lib/format";
import { exigirEquipe } from "@/server/auth";
import { listarEncomendas, type EncomendaNaLista } from "@/server/encomendas";

export const metadata: Metadata = { title: "Encomendas" };

const FINALIZADAS: StatusEncomenda[] = ["entregue", "cancelada"];

export default function PaginaEncomendas() {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Encomendas</h1>
        <p className="mt-1 text-sm text-ink-muted">Pedidos personalizados que chegam pelo site, do primeiro contato à entrega.</p>
      </div>
      <Suspense fallback={<ConteudoCarregando />}>
        <Quadro />
      </Suspense>
    </section>
  );
}

async function Quadro() {
  await exigirEquipe();
  const encomendas = await listarEncomendas();
  const hoje = dataIsoSaoPaulo();
  const porStatus = new Map<StatusEncomenda, EncomendaNaLista[]>(STATUS_ENCOMENDA.map((s) => [s.valor, []]));
  for (const e of encomendas) porStatus.get(e.status)?.push(e);

  if (encomendas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white p-10 text-center">
        <ClipboardList className="size-10 text-ink-muted" aria-hidden="true" />
        <p className="font-bold">Nenhuma encomenda ainda.</p>
        <p className="max-w-sm text-sm text-ink-muted">Quando alguém preencher o formulário de encomenda no site, ela aparece aqui como &quot;Nova&quot;.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop: quadro (kanban) com uma coluna por status */}
      <div className="-mx-8 hidden overflow-x-auto px-8 pb-2 md:block">
        <div className="flex gap-4" style={{ minWidth: `${STATUS_ENCOMENDA.length * 272}px` }}>
          {STATUS_ENCOMENDA.map((s) => {
            const lista = porStatus.get(s.valor) ?? [];
            return (
              <section key={s.valor} aria-labelledby={`coluna-${s.valor}`} className="flex w-64 shrink-0 flex-col gap-3 rounded-card bg-white/60 p-3">
                <header className="flex items-baseline justify-between gap-2 px-1">
                  <h2 id={`coluna-${s.valor}`} className="text-base font-bold">{s.rotulo}</h2>
                  <span className="tabular text-sm text-ink-muted">{lista.length}</span>
                </header>
                {lista.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-xs text-ink-muted">Vazio</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {lista.map((e) => (
                      <li key={e.id}>
                        <Cartao encomenda={e} hoje={hoje} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Celular: lista agrupada por status (finalizadas recolhidas) */}
      <div className="flex flex-col gap-4 md:hidden">
        {STATUS_ENCOMENDA.map((s) => {
          const lista = porStatus.get(s.valor) ?? [];
          if (lista.length === 0) return null;
          const conteudo = (
            <ul className="flex flex-col gap-2">
              {lista.map((e) => (
                <li key={e.id}>
                  <Cartao encomenda={e} hoje={hoje} />
                </li>
              ))}
            </ul>
          );
          return FINALIZADAS.includes(s.valor) ? (
            <details key={s.valor} className="rounded-card bg-white/60 p-3">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between font-bold">
                {s.rotulo} <span className="tabular text-sm font-normal text-ink-muted">{lista.length}</span>
              </summary>
              <div className="mt-2">{conteudo}</div>
            </details>
          ) : (
            <section key={s.valor} aria-labelledby={`grupo-${s.valor}`} className="flex flex-col gap-2">
              <h2 id={`grupo-${s.valor}`} className="flex items-baseline justify-between px-1 text-base font-bold">
                {s.rotulo} <span className="tabular text-sm font-normal text-ink-muted">{lista.length}</span>
              </h2>
              {conteudo}
            </section>
          );
        })}
      </div>
    </>
  );
}

function Cartao({ encomenda: e, hoje }: { encomenda: EncomendaNaLista; hoje: string }) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3 shadow-xs">
      <Link href={`/admin/encomendas/${e.id}`} className="flex flex-col gap-0.5 hover:text-brand-strong">
        <span className="font-bold">
          #{e.numero} · {e.nomeContato}
        </span>
        <span className="flex items-center gap-1 text-sm text-ink-muted">
          {e.quantidade}x {e.tipo}
          {e.temImagem && <ImageIcon className="size-3.5" aria-label="Tem imagem de referência" />}
        </span>
      </Link>
      <SelosAtencao status={e.status} dataDesejada={e.dataDesejada} criadoEm={e.criadoEm} hoje={hoje} />
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="tabular text-ink-muted">
          {e.vendaNumero ? `Venda #${e.vendaNumero}` : e.valorOrcadoCentavos != null ? formatarMoeda(e.valorOrcadoCentavos) : ""}
        </span>
        <BotaoAvancar id={e.id} status={e.status} />
      </div>
    </article>
  );
}
