// Garantia em tempo de compilação de que os tipos gerados funcionam com o
// supabase-js (selects com join e chamadas RPC). Não é importado por ninguém.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database";

export async function verificarTipos(db: SupabaseClient<Database>) {
  const { data: produtos } = await db
    .from("produtos")
    .select("nome, preco_centavos, categorias(nome), produto_fotos(caminho, ordem)")
    .eq("ativo", true);
  const nome: string | undefined = produtos?.[0]?.nome;
  const categoria: string | undefined = produtos?.[0]?.categorias?.nome;
  const fotos: { caminho: string }[] | undefined = produtos?.[0]?.produto_fotos;

  const { data: vendaId } = await db.rpc("registrar_venda", {
    p_data: "2026-10-15",
    p_cliente: "00000000-0000-0000-0000-000000000000",
    p_canal: "whatsapp",
    p_itens: [{ descricao: "Chaveiro", quantidade: 1, preco_unitario_centavos: 1500 }],
  });
  const id: string | null = vendaId;

  return { nome, categoria, fotos, id };
}
