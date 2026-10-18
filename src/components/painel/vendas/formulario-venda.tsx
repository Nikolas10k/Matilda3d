"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Minus, PackagePlus, Plus, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { CampoRotulado, classeSelect, SeletorOpcoes, SeloStatus, Secao } from "@/components/painel/elementos";
import { SeletorCliente, type ValorCliente } from "@/components/painel/vendas/seletor-cliente";
import { SeletorProduto, type ProdutoParaVenda } from "@/components/painel/vendas/seletor-produto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { centavosParaTexto, formatarMoeda, paraCentavos } from "@/lib/format";
import { errosPorCampo } from "@/lib/validacao/comum";
import { esquemaVenda } from "@/lib/validacao/venda";
import { calcularTotais, CANAIS, FORMAS_PAGAMENTO, statusPagamento, type Canal, type FormaPagamento } from "@/lib/venda";
import { registrarVenda } from "@/server/actions/vendas";

export type ItemFormulario = {
  produtoId: string;
  descricao: string;
  cor: string;
  quantidade: number;
  preco: string;
};

export type ValoresFormularioVenda = {
  data: string;
  cliente: ValorCliente;
  itens: ItemFormulario[];
  desconto: string;
  frete: string;
  canal: Canal | "";
  valorPago: string;
  forma: FormaPagamento | "";
  observacoes: string;
  encomendaId: string;
};

type EncomendaParaVincular = { id: string; numero: number; nome_contato: string; tipo: string };

type Props = {
  valoresIniciais: ValoresFormularioVenda;
  produtos: ProdutoParaVenda[];
  encomendas: EncomendaParaVincular[];
  aviso?: string;
};

