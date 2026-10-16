// Regras de venda (docs/06). O banco faz as mesmas contas nas funções RPC;
// aqui servem para mostrar o total ao vivo no formulário e montar o recibo.
import { formatarData, formatarMoeda } from "@/lib/format";

export type StatusPagamento = "pendente" | "parcial" | "pago";
export type Canal = "whatsapp" | "instagram" | "presencial" | "site" | "outro";
export type FormaPagamento = "pix" | "dinheiro" | "credito" | "debito" | "transferencia";

export const CANAIS: { valor: Canal; rotulo: string }[] = [
  { valor: "whatsapp", rotulo: "WhatsApp" },
  { valor: "instagram", rotulo: "Instagram" },
  { valor: "presencial", rotulo: "Presencial" },
  { valor: "site", rotulo: "Site" },
  { valor: "outro", rotulo: "Outro" },
];

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: "pix", rotulo: "Pix" },
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "credito", rotulo: "Cartão de crédito" },
  { valor: "debito", rotulo: "Cartão de débito" },
  { valor: "transferencia", rotulo: "Transferência" },
];

export const ROTULO_STATUS: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
};

export const rotuloCanal = (c: string) => CANAIS.find((x) => x.valor === c)?.rotulo ?? c;
export const rotuloForma = (f: string | null) => FORMAS_PAGAMENTO.find((x) => x.valor === f)?.rotulo ?? "—";

export type ItemVenda = { quantidade: number; precoUnitarioCentavos: number };

/** Total = soma dos itens − desconto + frete (docs/06). */
export function calcularTotais(itens: ItemVenda[], descontoCentavos = 0, freteCentavos = 0) {
  const subtotal = itens.reduce((soma, i) => soma + i.quantidade * i.precoUnitarioCentavos, 0);
  return { subtotal, total: subtotal - descontoCentavos + freteCentavos };
}

/** Status é sempre calculado, nunca digitado (docs/06). */
export function statusPagamento(totalCentavos: number, pagoCentavos: number): StatusPagamento {
  if (pagoCentavos <= 0) return "pendente";
  if (pagoCentavos >= totalCentavos) return "pago";
  return "parcial";
}

export type DadosRecibo = {
  numero: number;
  data: string;
  cliente: string | null;
  itens: { descricao: string; cor: string | null; quantidade: number; totalCentavos: number }[];
  descontoCentavos: number;
  freteCentavos: number;
  totalCentavos: number;
  pagoCentavos: number;
};

/** Texto do recibo enviado pelo WhatsApp. Asteriscos = negrito no WhatsApp. */
export function mensagemRecibo(r: DadosRecibo): string {
  const linhas = [
    r.cliente ? `Olá, ${r.cliente.split(" ")[0]}! Aqui está o recibo da sua compra na Matilda3D:` : "Recibo da sua compra na Matilda3D:",
    "",
    `*Pedido #${r.numero}* · ${formatarData(r.data)}`,
    ...r.itens.map(
      (i) => `• ${i.quantidade}x ${i.descricao}${i.cor ? ` (${i.cor})` : ""} — ${formatarMoeda(i.totalCentavos)}`,
    ),
  ];
  if (r.descontoCentavos > 0) linhas.push(`Desconto: −${formatarMoeda(r.descontoCentavos)}`);
  if (r.freteCentavos > 0) linhas.push(`Frete: ${formatarMoeda(r.freteCentavos)}`);
  linhas.push(`*Total: ${formatarMoeda(r.totalCentavos)}*`);

  const falta = r.totalCentavos - r.pagoCentavos;
  if (falta <= 0) {
    linhas.push("Pagamento: recebido. Obrigado!");
  } else {
    linhas.push(`Pago: ${formatarMoeda(r.pagoCentavos)}`, `Falta pagar: ${formatarMoeda(falta)}`);
  }
  linhas.push("", "Obrigado pela preferência!");
  return linhas.join("\n").replace(/ /g, " ");
}

/** Link do WhatsApp com a mensagem pronta (sem número: a pessoa escolhe o contato). */
export function linkWhatsApp(mensagem: string, numero?: string | null): string {
  const destino = numero ? numero.replace(/\D/g, "") : "";
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensagem)}`;
}
