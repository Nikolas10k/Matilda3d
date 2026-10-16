import { z } from "zod";
import { normalizarWhatsApp, paraCentavos } from "@/lib/format";

export const OBRIGATORIO = "Preencha este campo.";
export const VALOR_INVALIDO = "Digite um valor válido, ex.: 25,90.";
export const WHATSAPP_INVALIDO = "Digite um WhatsApp com DDD, ex.: (61) 99999-9999.";

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Dinheiro opcional: vazio → 0 (desconto, frete, valor recebido). */
export const dinheiroOuZero = z
  .string()
  .trim()
  .refine((t) => t === "" || paraCentavos(t) !== null, VALOR_INVALIDO)
  .transform((t) => (t === "" ? 0 : (paraCentavos(t) as number)));

/** Dinheiro obrigatório e maior que zero. */
export const dinheiroPositivo = z
  .string()
  .trim()
  .min(1, OBRIGATORIO)
  .refine((t) => {
    const c = paraCentavos(t);
    return c !== null && c > 0;
  }, VALOR_INVALIDO)
  .transform((t) => paraCentavos(t) as number);

/** Dinheiro obrigatório, zero permitido (preço de item pode ser brinde). */
export const dinheiroObrigatorio = z
  .string()
  .trim()
  .min(1, OBRIGATORIO)
  .refine((t) => paraCentavos(t) !== null, VALOR_INVALIDO)
  .transform((t) => paraCentavos(t) as number);

export const dataIso = z.string().regex(DATA_ISO, "Escolha uma data válida.");

export const whatsappOpcional = z
  .string()
  .trim()
  .refine((t) => t === "" || normalizarWhatsApp(t) !== null, WHATSAPP_INVALIDO)
  .transform((t) => (t === "" ? null : normalizarWhatsApp(t)));

export const instagramOpcional = z
  .string()
  .trim()
  .max(60, "Use no máximo 60 caracteres.")
  .transform((t) => (t === "" ? null : t.replace(/^@/, "")));

export const uuidOuVazio = z
  .string()
  .transform((t) => (t === "" ? null : t))
  .pipe(z.string().uuid().nullable());

/** Junta os erros do Zod por campo (caminho com pontos: "itens.0.preco"). */
export function errosPorCampo(erro: z.ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const i of erro.issues) campos[i.path.join(".")] ??= i.message;
  return campos;
}
