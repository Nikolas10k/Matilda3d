// Formulário público de encomenda (docs/03). Validado no navegador e de novo no servidor.
import { z } from "zod";
import { dataIsoSaoPaulo, normalizarWhatsApp } from "@/lib/format";
import { OBRIGATORIO, WHATSAPP_INVALIDO } from "./comum";

export const TIPOS_PECA = ["Chaveiro", "Decoração", "Presente", "Topo de bolo", "Lembrancinhas", "Outro"] as const;

export const IMAGEM_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGEM_TIPOS = ["image/jpeg", "image/png", "image/webp"];

export function criarEsquemaEncomenda(hoje = dataIsoSaoPaulo()) {
  return z.object({
    nome: z.string().trim().min(1, OBRIGATORIO).max(120, "Use no máximo 120 caracteres."),
    whatsapp: z
      .string()
      .trim()
      .min(1, OBRIGATORIO)
      .refine((t) => normalizarWhatsApp(t) !== null, WHATSAPP_INVALIDO)
      .transform((t) => normalizarWhatsApp(t) as string),
    tipo: z.enum(TIPOS_PECA, { message: "Escolha o tipo de peça." }),
    quantidade: z.coerce
      .number({ message: "Digite a quantidade." })
      .int("Use um número inteiro.")
      .min(1, "A quantidade mínima é 1.")
      .max(1000, "Para mais de 1000 peças, fale direto com a gente no WhatsApp."),
    descricao: z.string().trim().min(1, OBRIGATORIO).max(1000, "Use no máximo 1000 caracteres."),
    cores: z.string().trim().max(200, "Use no máximo 200 caracteres."),
    dataDesejada: z
      .string()
      .refine((t) => t === "" || /^\d{4}-\d{2}-\d{2}$/.test(t), "Escolha uma data válida.")
      .refine((t) => t === "" || t >= hoje, "Escolha uma data a partir de hoje.")
      .transform((t) => (t === "" ? null : t)),
    consentimento: z.literal(true, { message: "Marque esta opção para a gente poder te responder pelo WhatsApp." }),
  });
}

export type ValoresEncomendaSite = z.input<ReturnType<typeof criarEsquemaEncomenda>>;

/** Confere a imagem de referência (opcional): tipo e tamanho. Devolve a mensagem de erro ou null. */
export function erroImagem(arquivo: { type: string; size: number } | null | undefined): string | null {
  if (!arquivo || arquivo.size === 0) return null;
  if (!IMAGEM_TIPOS.includes(arquivo.type)) return "Envie uma imagem JPG, PNG ou WEBP.";
  if (arquivo.size > IMAGEM_MAX_BYTES) return "A imagem pode ter no máximo 5 MB.";
  return null;
}