export function FormularioVenda({ valoresIniciais, produtos, encomendas, aviso }: Props) {
  const router = useRouter();
  const [salvando, iniciarSalvar] = useTransition();
  const [seletorAberto, setSeletorAberto] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  const { control, register, getValues, setValue } = useForm<ValoresFormularioVenda>({ defaultValues: valoresIniciais });
  const { fields, append, remove, update } = useFieldArray({ control, name: "itens" });
  const [itens, desconto, frete, valorPago] = useWatch({ control, name: ["itens", "desconto", "frete", "valorPago"] });

  const coresPorProduto = new Map(produtos.map((p) => [p.id, p.cores]));
  const { total } = calcularTotais(
    (itens ?? []).map((i) => ({ quantidade: Number(i.quantidade) || 0, precoUnitarioCentavos: paraCentavos(i.preco ?? "") ?? 0 })),
    paraCentavos(desconto ?? "") ?? 0,
    paraCentavos(frete ?? "") ?? 0,
  );
  const pagoAgora = paraCentavos(valorPago ?? "") ?? 0;
  const status = statusPagamento(total, pagoAgora);

  function adicionarProduto(p: ProdutoParaVenda) {
    append({
      produtoId: p.id,
      descricao: p.nome,
      cor: p.cores.length === 1 ? p.cores[0] : "",
      quantidade: 1,
      preco: centavosParaTexto(p.preco_centavos),
    });
    setSeletorAberto(false);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const valores = getValues();
    const r = esquemaVenda.safeParse(valores);
    if (!r.success) {
      setErros(errosPorCampo(r.error));
      toast.error("Confira os campos destacados.");
      return;
    }
    setErros({});
    iniciarSalvar(async () => {
      const resultado = await registrarVenda(valores);
      if (!resultado.ok) {
        setErros(resultado.campos ?? {});
        toast.error(resultado.erro);
        return;
      }
      toast.success("Venda registrada!");
      router.push(`/admin/vendas/${resultado.id}`);
    });
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6 pb-28">
      {aviso && <p className="rounded-xl bg-surface-strong px-4 py-3 text-sm font-medium text-ink">{aviso}</p>}

      <Secao titulo="Cliente">
        <Controller
          control={control}
          name="cliente"
          render={({ field }) => (
            <SeletorCliente
              valor={field.value}
              aoMudar={field.onChange}
              erros={{
                id: erros["cliente.id"],
                nome: erros["cliente.nome"],
                whatsapp: erros["cliente.whatsapp"],
                instagram: erros["cliente.instagram"],
              }}
            />
          )}
        />
        <CampoRotulado id="data" rotulo="Data da venda" erro={erros.data} className="sm:max-w-56">
          <Input id="data" type="date" {...register("data")} aria-invalid={erros.data ? true : undefined} />
        </CampoRotulado>
      </Secao>

      <Secao titulo="Itens">
        {fields.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-ink-muted">
            Adicione um produto do catálogo ou um item livre.
          </p>
        )}
        {erros.itens && <p className="text-sm font-medium text-danger">{erros.itens}</p>}
        <ul className="flex flex-col gap-3">
          {fields.map((campo, i) => {
            const cores = campo.produtoId ? (coresPorProduto.get(campo.produtoId) ?? []) : [];
            const quantidade = Number(itens?.[i]?.quantidade) || 0;
            const precoItem = paraCentavos(itens?.[i]?.preco ?? "") ?? 0;
            return (
              <li key={campo.id} className="flex flex-col gap-3 rounded-xl border border-border p-3">
                <div className="flex items-start gap-2">
                  <CampoRotulado id={`itens.${i}.descricao`} rotulo={campo.produtoId ? "Produto" : "Item livre"} erro={erros[`itens.${i}.descricao`]} className="flex-1">
                    <Input
                      id={`itens.${i}.descricao`}
                      {...register(`itens.${i}.descricao`)}
                      readOnly={Boolean(campo.produtoId)}
                      className={campo.produtoId ? "bg-surface font-bold" : undefined}
                      placeholder="Ex.: Chaveiro personalizado"
                    />
                  </CampoRotulado>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remover ${itens?.[i]?.descricao || "item"}`}
                    className="mt-7 flex size-11 shrink-0 items-center justify-center rounded-lg text-danger hover:bg-danger/5"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr]">
                  <CampoRotulado id={`itens.${i}.cor`} rotulo="Cor (opcional)" erro={erros[`itens.${i}.cor`]} className="col-span-2 sm:col-span-1">
                    {cores.length > 0 ? (
                      <select id={`itens.${i}.cor`} {...register(`itens.${i}.cor`)} className={classeSelect}>
                        <option value="">Sem cor definida</option>
                        {cores.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    ) : (
                      <Input id={`itens.${i}.cor`} {...register(`itens.${i}.cor`)} placeholder="Ex.: Rosa" />
                    )}
                  </CampoRotulado>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-bold" id={`itens.${i}.qtd-rotulo`}>
                      Quantidade
                    </span>
                    <div className="flex items-center" role="group" aria-labelledby={`itens.${i}.qtd-rotulo`}>
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        disabled={quantidade <= 1}
                        onClick={() => update(i, { ...getValues(`itens.${i}`), quantidade: Math.max(1, quantidade - 1) })}
                        className="flex size-11 items-center justify-center rounded-l-lg border border-input bg-white disabled:opacity-40"
                      >
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <Input
                        aria-label="Quantidade"
                        inputMode="numeric"
                        className="tabular w-14 rounded-none border-x-0 text-center"
                        {...register(`itens.${i}.quantidade`, { setValueAs: (v) => Number(String(v).replace(/\D/g, "")) || 0 })}
                      />
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        onClick={() => update(i, { ...getValues(`itens.${i}`), quantidade: quantidade + 1 })}
                        className="flex size-11 items-center justify-center rounded-r-lg border border-input bg-white"
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    {erros[`itens.${i}.quantidade`] && (
                      <p className="text-sm font-medium text-danger">{erros[`itens.${i}.quantidade`]}</p>
                    )}
                  </div>
                  <CampoRotulado id={`itens.${i}.preco`} rotulo="Preço unitário" erro={erros[`itens.${i}.preco`]}>
                    <Controller
                      control={control}
                      name={`itens.${i}.preco`}
                      render={({ field }) => (
                        <InputMoeda id={`itens.${i}.preco`} value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />
                      )}
                    />
                  </CampoRotulado>
                </div>
                <p className="tabular text-right text-sm text-ink-muted">
                  Subtotal do item: <span className="font-bold text-ink">{formatarMoeda(quantidade * precoItem)}</span>
                </p>
              </li>
            );
          })}
        </ul>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={() => setSeletorAberto(true)} disabled={produtos.length === 0}>
            <PackagePlus aria-hidden="true" />
            Produto
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ produtoId: "", descricao: "", cor: "", quantidade: 1, preco: "" })}
          >
            <SquarePen aria-hidden="true" />
            Item livre
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <CampoRotulado id="desconto" rotulo="Desconto" erro={erros.desconto}>
            <Controller
              control={control}
              name="desconto"
              render={({ field }) => <InputMoeda id="desconto" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />}
            />
          </CampoRotulado>
          <CampoRotulado id="frete" rotulo="Frete cobrado" erro={erros.frete}>
            <Controller
              control={control}
              name="frete"
              render={({ field }) => <InputMoeda id="frete" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />}
            />
          </CampoRotulado>
        </div>
      </Secao>

      <Secao titulo="Canal e pagamento">
        <Controller
          control={control}
          name="canal"
          render={({ field }) => (
            <SeletorOpcoes nome="canal" rotulo="Onde a venda aconteceu" opcoes={CANAIS} valor={field.value} aoMudar={field.onChange} erro={erros.canal} />
          )}
        />
        <Controller
          control={control}
          name="forma"
          render={({ field }) => (
            <SeletorOpcoes
              nome="forma"
              rotulo="Forma de pagamento"
              opcoes={FORMAS_PAGAMENTO}
              valor={field.value}
              aoMudar={field.onChange}
              erro={erros.forma}
            />
          )}
        />
        <div className="flex flex-wrap items-end gap-3">
          <CampoRotulado id="valorPago" rotulo="Valor recebido agora" erro={erros.valorPago} dica="Deixe vazio se ainda não recebeu." className="min-w-48 flex-1">
            <Controller
              control={control}
              name="valorPago"
              render={({ field }) => <InputMoeda id="valorPago" value={field.value} onValueChange={field.onChange} onBlur={field.onBlur} />}
            />
          </CampoRotulado>
          <Button type="button" variant="outline" className="mb-7" onClick={() => setValue("valorPago", centavosParaTexto(Math.max(total, 0)))} disabled={total <= 0}>
            Recebi tudo
          </Button>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <span className="font-bold">Situação do pagamento:</span>
          <SeloStatus status={status} />
        </p>
      </Secao>

      <Secao titulo="Mais detalhes">
        {encomendas.length > 0 && (
          <CampoRotulado id="encomendaId" rotulo="Vincular a uma encomenda (opcional)" erro={erros.encomendaId}>
            <select id="encomendaId" {...register("encomendaId")} className={classeSelect}>
              <option value="">Nenhuma</option>
              {encomendas.map((e) => (
                <option key={e.id} value={e.id}>
                  #{e.numero} · {e.nome_contato} · {e.tipo}
                </option>
              ))}
            </select>
          </CampoRotulado>
        )}
        <CampoRotulado id="observacoes" rotulo="Observações" erro={erros.observacoes}>
          <Textarea id="observacoes" rows={3} {...register("observacoes")} placeholder="Ex.: entregar no sábado" />
        </CampoRotulado>
      </Secao>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-white/95 px-4 py-3 backdrop-blur md:bottom-0 md:left-64 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="leading-tight">
            <span className="block text-xs font-bold text-ink-muted">Total da venda</span>
            <span className={total < 0 ? "tabular text-2xl font-bold text-danger" : "tabular text-2xl font-bold"} aria-live="polite">
              {formatarMoeda(total)}
            </span>
          </div>
          <Button type="submit" size="lg" disabled={salvando || fields.length === 0}>
            {salvando ? "Salvando…" : "Salvar venda"}
          </Button>
        </div>
      </div>

      <SeletorProduto aberto={seletorAberto} aoFechar={() => setSeletorAberto(false)} produtos={produtos} aoEscolher={adicionarProduto} />
    </form>
  );
}
