import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FiltroStatus = "todos" | "ativos" | "inativos";

export type ProdutoNaLista = {
  id: string;
  nome: string;
  slug: string;
  categoria: string | null;
  precoCentavos: number | null;
  custoCentavos: number | null;
  ativo: boolean;
  destaque: boolean;
  capa: string | null;
  vendidos: number;
};

export async function listarProdutos(filtro: {
  busca?: string;
  categoriaId?: string;
  status?: FiltroStatus;
}): Promise<ProdutoNaLista[]> {
  const supabase = await createClient();

  let consulta = supabase
    .from("produtos")
    .select("id, nome, slug, preco_centavos, custo_centavos, ativo, destaque, categorias(nome), produto_fotos(caminho, ordem)")
    .order("nome");

  if (filtro.busca) consulta = consulta.ilike("nome", `%${filtro.busca.replace(/[%_]/g, "")}%`);
  if (filtro.categoriaId) consulta = consulta.eq("categoria_id", filtro.categoriaId);
  if (filtro.status === "ativos") consulta = consulta.eq("ativo", true);
  if (filtro.status === "inativos") consulta = consulta.eq("ativo", false);

  const [{ data: produtos, error }, { data: vendas }] = await Promise.all([
    consulta,
    supabase.from("vw_produtos_mais_vendidos").select("produto_id, quantidade"),
  ]);
  if (error) throw new Error("Não foi possível carregar os produtos.");

  const vendidosPorProduto = new Map<string, number>();
  for (const v of vendas ?? []) {
    if (v.produto_id) vendidosPorProduto.set(v.produto_id, Number(v.quantidade ?? 0));
  }

  return (produtos ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    categoria: p.categorias?.nome ?? null,
    precoCentavos: p.preco_centavos,
    custoCentavos: p.custo_centavos,
    ativo: p.ativo,
    destaque: p.destaque,
    capa: [...p.produto_fotos].sort((a, b) => a.ordem - b.ordem)[0]?.caminho ?? null,
    vendidos: vendidosPorProduto.get(p.id) ?? 0,
  }));
}

export async function obterProduto(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("produtos")
    .select("*, produto_fotos(caminho, ordem)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { produto_fotos, ...produto } = data;
  return { ...produto, fotos: [...produto_fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.caminho) };
}

export async function listarCategorias() {
  const supabase = await createClient();
  const { data } = await supabase.from("categorias").select("id, nome").order("ordem");
  return data ?? [];
}

export type PadroesCalculadora = {
  precoKgFilamentoCentavos: number;
  custoEnergiaHoraCentavos: number;
  desgasteHoraCentavos: number;
  embalagemCentavos: number;
  taxaFalhasPct: number;
  margemPct: number;
};

export async function obterPadroesCalculadora(): Promise<PadroesCalculadora> {
  const supabase = await createClient();
  const { data: c } = await supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle();
  return {
    precoKgFilamentoCentavos: c?.preco_kg_filamento_centavos ?? 12000,
    custoEnergiaHoraCentavos: c?.custo_energia_hora_centavos ?? 50,
    desgasteHoraCentavos: c?.desgaste_hora_centavos ?? 100,
    embalagemCentavos: c?.embalagem_centavos ?? 150,
    taxaFalhasPct: Number(c?.taxa_falhas_pct ?? 10),
    margemPct: Number(c?.margem_padrao_pct ?? 100),
  };
}
