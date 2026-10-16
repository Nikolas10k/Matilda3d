import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ClienteNaLista = {
  id: string;
  nome: string;
  whatsapp: string | null;
  instagram: string | null;
  compras: number;
  totalGastoCentavos: number;
  ultimaCompra: string | null;
};

export async function listarClientes(busca?: string): Promise<ClienteNaLista[]> {
  const supabase = await createClient();
  let consulta = supabase.from("clientes").select("id, nome, whatsapp, instagram").order("nome");
  const texto = busca?.trim().replace(/[%_,()]/g, "");
  if (texto) {
    const digitos = texto.replace(/\D/g, "");
    consulta = consulta.or(
      digitos.length >= 4 ? `nome.ilike.%${texto}%,whatsapp.ilike.%${digitos}%,instagram.ilike.%${texto}%` : `nome.ilike.%${texto}%,instagram.ilike.%${texto}%`,
    );
  }

  const [{ data: clientes, error }, { data: vendas }] = await Promise.all([
    consulta,
    supabase.from("vendas").select("cliente_id, total_centavos, data_venda").eq("cancelada", false).not("cliente_id", "is", null),
  ]);
  if (error) throw new Error("Não foi possível carregar os clientes.");

  // Totais só de vendas não canceladas.
  const resumo = new Map<string, { compras: number; total: number; ultima: string }>();
  for (const v of vendas ?? []) {
    if (!v.cliente_id) continue;
    const r = resumo.get(v.cliente_id) ?? { compras: 0, total: 0, ultima: "" };
    r.compras += 1;
    r.total += v.total_centavos;
    if (v.data_venda > r.ultima) r.ultima = v.data_venda;
    resumo.set(v.cliente_id, r);
  }

  return (clientes ?? []).map((c) => ({
    ...c,
    compras: resumo.get(c.id)?.compras ?? 0,
    totalGastoCentavos: resumo.get(c.id)?.total ?? 0,
    ultimaCompra: resumo.get(c.id)?.ultima || null,
  }));
}

export async function obterCliente(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clientes")
    .select(
      "*, vendas(id, numero, data_venda, total_centavos, pago_centavos, status_pagamento, cancelada), encomendas(id, numero, tipo, status, criado_em, data_desejada)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const validas = data.vendas.filter((v) => !v.cancelada);
  return {
    ...data,
    vendas: [...data.vendas].sort((a, b) => b.numero - a.numero),
    encomendas: [...data.encomendas].sort((a, b) => b.numero - a.numero),
    totais: {
      compras: validas.length,
      totalGastoCentavos: validas.reduce((s, v) => s + v.total_centavos, 0),
      abertoCentavos: validas.reduce((s, v) => s + v.total_centavos - v.pago_centavos, 0),
    },
  };
}
