// Mensagens prontas do site para o WhatsApp da loja (docs/03).
import { formatarMoeda } from "@/lib/format";
import { linkWhatsApp } from "@/lib/venda";

export const URL_SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Número da loja: o das Configurações (painel) ou, se vazio, o da variável de ambiente. */
export function numeroDaLoja(numeroConfigurado: string | null | undefined): string | null {
  const numero = (numeroConfigurado || process.env.NEXT_PUBLIC_WHATSAPP_NUMERO || "").replace(/\D/g, "");
  return numero || null;
}

/**
 * Olá, Matilda3D! Vim pelo site e tenho interesse no produto:
 * *{nome}* — cor: {cor}
 * Valor no site: {preço}
 * Link: {url}
 */
export function mensagemPedido(p: { nome: string; cor?: string | null; precoCentavos: number | null; slug: string }): string {
  return [
    "Olá, Matilda3D! Vim pelo site e tenho interesse no produto:",
    `*${p.nome}*${p.cor ? ` — cor: ${p.cor}` : ""}`,
    `Valor no site: ${p.precoCentavos == null ? "Sob consulta" : formatarMoeda(p.precoCentavos)}`,
    `Link: ${URL_SITE}/produtos/${p.slug}`,
  ]
    .join("\n")
    .replace(/ /g, " ");
}

export function mensagemContato(): string {
  return "Olá, Matilda3D! Vim pelo site e queria tirar uma dúvida.";
}

export function mensagemEncomendaEnviada(numero: number | null): string {
  return numero
    ? `Olá, Matilda3D! Acabei de enviar a encomenda #${numero} pelo site e queria continuar a conversa por aqui.`
    : "Olá, Matilda3D! Acabei de enviar uma encomenda pelo site e queria continuar a conversa por aqui.";
}

export function linkPedido(numeroLoja: string | null, mensagem: string): string {
  return linkWhatsApp(mensagem, numeroLoja);
}
