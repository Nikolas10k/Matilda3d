import { z } from "zod";
import { dataIso, dinheiroPositivo, OBRIGATORIO } from "./comum";

// Categorias do caixa (docs/06). As automáticas ("Venda" e "Estorno de venda")
// só são criadas pelas funções do banco e não aparecem nos formulários.
export const CATEGORIAS_SAIDA = [
  "Filamento",
  "Energia",
  "Manutenção da impressora",
  "Peças e ferramentas",
  "Embalagem",
  "Divulgação",
  "Frete/entrega",
  "Taxas",
  "Outros",
] as const;

export const CATEGORIAS_ENTRADA = ["Aporte", "Reembolso", "Outros"] as const;

export const CATEGORIAS_AUTOMATICAS = ["Venda", "Estorno de venda"] as const;

export const esquemaLancamento = z
  .object({
    id: z.string().uuid().optional(),
    tipo: z.enum(["entrada", "saida"]),
    data: dataIso,
    descricao: z.string().trim().min(1, OBRIGATORIO).max(200, "Use no máximo 200 caracteres."),
    categoria: z.string().min(1, "Escolha a categoria."),
    valor: dinheiroPositivo,
    forma: z.union([z.enum(["pix", "dinheiro", "credito", "debito", "transferencia"]), z.literal("")]),
    comprovante: z.string().max(300),
  })
  .superRefine((v, ctx) => {
    const validas: readonly string[] = v.tipo === "saida" ? CATEGORIAS_SAIDA : CATEGORIAS_ENTRADA;
    if (!validas.includes(v.categoria)) {
      ctx.addIssue({ code: "custom", path: ["categoria"], message: "Escolha uma categoria da lista." });
    }
  });

export type ValoresLancamento = z.input<typeof esquemaLancamento>;
