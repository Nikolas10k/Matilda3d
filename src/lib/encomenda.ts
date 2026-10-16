// Regras das encomendas (docs/06).

export type StatusEncomenda =
  | "nova"
  | "em_conversa"
  | "orcada"
  | "aprovada"
  | "em_producao"
  | "pronta"
  | "entregue"
  | "cancelada";

/** Fluxo normal, na ordem (cancelada fica fora: pode vir de qualquer status antes de entregue). */
export const FLUXO: StatusEncomenda[] = ["nova", "em_conversa", "orcada", "aprovada", "em_producao", "pronta", "entregue"];

export const STATUS_ENCOMENDA: { valor: StatusEncomenda; rotulo: string; descricao: string }[] = [
  { valor: "nova", rotulo: "Nova", descricao: "Chegou e ninguém respondeu ainda" },
  { valor: "em_conversa", rotulo: "Em conversa", descricao: "Combinando detalhes com o cliente" },
  { valor: "orcada", rotulo: "Orçada", descricao: "Valor enviado, esperando resposta" },
  { valor: "aprovada", rotulo: "Aprovada", descricao: "Cliente aprovou: pode virar venda" },
  { valor: "em_producao", rotulo: "Em produção", descricao: "Na impressora" },
  { valor: "pronta", rotulo: "Pronta", descricao: "Esperando entrega ou retirada" },
  { valor: "entregue", rotulo: "Entregue", descricao: "Finalizada" },
  { valor: "cancelada", rotulo: "Cancelada", descricao: "Não vai ser feita" },
];

export const rotuloStatusEncomenda = (s: string) => STATUS_ENCOMENDA.find((x) => x.valor === s)?.rotulo ?? s;

export function proximoStatus(atual: StatusEncomenda): StatusEncomenda | null {
  const i = FLUXO.indexOf(atual);
  return i >= 0 && i < FLUXO.length - 1 ? FLUXO[i + 1] : null;
}

/** Valida uma mudança de status. Devolve a mensagem de erro ou null se puder. */
export function erroMudancaStatus(atual: StatusEncomenda, novo: StatusEncomenda): string | null {
  if (atual === novo) return null;
  if (novo === "cancelada" && atual === "entregue") return "Uma encomenda entregue não pode ser cancelada.";
  return null;
}

/** "Transformar em venda" só aparece a partir de "aprovada" e se ainda não houver venda ativa (docs/06). */
export function podeVirarVenda(status: StatusEncomenda, temVendaAtiva: boolean): boolean {
  return !temVendaAtiva && ["aprovada", "em_producao", "pronta", "entregue"].includes(status);
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Destaques (docs/06): data desejada em até 7 dias (ou já passada) e encomenda
 * em "nova" há mais de 24 horas. Encomendas finalizadas não pedem atenção.
 */
export function motivosAtencao(
  e: { status: StatusEncomenda; data_desejada: string | null; criado_em: string },
  hoje: string,
  agora = Date.now(),
): { prazo: "atrasada" | "proxima" | null; semResposta: boolean } {
  if (e.status === "entregue" || e.status === "cancelada") return { prazo: null, semResposta: false };
  let prazo: "atrasada" | "proxima" | null = null;
  if (e.data_desejada) {
    const dias = (Date.parse(`${e.data_desejada}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / UM_DIA_MS;
    if (dias < 0) prazo = "atrasada";
    else if (dias <= 7) prazo = "proxima";
  }
  return { prazo, semResposta: e.status === "nova" && agora - new Date(e.criado_em).getTime() > UM_DIA_MS };
}
