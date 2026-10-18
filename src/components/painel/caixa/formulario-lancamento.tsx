"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FileCheck2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { CampoRotulado, classeSelect, SeletorOpcoes } from "@/components/painel/elementos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { converterParaWebp } from "@/lib/imagem";
import { BUCKET_COMPROVANTES } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_ENTRADA, CATEGORIAS_SAIDA, type ValoresLancamento } from "@/lib/validacao/caixa";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/venda";
import { salvarLancamento } from "@/server/actions/caixa";

type Props = {
  aberto: boolean;
  aoFechar: () => void;
  usuarioId: string;
  inicial: ValoresLancamento;
};

const TAMANHO_MAX_PDF = 10 * 1024 * 1024;

/** Nova despesa, nova entrada avulsa ou edição de um lançamento manual. */
export function FormularioLancamento({ aberto, aoFechar, usuarioId, inicial }: Props) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [v, setV] = useState<ValoresLancamento>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const saida = v.tipo === "saida";
  const editando = Boolean(inicial.id);
  const categorias = saida ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA;
  const mudar = <K extends keyof ValoresLancamento>(campo: K, valor: ValoresLancamento[K]) =>
    setV((atual) => ({ ...atual, [campo]: valor }));

  async function enviarComprovante(arquivo: File | undefined) {
    if (!arquivo) return;
    const ehPdf = arquivo.type === "application/pdf";
    if (!ehPdf && !arquivo.type.startsWith("image/")) {
      toast.error("Envie uma foto ou um PDF.");
      return;
    }
    if (ehPdf && arquivo.size > TAMANHO_MAX_PDF) {
      toast.error("O PDF passa de 10 MB.");
      return;
    }
    setEnviandoArquivo(true);
    try {
      const conteudo = ehPdf ? arquivo : await converterParaWebp(arquivo, 0.8);
      const caminho = `${usuarioId}/${crypto.randomUUID()}.${ehPdf ? "pdf" : "webp"}`;
      const { error } = await createClient()
        .storage.from(BUCKET_COMPROVANTES)
        .upload(caminho, conteudo, { contentType: ehPdf ? "application/pdf" : "image/webp" });
      if (error) throw error;
      mudar("comprovante", caminho);
    } catch {
      toast.error("Não foi possível enviar o comprovante. Tente de novo.");
    } finally {
      setEnviandoArquivo(false);
      if (inputArquivo.current) inputArquivo.current.value = "";
    }
  }

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await salvarLancamento(v);
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      toast.success(editando ? "Lançamento atualizado!" : saida ? "Despesa lançada!" : "Entrada lançada!");
      aoFechar();
      router.refresh();
    });
  }

  return (
    <Sheet open={aberto} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">
            {editando ? "Editar lançamento" : saida ? "Nova despesa" : "Nova entrada avulsa"}
          </SheetTitle>
          <SheetDescription>
            {saida
              ? "Tudo o que foi gasto: filamento, energia, embalagem, divulgação..."
              : "Dinheiro que entrou sem ser venda: aporte, reembolso..."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={salvar} noValidate className="flex flex-col gap-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <CampoRotulado id="lanc-valor" rotulo="Valor" erro={erros.valor}>
              <InputMoeda id="lanc-valor" value={v.valor} onValueChange={(t) => mudar("valor", t)} aria-invalid={erros.valor ? true : undefined} />
            </CampoRotulado>
            <CampoRotulado id="lanc-data" rotulo="Data" erro={erros.data}>
              <Input id="lanc-data" type="date" value={v.data} onChange={(e) => mudar("data", e.target.value)} />
            </CampoRotulado>
          </div>
          <CampoRotulado id="lanc-descricao" rotulo="Descrição" erro={erros.descricao}>
            <Input
              id="lanc-descricao"
              value={v.descricao}
              onChange={(e) => mudar("descricao", e.target.value)}
              placeholder={saida ? "Ex.: Filamento PLA rosa 1 kg" : "Ex.: Aporte da mãe para comprar filamento"}
              aria-invalid={erros.descricao ? true : undefined}
            />
          </CampoRotulado>
          <CampoRotulado id="lanc-categoria" rotulo="Categoria" erro={erros.categoria}>
            <select
              id="lanc-categoria"
              value={v.categoria}
              onChange={(e) => mudar("categoria", e.target.value)}
              className={classeSelect}
              aria-invalid={erros.categoria ? true : undefined}
            >
              <option value="">Escolha…</option>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </CampoRotulado>
          <SeletorOpcoes<FormaPagamento>
            nome="lanc-forma"
            rotulo="Forma de pagamento (opcional)"
            opcoes={FORMAS_PAGAMENTO}
            valor={v.forma}
            aoMudar={(f) => mudar("forma", f)}
          />

          {saida && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold">Comprovante (opcional)</span>
              {v.comprovante ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 font-medium text-success">
                    <FileCheck2 className="size-4" aria-hidden="true" />
                    Comprovante anexado
                  </span>
                  <button
                    type="button"
                    onClick={() => mudar("comprovante", "")}
                    aria-label="Remover comprovante"
                    className="flex size-11 items-center justify-center rounded-lg hover:bg-success/10"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input text-sm font-bold text-ink-muted hover:border-ink hover:text-ink-soft focus-within:border-ring">
                  <Paperclip className="size-4" aria-hidden="true" />
                  {enviandoArquivo ? "Enviando…" : "Anexar foto ou PDF"}
                  <input
                    ref={inputArquivo}
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    disabled={enviandoArquivo}
                    onChange={(e) => enviarComprovante(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          )}

          <Button type="submit" size="lg" disabled={salvando || enviandoArquivo}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
