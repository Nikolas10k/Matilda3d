import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ROTULO_STATUS, type StatusPagamento } from "@/lib/venda";

/** Selo de status de pagamento (pago / parcial / pendente / cancelada). */
export function SeloStatus({ status, cancelada = false }: { status: StatusPagamento; cancelada?: boolean }) {
  if (cancelada) {
    return <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">Cancelada</span>;
  }
  const estilo: Record<StatusPagamento, string> = {
    pago: "bg-success/10 text-success",
    parcial: "bg-warning/10 text-warning",
    pendente: "bg-warning/10 text-warning",
  };
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", estilo[status])}>{ROTULO_STATUS[status]}</span>;
}

/** Cartão de número com legenda explicativa (docs/01: números sempre explicados). */
export function CartaoIndicador({
  rotulo,
  valor,
  legenda,
  tom = "neutro",
  aviso,
}: {
  rotulo: string;
  valor: string;
  legenda: string;
  tom?: "neutro" | "positivo" | "negativo" | "destaque";
  aviso?: string;
}) {
  const cores = {
    neutro: "text-ink",
    positivo: "text-success",
    negativo: "text-danger",
    destaque: "text-ink",
  };
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border bg-white p-4">
      <span className="text-sm font-bold text-ink-muted">{rotulo}</span>
      <span className={cn("text-2xl font-bold", cores[tom])}>{valor}</span>
      <span className="text-xs text-ink-muted">{legenda}</span>
      {aviso && <span className="mt-1 rounded-lg bg-warning/10 px-2 py-1 text-xs font-medium text-warning">{aviso}</span>}
    </div>
  );
}

/** Grupo de opções em botões (rádio acessível), usado para canal e forma de pagamento. */
export function SeletorOpcoes<T extends string>({
  nome,
  rotulo,
  opcoes,
  valor,
  aoMudar,
  erro,
}: {
  nome: string;
  rotulo: string;
  opcoes: { valor: T; rotulo: string }[];
  valor: T | "";
  aoMudar: (v: T) => void;
  erro?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{rotulo}</legend>
      <div className="flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label
            key={o.valor}
            className={cn(
              "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
              valor === o.valor ? "border-ink bg-ink text-white" : "border-input bg-white text-ink hover:border-ink",
            )}
          >
            <input
              type="radio"
              name={nome}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => aoMudar(o.valor)}
              className="sr-only"
            />
            {o.rotulo}
          </label>
        ))}
      </div>
      {erro && <p className="text-sm font-medium text-danger">{erro}</p>}
    </fieldset>
  );
}

export function Secao({
  titulo,
  descricao,
  acao,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-card border border-border bg-white p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{titulo}</h2>
          {descricao && <p className="text-sm text-ink-muted">{descricao}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}

/** Rótulo + campo + erro/dica, para formulários com componentes variados. */
export function CampoRotulado({
  id,
  rotulo,
  erro,
  dica,
  children,
  className,
}: {
  id: string;
  rotulo: string;
  erro?: string;
  dica?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </label>
      {children}
      {erro ? (
        <p className="text-sm font-medium text-danger" role="alert">
          {erro}
        </p>
      ) : (
        dica && <p className="text-sm text-ink-muted">{dica}</p>
      )}
    </div>
  );
}

export const classeSelect =
  "h-11 w-full rounded-lg border border-input bg-white px-3 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive";
