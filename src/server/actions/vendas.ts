"use server";

import { revalidatePath } from "next/cache";
import { formatarMoeda } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { errosPorCampo } from "@/lib/validacao/comum";
import { esquemaCancelamento, esquemaEdicaoVenda, esquemaPagamento, esquemaVenda } from "@/lib/validacao/venda";
import { exigirEquipe } from "@/server/auth";

export type ResultadoVenda =
  | { ok: true; id: string }
  | { ok: false; erro: string; campos?: Record<string, string> };

// Mensagens que as funções do banco já devolvem em português (docs/05, migração 003).
const MENSAGENS_DO_BANCO = [
  "Acesso negado",
  "Venda não encontrada",
  "Venda cancelada não recebe pagamento",
  "Valor deve ser maior que zero",
  "Informe a forma de pagamento",
  "Pagamento maior que o valor em aberto",
  "Inclua pelo menos um item",
  "Todo item precisa de descrição",
  "Desconto maior que o valor da venda",
  "Esta encomenda já está vinculada a outra venda",
  "Informe o motivo do cancelamento",
  "Venda não encontrada ou já cancelada",
];

function erroDoBanco(mensagem: string | undefined, padrao: string): string {
  const conhecida = MENSAGENS_DO_BANCO.find((m) => mensagem?.includes(m));
  return conhecida ? `${conhecida}.` : padrao;
}

function revalidarFinanceiro(vendaId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/vendas");
  revalidatePath("/admin/caixa");
  if (vendaId) revalidatePath(`/admin/vendas/${vendaId}`);
}

export async function registrarVenda(valores: unknown): Promise<ResultadoVenda> {
  await exigirEquipe();
  const r = esquemaVenda.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };
  const v = r.data;

  const supabase = await createClient();

  // Cliente: existente, novo (reaproveita pelo WhatsApp para não duplicar) ou venda avulsa.
  let clienteId: string | null = null;
  if (v.cliente.modo === "existente") {
    clienteId = v.cliente.id;
  } else if (v.cliente.modo === "novo") {
    if (v.cliente.whatsapp) {
      const { data: existente } = await supabase
        .from("clientes")
        .select("id")
        .eq("whatsapp", v.cliente.whatsapp)
        .maybeSingle();
      clienteId = existente?.id ?? null;
    }
    if (!clienteId) {
      const { data: novo, error } = await supabase
        .from("clientes")
        .insert({ nome: v.cliente.nome, whatsapp: v.cliente.whatsapp, instagram: v.cliente.instagram })
        .select("id")
        .single();
      if (error || !novo) return { ok: false, erro: "Não foi possível cadastrar o cliente. Tente de novo." };
      clienteId = novo.id;
    }
  }

  const { data: vendaId, error } = await supabase.rpc("registrar_venda", {
    p_data: v.data,
    p_cliente: clienteId as string, // null = venda avulsa (o tipo gerado não marca parâmetros sem default como opcionais)
    p_canal: v.canal,
    p_itens: v.itens.map((i) => ({
      produto_id: i.produtoId,
      descricao: i.descricao,
      cor: i.cor || null,
      quantidade: i.quantidade,
      preco_unitario_centavos: i.preco,
    })),
    p_desconto: v.desconto,
    p_frete: v.frete,
    p_valor_pago: v.valorPago,
    p_forma: (v.forma || null) as string,
    p_encomenda: v.encomendaId as string,
    p_observacoes: (v.observacoes || null) as string,
  });

  if (error || !vendaId) {
    return { ok: false, erro: erroDoBanco(error?.message, "Não foi possível registrar a venda. Tente de novo.") };
  }

  revalidarFinanceiro(vendaId);
  if (v.encomendaId) revalidatePath("/admin/encomendas");
  return { ok: true, id: vendaId };
}

export async function registrarPagamento(valores: unknown): Promise<ResultadoVenda> {
  await exigirEquipe();
  const r = esquemaPagamento.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };
  const p = r.data;

  const supabase = await createClient();
  const { data: venda } = await supabase
    .from("vendas")
    .select("total_centavos, pago_centavos, cancelada")
    .eq("id", p.vendaId)
    .maybeSingle();
  if (!venda) return { ok: false, erro: "Venda não encontrada." };

  const aberto = venda.total_centavos - venda.pago_centavos;
  if (p.valor > aberto) {
    const mensagem = `O valor é maior do que falta pagar (${formatarMoeda(aberto)}).`.replace(/ /g, " ");
    return { ok: false, erro: mensagem, campos: { valor: mensagem } };
  }

  const { error } = await supabase.rpc("registrar_pagamento", {
    p_venda: p.vendaId,
    p_valor: p.valor,
    p_forma: p.forma,
    p_data: p.data,
  });
  if (error) return { ok: false, erro: erroDoBanco(error.message, "Não foi possível registrar o pagamento.") };

  revalidarFinanceiro(p.vendaId);
  return { ok: true, id: p.vendaId };
}

export async function cancelarVenda(valores: unknown): Promise<ResultadoVenda> {
  await exigirEquipe();
  const r = esquemaCancelamento.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_venda", { p_venda: r.data.vendaId, p_motivo: r.data.motivo });
  if (error) return { ok: false, erro: erroDoBanco(error.message, "Não foi possível cancelar a venda.") };

  revalidarFinanceiro(r.data.vendaId);
  revalidatePath("/admin/encomendas");
  return { ok: true, id: r.data.vendaId };
}

/** Depois de salva, a venda só muda observações e cliente (docs/06). */
export async function atualizarVenda(valores: unknown): Promise<ResultadoVenda> {
  await exigirEquipe();
  const r = esquemaEdicaoVenda.safeParse(valores);
  if (!r.success) return { ok: false, erro: "Confira os campos destacados.", campos: errosPorCampo(r.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendas")
    .update({ observacoes: r.data.observacoes || null, cliente_id: r.data.clienteId })
    .eq("id", r.data.vendaId);
  if (error) return { ok: false, erro: "Não foi possível salvar as alterações." };

  revalidarFinanceiro(r.data.vendaId);
  return { ok: true, id: r.data.vendaId };
}

export type ClienteEncontrado = { id: string; nome: string; whatsapp: string | null };

/** Busca por nome ou WhatsApp (para o campo de cliente da nova venda). */
export async function buscarClientes(termo: string): Promise<ClienteEncontrado[]> {
  await exigirEquipe();
  const texto = termo.trim().replace(/[%_,()]/g, "");
  if (texto.length < 2) return [];

  const supabase = await createClient();
  const digitos = texto.replace(/\D/g, "");
  const filtro = digitos.length >= 4 ? `nome.ilike.%${texto}%,whatsapp.ilike.%${digitos}%` : `nome.ilike.%${texto}%`;
  const { data } = await supabase.from("clientes").select("id, nome, whatsapp").or(filtro).order("nome").limit(8);
  return data ?? [];
}
