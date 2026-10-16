import { z } from "zod";
import { paraCentavos } from "@/lib/format";
import { instagramOpcional, OBRIGATORIO, VALOR_INVALIDO, whatsappOpcional } from "./comum";

const STATUS = ["nova", "em_conversa", "orcada", "aprovada", "em_producao", "pronta", "entregue", "cancelada"] as const;

export const esquemaEdicaoEncomenda = z.object({
  id: z.string().uuid(),
  status: z.enum(STATUS, { message: "Escolha o status." }),
  valorOrcado: z
    .string()
    .trim()
    .refine((t) => t === "" || paraCentavos(t) !== null, VALOR_INVALIDO)
    .transform((t) => (t === "" ? null : paraCentavos(t))),
  previsaoEntrega: z
    .string()
    .refine((t) => t === "" || /^\d{4}-\d{2}-\d{2}$/.test(t), "Escolha uma data válida.")
    .transform((t) => (t === "" ? null : t)),
  notasInternas: z.string().trim().max(2000, "Use no máximo 2000 caracteres."),
});

export type ValoresEdicaoEncomenda = z.input<typeof esquemaEdicaoEncomenda>;

export const esquemaCliente = z.object({
  id: z.string().uuid().optional(),
  nome: z.string().trim().min(1, OBRIGATORIO).max(120, "Use no máximo 120 caracteres."),
  whatsapp: whatsappOpcional,
  instagram: instagramOpcional,
});

export type ValoresCliente = z.input<typeof esquemaCliente>;
