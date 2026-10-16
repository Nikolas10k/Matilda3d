import { z } from "zod";
import { formatarMoeda } from "@/lib/format";
import { calcularTotais } from "@/lib/venda";
import {
  dataIso,
  dinheiroObrigatorio,
  dinheiroOuZero,
  dinheiroPositivo,
  instagramOpcional,
  OBRIGATORIO,
  uuidOuVazio,
  whatsappOpcional,
} from "./comum";

const canal = z.enum(["whatsapp", "instagram", "presencial", "site", "outro"], { message: "Escolha o canal." });
const forma = z.enum(["pix", "dinheiro", "credito", "debito", "transferencia"], {
  message: "Escolha a forma de pagamento.",
});

const item = z.object({
  produtoId: uuidOuVazio,
  descricao: z.string().trim().min(1, OBRIGATORIO).max(200, "Use no máximo 200 caracteres."),
  cor: z.string().trim().max(30, "Use no máximo 30 caracteres."),
  quantidade: z.coerce
    .number({ message: "Digite a quantidade." })
    .int("Use um número inteiro.")
    .min(1, "A quantidade mínima é 1.")
    .max(9999, "Quantidade muito alta."),
  preco: dinheiroObrigatorio,
});

const cliente = z.discriminatedUnion("modo", [
  z.object({ modo: z.literal("avulsa") }),
  z.object({ modo: z.literal("existente"), id: z.string().uuid("Escolha um cliente.") }),
  z.object({
    modo: z.literal("novo"),
    nome: z.string().trim().min(1, OBRIGATORIO).max(120, "Use no máximo 120 caracteres."),
    whatsapp: whatsappOpcional,
    instagram: instagramOpcional,
  }),
]);

export const esquemaVenda = z
  .object({
    data: dataIso,
    cliente,
    itens: z.array(item).min(1, "Inclua pelo menos um item."),
    desconto: dinheiroOuZero,
    frete: dinheiroOuZero,
    canal,
    valorPago: dinheiroOuZero,
    forma: z.union([forma, z.literal("")]),
    observacoes: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
    encomendaId: uuidOuVazio,
  })
  .superRefine((v, ctx) => {
    const { total } = calcularTotais(
      v.itens.map((i) => ({ quantidade: i.quantidade, precoUnitarioCentavos: i.preco })),
      v.desconto,
      v.frete,
    );
    if (total < 0) {
      ctx.addIssue({ code: "custom", path: ["desconto"], message: "O desconto é maior que o valor da venda." });
    }
    if (v.valorPago > Math.max(total, 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["valorPago"],
        message: `O valor é maior do que o total da venda (${formatarMoeda(Math.max(total, 0))}).`,
      });
    }
    if (v.valorPago > 0 && v.forma === "") {
      ctx.addIssue({ code: "custom", path: ["forma"], message: "Escolha a forma de pagamento." });
    }
  });

export type ValoresVenda = z.input<typeof esquemaVenda>;
export type DadosVenda = z.output<typeof esquemaVenda>;

export const esquemaPagamento = z.object({
  vendaId: z.string().uuid(),
  valor: dinheiroPositivo,
  forma,
  data: dataIso,
});

export type ValoresPagamento = z.input<typeof esquemaPagamento>;

export const esquemaCancelamento = z.object({
  vendaId: z.string().uuid(),
  motivo: z.string().trim().min(3, "Conte em poucas palavras por que a venda foi cancelada.").max(500),
});

export const esquemaEdicaoVenda = z.object({
  vendaId: z.string().uuid(),
  clienteId: uuidOuVazio,
  observacoes: z.string().trim().max(1000, "Use no máximo 1000 caracteres."),
});
