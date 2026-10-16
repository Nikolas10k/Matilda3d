import { z } from "zod";
import { dataIso, dinheiroObrigatorio, dinheiroOuZero, instagramOpcional, OBRIGATORIO, whatsappOpcional } from "./comum";

const percentual = (max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .min(1, OBRIGATORIO)
    .refine((t) => {
      const n = Number(t.replace(",", "."));
      return Number.isFinite(n) && n >= 0 && n <= max;
    }, mensagem)
    .transform((t) => Number(t.replace(",", ".")));

export const esquemaMarca = z.object({
  nome: z.string().trim().min(1, OBRIGATORIO).max(60, "Use no máximo 60 caracteres."),
  whatsapp: whatsappOpcional,
  instagram: instagramOpcional,
  textoSobre: z.string().trim().max(2000, "Use no máximo 2000 caracteres."),
  fotoCriadores: z.string().max(300),
});

export const esquemaConfigCaixa = z.object({
  saldoInicial: dinheiroOuZero,
  dataInicio: dataIso,
});

export const esquemaPadroesCalculadora = z.object({
  precoKg: dinheiroObrigatorio,
  energiaHora: dinheiroOuZero,
  desgasteHora: dinheiroOuZero,
  embalagem: dinheiroOuZero,
  taxaFalhas: percentual(100, "Use um número de 0 a 100."),
  margem: percentual(1000, "Use um número de 0 a 1000."),
});

export const esquemaNomeCategoria = z.string().trim().min(1, OBRIGATORIO).max(40, "Use no máximo 40 caracteres.");

export const esquemaConvite = z.object({
  email: z.string().trim().toLowerCase().min(1, OBRIGATORIO).email("Digite um e-mail válido, ex.: nome@gmail.com."),
  nome: z.string().trim().min(1, OBRIGATORIO).max(80, "Use no máximo 80 caracteres."),
  papel: z.enum(["admin", "membro"]),
});
