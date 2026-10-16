"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { CampoRotulado, classeSelect } from "@/components/painel/elementos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { proximoStatus, rotuloStatusEncomenda, STATUS_ENCOMENDA, type StatusEncomenda } from "@/lib/encomenda";
import type { ValoresEdicaoEncomenda } from "@/lib/validacao/encomenda";
import { atualizarEncomenda, mudarStatusEncomenda } from "@/server/actions/encomendas";

/** Botão do cartão no quadro: leva a encomenda para o próximo status do fluxo. */
export function BotaoAvancar({ id, status }: { id: string; status: StatusEncomenda }) {
  const router = useRouter();
  const [salvando, iniciar] = useTransition();
  const proximo = proximoStatus(status);
  if (!proximo) return null;

  return (
    <button
      type="button"
      disabled={salvando}
      onClick={() =>
        iniciar(async () => {
          const r = await mudarStatusEncomenda(id, proximo);
          if (!r.ok) {
            toast.error(r.erro);
            return;
          }
          toast.success(`Encomenda movida para "${rotuloStatusEncomenda(proximo)}".`);
          router.refresh();
        })
      }
      className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-bold text-brand-strong hover:bg-brand-soft disabled:opacity-50"
    >
      {salvando ? "Movendo…" : rotuloStatusEncomenda(proximo)}
      <ArrowRight className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Gestão da encomenda: status, valor orçado, previsão de entrega e notas internas. */
export function FormularioEncomenda({ inicial }: { inicial: ValoresEdicaoEncomenda }) {
  const router = useRouter();
  const [v, setV] = useState(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, iniciar] = useTransition();

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    iniciar(async () => {
      const r = await atualizarEncomenda(v);
      if (!r.ok) {
        setErros(r.campos ?? {});
        toast.error(r.erro);
        return;
      }
      setErros({});
      toast.success("Encomenda atualizada!");
      router.refresh();
    });
  }

  return (
    <form onSubmit={salvar} noValidate className="flex flex-col gap-4">
      <CampoRotulado id="enc-status" rotulo="Status" erro={erros.status}>
        <select
          id="enc-status"
          value={v.status}
          onChange={(e) => setV({ ...v, status: e.target.value as StatusEncomenda })}
          className={classeSelect}
        >
          {STATUS_ENCOMENDA.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo} — {s.descricao}
            </option>
          ))}
        </select>
      </CampoRotulado>
      <div className="grid grid-cols-2 gap-3">
        <CampoRotulado id="enc-valor" rotulo="Valor orçado (total)" erro={erros.valorOrcado}>
          <InputMoeda id="enc-valor" value={v.valorOrcado} onValueChange={(t) => setV({ ...v, valorOrcado: t })} />
        </CampoRotulado>
        <CampoRotulado id="enc-previsao" rotulo="Previsão de entrega" erro={erros.previsaoEntrega}>
          <Input id="enc-previsao" type="date" value={v.previsaoEntrega} onChange={(e) => setV({ ...v, previsaoEntrega: e.target.value })} />
        </CampoRotulado>
      </div>
      <CampoRotulado id="enc-notas" rotulo="Notas internas" erro={erros.notasInternas} dica="Só a equipe vê. Ex.: cliente prefere retirar no sábado.">
        <Textarea id="enc-notas" rows={4} value={v.notasInternas} onChange={(e) => setV({ ...v, notasInternas: e.target.value })} />
      </CampoRotulado>
      <Button type="submit" disabled={salvando} className="self-start">
        {salvando ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  );
}
