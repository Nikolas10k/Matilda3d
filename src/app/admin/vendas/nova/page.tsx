import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { FormularioCarregando } from "@/components/painel/carregando";
import { FormularioVenda, type ValoresFormularioVenda } from "@/components/painel/vendas/formulario-venda";
import { centavosParaTexto, dataIsoSaoPaulo } from "@/lib/format";
import type { Canal } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { listarEncomendasParaVincular, listarProdutosParaVenda, obterVenda } from "@/server/vendas";

export const metadata: Metadata = { title: "Nova venda" };

type SearchParams = PageProps<"/admin/vendas/nova">["searchParams"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PaginaNovaVenda({ searchParams }: PageProps<"/admin/vendas/nova">) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <Link href="/admin/vendas" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-ink-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Vendas
        </Link>
        <h1 className="text-2xl font-bold md:text-3xl">Nova venda</h1>
      </div>
      <Suspense fallback={<FormularioCarregando />}>
        <Formulario searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Formulario({ searchParams }: { searchParams: SearchParams }) {
  await exigirEquipe();
  const params = await searchParams;
  const duplicar = typeof params.duplicar === "string" && UUID.test(params.duplicar) ? params.duplicar : null;
  const encomendaParam = typeof params.encomenda === "string" && UUID.test(params.encomenda) ? params.encomenda : "";

  const [produtos, encomendas, origem] = await Promise.all([
    listarProdutosParaVenda(),
    listarEncomendasParaVincular(),
    duplicar ? obterVenda(duplicar) : Promise.resolve(null),
  ]);

  let valores: ValoresFormularioVenda = {
    data: dataIsoSaoPaulo(),
    cliente: { modo: "avulsa" },
    itens: [],
    desconto: "",
    frete: "",
    canal: "whatsapp",
    valorPago: "",
    forma: "",
    observacoes: "",
    encomendaId: encomendas.some((e) => e.id === encomendaParam) ? encomendaParam : "",
  };
  let aviso: string | undefined;

  // "Cancelar e duplicar": copia itens e valores da venda cancelada (docs/06).
  if (origem) {
    valores = {
      ...valores,
      cliente: origem.clientes
        ? { modo: "existente", id: origem.clientes.id, nome: origem.clientes.nome, whatsapp: origem.clientes.whatsapp }
        : { modo: "avulsa" },
      itens: origem.venda_itens.map((i) => ({
        produtoId: i.produto_id ?? "",
        descricao: i.descricao,
        cor: i.cor ?? "",
        quantidade: i.quantidade,
        preco: centavosParaTexto(i.preco_unitario_centavos),
      })),
      desconto: origem.desconto_centavos ? centavosParaTexto(origem.desconto_centavos) : "",
      frete: origem.frete_centavos ? centavosParaTexto(origem.frete_centavos) : "",
      canal: origem.canal as Canal,
      observacoes: origem.observacoes ?? "",
    };
    aviso = `Cópia da venda #${origem.numero}. Corrija o que for preciso e salve. Os pagamentos da venda antiga foram estornados: registre de novo o valor recebido.`;
  }

  // Venda a partir de uma encomenda (Fase 6): já vem com o item orçado.
  const encomenda = encomendas.find((e) => e.id === valores.encomendaId);
  if (encomenda && !origem) {
    valores = {
      ...valores,
      cliente: encomenda.cliente_id ? { modo: "existente", id: encomenda.cliente_id, nome: encomenda.nome_contato } : valores.cliente,
      itens: [
        {
          produtoId: "",
          descricao: `Encomenda #${encomenda.numero} — ${encomenda.tipo}`,
          cor: "",
          quantidade: encomenda.quantidade,
          preco: encomenda.valor_orcado_centavos
            ? centavosParaTexto(Math.round(encomenda.valor_orcado_centavos / encomenda.quantidade))
            : "",
        },
      ],
    };
  }

  return <FormularioVenda valoresIniciais={valores} produtos={produtos} encomendas={encomendas} aviso={aviso} />;
}
