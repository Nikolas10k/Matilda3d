"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDownCircle, ArrowUpCircle, FileText, Minus, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { FormularioLancamento } from "@/components/painel/caixa/formulario-lancamento";
import { Button } from "@/components/ui/button";
import { centavosParaTexto, dataIsoSaoPaulo, formatarData, formatarMoeda } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ValoresLancamento } from "@/lib/validacao/caixa";
import { rotuloForma, type FormaPagamento } from "@/lib/venda";
import { excluirLancamento, linkComprovante } from "@/server/actions/caixa";
import type { LancamentoNaLista } from "@/server/caixa";

const NOVO = (tipo: "entrada" | "saida"): ValoresLancamento => ({
  tipo,
  data: dataIsoSaoPaulo(),
  descricao: "",
  categoria: "",
  valor: "",
  forma: "",
  comprovante: "",
});

/** Botões "Nova despesa" e "Nova entrada" (topo da página). */
export function BotoesCaixa({ usuarioId, abrir }: { usuarioId: string; abrir?: "entrada" | "saida" }) {
  const [formulario, setFormulario] = useState<{ chave: number; valores: ValoresLancamento } | null>(
    abrir ? { chave: 0, valores: NOVO(abrir) } : null,
  );
  const router = useRouter();
  const abrirFormulario = (tipo: "entrada" | "saida") => setFormulario({ chave: Date.now(), valores: NOVO(tipo) });
  const fechar = () => {
    setFormulario(null);
    if (abrir) router.replace("/admin/caixa"); // tira o ?nova= da URL (veio do atalho do dashboard)
  };

  return (
    <div className="flex gap-2">
      <Button type="button" onClick={() => abrirFormulario("saida")}>
        <Minus aria-hidden="true" />
        Nova despesa
      </Button>
      <Button type="button" variant="outline" onClick={() => abrirFormulario("entrada")}>
        <Plus aria-hidden="true" />
        Nova entrada
      </Button>
      {formulario && (
        <FormularioLancamento
          key={formulario.chave}
          aberto
          aoFechar={fechar}
          usuarioId={usuarioId}
          inicial={formulario.valores}
        />
      )}
    </div>
  );
}

export function ListaCaixa({ lancamentos, usuarioId }: { lancamentos: LancamentoNaLista[]; usuarioId: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState<ValoresLancamento | null>(null);
  const [excluindo, iniciarExclusao] = useTransition();

  async function verComprovante(caminho: string) {
    const url = await linkComprovante(caminho);
    if (url) window.open(url, "_blank", "noopener");
    else toast.error("Não foi possível abrir o comprovante.");
  }

  function excluir(l: LancamentoNaLista) {
    if (!window.confirm(`Excluir "${l.descricao}"? Isso muda o saldo do caixa.`)) return;
    iniciarExclusao(async () => {
      const r = await excluirLancamento(l.id);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success("Lançamento excluído.");
      router.refresh();
    });
  }

  if (lancamentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white p-10 text-center">
        <Wallet className="size-10 text-ink-muted" aria-hidden="true" />
        <p className="font-bold">Nenhum lançamento neste período.</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-white">
        {lancamentos.map((l) => {
          const entrada = l.tipo === "entrada";
          const Icone = entrada ? ArrowDownCircle : ArrowUpCircle;
          return (
            <li key={l.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Icone
                  className={cn("mt-0.5 size-5 shrink-0", entrada ? "text-success" : "text-danger")}
                  aria-label={entrada ? "Entrada" : "Saída"}
                />
                <div className="min-w-0">
                  <p className="font-bold">
                    {l.vendaId ? (
                      <Link href={`/admin/vendas/${l.vendaId}`} className="hover:text-brand-strong hover:underline">
                        {l.descricao}
                      </Link>
                    ) : (
                      l.descricao
                    )}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {formatarData(l.data)} · {l.categoria}
                    {l.formaPagamento && ` · ${rotuloForma(l.formaPagamento)}`}
                    {l.autor && !l.vendaId && ` · por ${l.autor}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="flex gap-1">
                  {l.comprovante && (
                    <button
                      type="button"
                      onClick={() => verComprovante(l.comprovante as string)}
                      aria-label="Ver comprovante"
                      className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  {l.podeEditar && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditando({
                          id: l.id,
                          tipo: l.tipo,
                          data: l.data,
                          descricao: l.descricao,
                          categoria: l.categoria,
                          valor: centavosParaTexto(l.valorCentavos),
                          forma: (l.formaPagamento ?? "") as FormaPagamento | "",
                          comprovante: l.comprovante ?? "",
                        })
                      }
                      aria-label={`Editar ${l.descricao}`}
                      className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                  )}
                  {l.podeExcluir && (
                    <button
                      type="button"
                      onClick={() => excluir(l)}
                      disabled={excluindo}
                      aria-label={`Excluir ${l.descricao}`}
                      className="flex size-11 items-center justify-center rounded-lg text-danger hover:bg-danger/5"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <p className={cn("tabular font-bold", entrada ? "text-success" : "text-danger")}>
                    {entrada ? "+" : "−"}
                    {formatarMoeda(l.valorCentavos)}
                  </p>
                  <p className="tabular text-xs text-ink-muted">
                    Saldo: {l.saldoAcumuladoCentavos == null ? "—" : formatarMoeda(l.saldoAcumuladoCentavos)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {editando && (
        <FormularioLancamento key={editando.id} aberto aoFechar={() => setEditando(null)} usuarioId={usuarioId} inicial={editando} />
      )}
    </>
  );
}
