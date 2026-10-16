import { centavosParaTexto } from "@/lib/format";
import type { ValoresFormularioProduto } from "@/lib/validacao/produto";
import type { obterProduto } from "@/server/produtos";

type Produto = NonNullable<Awaited<ReturnType<typeof obterProduto>>>;

const textoNumero = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

/** Converte o produto do banco para os campos (texto) do formulário. */
export function valoresDoProduto(p: Produto): ValoresFormularioProduto {
  return {
    id: p.id,
    nome: p.nome,
    slug: p.slug,
    categoriaId: p.categoria_id ?? "",
    descricaoCurta: p.descricao_curta ?? "",
    descricao: p.descricao ?? "",
    preco: centavosParaTexto(p.preco_centavos),
    custo: centavosParaTexto(p.custo_centavos),
    gramas: textoNumero(p.gramas_filamento),
    horas: p.minutos_impressao == null ? "" : String(Math.floor(p.minutos_impressao / 60)),
    minutos: p.minutos_impressao == null ? "" : String(p.minutos_impressao % 60),
    cores: p.cores,
    fotos: p.fotos,
    ativo: p.ativo,
    destaque: p.destaque,
  };
}

/** Produto novo; aceita valores vindos da calculadora (?preco=&custo=&gramas=&minutos=, em centavos/minutos). */
export function valoresDeProdutoNovo(id: string, params: Record<string, string | undefined>): ValoresFormularioProduto {
  const inteiro = (t: string | undefined) => (t && /^\d+$/.test(t) ? Number(t) : null);
  const minutos = inteiro(params.minutos);
  const gramas = params.gramas && Number(params.gramas) > 0 ? Number(params.gramas) : null;
  return {
    id,
    nome: "",
    slug: "",
    categoriaId: "",
    descricaoCurta: "",
    descricao: "",
    preco: centavosParaTexto(inteiro(params.preco)),
    custo: centavosParaTexto(inteiro(params.custo)),
    gramas: textoNumero(gramas),
    horas: minutos ? String(Math.floor(minutos / 60)) : "",
    minutos: minutos ? String(minutos % 60) : "",
    cores: [],
    fotos: [],
    ativo: true,
    destaque: false,
  };
}
