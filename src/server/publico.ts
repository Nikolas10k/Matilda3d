import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/publico";

// Dados do site público, em cache. O painel chama updateTag("produtos") e
// updateTag("marca") ao salvar; sem isso, o cache se renova a cada 1 minuto
// (perfil "minutes"), atendendo ao "produto editado aparece em até 1 minuto".

export type ProdutoPublico = {
  id: string;
  nome: string;
  slug: string;
  descricaoCurta: string | null;
  descricao: string | null;
  precoCentavos: number | null;
  cores: string[];
  destaque: boolean;
  categoria: { nome: string; slug: string } | null;
  fotos: string[];
};

const COLUNAS = "id, nome, slug, descricao_curta, descricao, preco_centavos, cores, destaque, categorias(nome, slug), produto_fotos(caminho, ordem)";

type Linha = {
  id: string;
  nome: string;
  slug: string;
  descricao_curta: string | null;
  descricao: string | null;
  preco_centavos: number | null;
  cores: string[];
  destaque: boolean;
  categorias: { nome: string; slug: string } | null;
  produto_fotos: { caminho: string; ordem: number }[];
};

function mapear(p: Linha): ProdutoPublico {
  return {
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    descricaoCurta: p.descricao_curta,
    descricao: p.descricao,
    precoCentavos: p.preco_centavos,
    cores: p.cores,
    destaque: p.destaque,
    categoria: p.categorias,
    fotos: [...p.produto_fotos].sort((a, b) => a.ordem - b.ordem).map((f) => f.caminho),
  };
}

export async function obterMarca() {
  "use cache";
  cacheTag("marca");
  cacheLife("minutes");
  const { data } = await createPublicClient().from("marca").select("nome, whatsapp, instagram, texto_sobre, foto_criadores").eq("id", 1).maybeSingle();
  return {
    nome: data?.nome ?? "Matilda3D",
    whatsapp: data?.whatsapp ?? null,
    instagram: data?.instagram ?? null,
    textoSobre: data?.texto_sobre ?? null,
    fotoCriadores: data?.foto_criadores ?? null,
  };
}

export async function listarCategoriasPublicas() {
  "use cache";
  cacheTag("produtos");
  cacheLife("minutes");
  const { data } = await createPublicClient().from("categorias").select("nome, slug").order("ordem");
  return data ?? [];
}

/** Produtos ativos (o RLS já esconde os inativos de visitantes). */
export async function listarProdutosPublicos(filtro: { categoriaSlug?: string; destaques?: boolean } = {}) {
  "use cache";
  cacheTag("produtos");
  cacheLife("minutes");
  let consulta = createPublicClient().from("produtos").select(COLUNAS).eq("ativo", true).order("destaque", { ascending: false }).order("nome");
  if (filtro.destaques) consulta = consulta.eq("destaque", true).limit(6);
  const { data } = await consulta;
  const produtos = ((data ?? []) as Linha[]).map(mapear);
  return filtro.categoriaSlug ? produtos.filter((p) => p.categoria?.slug === filtro.categoriaSlug) : produtos;
}

export async function obterProdutoPublico(slug: string) {
  "use cache";
  cacheTag("produtos");
  cacheLife("minutes");
  const { data } = await createPublicClient().from("produtos").select(COLUNAS).eq("ativo", true).eq("slug", slug).maybeSingle();
  return data ? mapear(data as Linha) : null;
}

export async function listarSlugsPublicos() {
  const { data } = await createPublicClient().from("produtos").select("slug").eq("ativo", true);
  return (data ?? []).map((p) => p.slug);
}
