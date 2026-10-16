import { AlertTriangle, CalendarClock, Clock } from "lucide-react";
import { motivosAtencao, rotuloStatusEncomenda, type StatusEncomenda } from "@/lib/encomenda";
import { formatarData } from "@/lib/format";
import { cn } from "@/lib/utils";

const COR_STATUS: Record<StatusEncomenda, string> = {
  nova: "bg-brand-soft text-brand-strong",
  em_conversa: "bg-surface-alt text-ink",
  orcada: "bg-surface-alt text-ink",
  aprovada: "bg-success/10 text-success",
  em_producao: "bg-warning/10 text-warning",
  pronta: "bg-success/10 text-success",
  entregue: "bg-surface-alt text-ink-muted",
  cancelada: "bg-danger/10 text-danger",
};

export function SeloStatusEncomenda({ status }: { status: StatusEncomenda }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", COR_STATUS[status])}>{rotuloStatusEncomenda(status)}</span>;
}

/** Destaques do docs/06: prazo em até 7 dias (ou atrasado) e "nova" há mais de 24 h. Sempre com ícone + texto. */
export function SelosAtencao({
  status,
  dataDesejada,
  criadoEm,
  hoje,
}: {
  status: StatusEncomenda;
  dataDesejada: string | null;
  criadoEm: string;
  hoje: string;
}) {
  const { prazo, semResposta } = motivosAtencao({ status, data_desejada: dataDesejada, criado_em: criadoEm }, hoje);
  return (
    <span className="flex flex-wrap gap-1.5">
      {prazo === "atrasada" && dataDesejada && (
        <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-bold text-danger">
          <AlertTriangle className="size-3" aria-hidden="true" />
          Data passou ({formatarData(dataDesejada)})
        </span>
      )}
      {prazo === "proxima" && dataDesejada && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
          <CalendarClock className="size-3" aria-hidden="true" />
          Para {formatarData(dataDesejada)}
        </span>
      )}
      {semResposta && (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
          <Clock className="size-3" aria-hidden="true" />
          Sem resposta há mais de 24 h
        </span>
      )}
    </span>
  );
}
