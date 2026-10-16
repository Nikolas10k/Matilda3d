"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Copy, MessageCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { CampoRotulado, SeletorOpcoes } from "@/components/painel/elementos";
import { SeletorCliente, type ValorCliente } from "@/components/painel/vendas/seletor-cliente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { centavosParaTexto, dataIsoSaoPaulo, formatarMoeda } from "@/lib/format";
import { FORMAS_PAGAMENTO, type FormaPagamento } from "@/lib/venda";
import { atualizarVenda, cancelarVenda, registrarPagamento } from "@/server/actions/vendas";

type Props = {
  vendaId: string;
  numero: number;
  abertoCentavos: number;
  cancelada: boolean;
  linkRecibo: string;
};

export function AcoesVenda({ vendaId, numero, abertoCentavos, cancelada, linkRecibo }: Props) {
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [cancelarAberto, setCancelarAberto] = useState<false | "cancelar" | "duplicar">(false);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {!cancelada && abertoCentavos > 0 && (
        <Button type="button" size="lg" onClick={() => setPagamentoAberto(true)}>
          <Wallet aria-hidden="true" />
          Registrar pagamento
        </Button>
      )}
      <Button asChild variant="whatsapp" size="lg">
        <a href={linkRecibo} target="_blank" rel="noreferrer">
          <MessageCircle aria-hidden="true" />
          Enviar recibo pelo WhatsApp
        </a>
      </Button>
      {!cancelada && (
        <>
          <Button type="button" variant="outline" size="lg" onClick={() => setCancelarAberto("duplicar")}>
            <Copy aria-hidden="true" />
            Cancelar e duplicar
          </Button>
          <Button type="button" variant="destructive" size="lg" onClick={() => setCancelarAberto("cancelar")}>
            <Ban aria-hidden="true" />
            Cancelar venda
          </Button>
        </>
      )}

      <FormularioPagamento
        key={abertoCentavos} // recomeça com o valor que falta, depois de cada pagamento
        aberto={pagamentoAberto}
        aoFechar={() => setPagamentoAberto(false)}
        vendaId={vendaId}
        abertoCentavos={abertoCentavos}
      />
      <FormularioCancelamento
        modo={cancelarAberto}
        aoFechar={() => setCancelarAberto(false)}
        vendaId={vendaId}
        numero={numero}
      />
    </div>
  );
}

function FormularioPagamento({
  aberto,
  aoFechar,
  vendaId,
  abertoCentavos,
}: {
  aberto: boolean;
  aoFechar: () => void;
  vendaId: string;
  abertoCentavos: number;
}) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [valor, setValor] = useState(centavosParaTexto(abertoCentavos));
  const [forma, setForma] = useState<FormaPagamento | "">("");
  const [data, setData] = useState(dataIsoSaoPaulo());
  const [erros, setErros] = useState<Record<string, string>>({});

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!forma) {
      setErros({ forma: "Escolha a forma de pagamento." });
      return;
    }
    iniciar(async () => {
      const r = await registrarPagamento({ vendaId, valor, forma, data });
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      toast.success("Pagamento registrado e lançado no caixa!");
      aoFechar();
      router.refresh();
    });
  }

  return (
    <Sheet open={aberto} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent side="bottom" className="rounded-t-3xl md:mx-auto md:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">Registrar pagamento</SheetTitle>
          <SheetDescription>Falta pagar {formatarMoeda(abertoCentavos)}. O valor entra no caixa automaticamente.</SheetDescription>
        </SheetHeader>
        <form onSubmit={salvar} noValidate className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="grid grid-cols-2 gap-3">
            <CampoRotulado id="pag-valor" rotulo="Valor" erro={erros.valor}>
              <InputMoeda id="pag-valor" value={valor} onValueChange={setValor} aria-invalid={erros.valor ? true : undefined} />
            </CampoRotulado>
            <CampoRotulado id="pag-data" rotulo="Data" erro={erros.data}>
              <Input id="pag-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </CampoRotulado>
          </div>
          <SeletorOpcoes nome="pag-forma" rotulo="Forma de pagamento" opcoes={FORMAS_PAGAMENTO} valor={forma} aoMudar={setForma} erro={erros.forma} />
          <Button type="submit" size="lg" disabled={salvando}>
            {salvando ? "Salvando…" : "Confirmar pagamento"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormularioCancelamento({
  modo,
  aoFechar,
  vendaId,
  numero,
}: {
  modo: false | "cancelar" | "duplicar";
  aoFechar: () => void;
  vendaId: string;
  numero: number;
}) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string>();

  function confirmar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await cancelarVenda({ vendaId, motivo });
      if (!r.ok) {
        setErro(r.campos?.motivo);
        toast.error(r.erro);
        return;
      }
      toast.success("Venda cancelada. Os pagamentos foram estornados no caixa.");
      aoFechar();
      if (modo === "duplicar") router.push(`/admin/vendas/nova?duplicar=${vendaId}`);
      else router.refresh();
    });
  }

  return (
    <Sheet open={Boolean(modo)} onOpenChange={(a) => !a && aoFechar()}>
      <SheetContent side="bottom" className="rounded-t-3xl md:mx-auto md:max-w-xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg font-bold">
            {modo === "duplicar" ? `Cancelar e duplicar a venda #${numero}` : `Cancelar a venda #${numero}`}
          </SheetTitle>
          <SheetDescription>
            A venda não é apagada: ela fica marcada como cancelada e todo valor já recebido sai do caixa como estorno.
            {modo === "duplicar" && " Depois abre uma nova venda com os mesmos itens para você corrigir."}
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={confirmar} noValidate className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <CampoRotulado id="motivo" rotulo="Motivo do cancelamento" erro={erro}>
            <Textarea
              id="motivo"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={modo === "duplicar" ? "Ex.: quantidade errada" : "Ex.: cliente desistiu"}
              aria-invalid={erro ? true : undefined}
            />
          </CampoRotulado>
          <Button type="submit" size="lg" variant={modo === "duplicar" ? "default" : "destructive"} disabled={salvando}>
            {salvando ? "Cancelando…" : modo === "duplicar" ? "Cancelar e abrir cópia" : "Confirmar cancelamento"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** Depois de salva, a venda só muda observações e cliente (docs/06). */
export function EdicaoVenda({
  vendaId,
  cliente,
  observacoes,
}: {
  vendaId: string;
  cliente: { id: string; nome: string; whatsapp: string | null } | null;
  observacoes: string;
}) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const [valorCliente, setValorCliente] = useState<ValorCliente>(
    cliente ? { modo: "existente", id: cliente.id, nome: cliente.nome, whatsapp: cliente.whatsapp } : { modo: "avulsa" },
  );
  const [texto, setTexto] = useState(observacoes);

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (valorCliente.modo === "existente" && !valorCliente.id) {
      toast.error("Escolha um cliente ou marque como venda avulsa.");
      return;
    }
    iniciar(async () => {
      const r = await atualizarVenda({
        vendaId,
        clienteId: valorCliente.modo === "existente" ? valorCliente.id : "",
        observacoes: texto,
      });
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success("Alterações salvas!");
      router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      <SeletorCliente valor={valorCliente} aoMudar={setValorCliente} permitirNovo={false} />
      <CampoRotulado id="obs" rotulo="Observações">
        <Textarea id="obs" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </CampoRotulado>
      <Button type="submit" variant="outline" disabled={salvando} className="self-start">
        {salvando ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
