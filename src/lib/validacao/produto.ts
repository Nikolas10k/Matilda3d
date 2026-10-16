// Validação do formulário de produto, usada no navegador (React Hook Form) e
// de novo no servidor (Server Action). Os valores chegam como texto, do jeito
// que a pessoa digitou, e saem convertidos para o formato do banco.
import { z } from "zod";
import { paraCentavos } from "@/lib/format";
import { SLUG_VALIDO } from "@/lib/slug";

export const MAX_FOTOS = 6;
const OBRIGATORIO = "Preencha este campo.";
const VALOR_INVALIDO = "Digite um valor válido, ex.: 25,90.";

/** Dinheiro opcional: vazio → null; "12,50" → 1250. */
const dinheiroOpcional = z
  .string()
  .trim()
  .refine((t) => t === "" || paraCentavos(t) !== null, VALOR_INVALIDO)
  .transform((t) => (t === "" ? null : paraCentavos(t)));

/** Número decimal opcional ("12,5" ou "12.5"): vazio → null. */
const decimalOpcional = (max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .refine((t) => {
      if (t === "") return true;
      const n = Number(t.replace(",", "."));
      return Number.isFinite(n) && n >= 0 && n <= max;
    }, mensagem)
    .transform((t) => (t === "" ? null : Number(t.replace(",", "."))));

const inteiroOpcional = (max: number, mensagem: string) =>
  z
    .string()
    .trim()
    .refine((t) => t === "" || (/^\d+$/.test(t) && Number(t) <= max), mensagem)
    .transform((t) => (t === "" ? null : Number(t)));

export const esquemaProduto = z
  .object({
    id: z.string().uuid(),
    nome: z.string().trim().min(1, OBRIGATORIO).max(120, "Use no máximo 120 caracteres."),
    slug: z
      .string()
      .trim()
      .min(1, OBRIGATORIO)
      .max(80, "Use no máximo 80 caracteres.")
      .regex(SLUG_VALIDO, "Use só letras minúsculas sem acento, números e hífens, ex.: chaveiro-com-nome."),
    categoriaId: z.string().transform((t) => (t === "" ? null : t)).pipe(z.string().uuid().nullable()),
    descricaoCurta: z.string().trim().max(140, "Use no máximo 140 caracteres."),
    descricao: z.string().trim().max(5000, "Use no máximo 5000 caracteres."),
    preco: dinheiroOpcional,
    custo: dinheiroOpcional,
    gramas: decimalOpcional(99999, "Digite os gramas, ex.: 25 ou 12,5."),
    horas: inteiroOpcional(999, "Digite só as horas inteiras, ex.: 2."),
    minutos: inteiroOpcional(59, "Use de 0 a 59 minutos."),
    cores: z
      .array(z.string().trim().min(1).max(30, "Cada cor pode ter até 30 caracteres."))
      .max(20, "Use no máximo 20 cores."),
    fotos: z.array(z.string().min(1)).max(MAX_FOTOS, `Use no máximo ${MAX_FOTOS} fotos.`),
    ativo: z.boolean(),
    destaque: z.boolean(),
  })
  .transform((v) => ({
    ...v,
    minutosImpressao:
      v.horas === null && v.minutos === null ? null : (v.horas ?? 0) * 60 + (v.minutos ?? 0),
  }));

export type ValoresFormularioProduto = z.input<typeof esquemaProduto>;
export type DadosProduto = z.output<typeof esquemaProduto>;
