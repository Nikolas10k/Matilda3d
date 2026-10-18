import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Box, Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { margemProduto } from "@/lib/calculadora";
import { formatarMoeda, formatarPercentual } from "@/lib/format";
import { urlFotoProduto } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { exigirEquipe } from "@/server/auth";
import { listarCategorias, listarProdutos, type FiltroStatus, type ProdutoNaLista } from "@/server/produtos";

export const metadata: Metadata = { title: "Produtos" };

const STATUS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "ativos", rotulo: "Ativos" },
  { valor: "inativos", rotulo: "Inativos" },
];

const preco = (centavos: number | null) => (centavos == null ? "Sob consulta" : formatarMoeda(centavos));
const custo = (centavos: number | null) => (centavos == null ? "—" : formatarMoeda(centavos));
function margem(p: ProdutoNaLista) {
  const m = margemProduto(p.precoCentavos, p.custoCentavos);
  return m == null ? "—" : formatarPercentual(m);
}

export default function PaginaProdutos({ searchParams }: PageProps<"/admin/produtos">) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Produtos</h1>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus aria-hidden="true" />
            Novo produto
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ListaCarregando />}>
        <ListaProdutos searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

function ListaCarregando() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando produtos">
      <Skeleton className="h-16 w-full rounded-card" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-card" />
      ))}
    </div>
  );
}

async function ListaProdutos({ searchParams }: { searchParams: PageProps<"/admin/produtos">["searchParams"] }) {
  await exigirEquipe();
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca.trim() : "";
  const categoriaId = typeof params.categoria === "string" ? params.categoria : "";
  const status = (STATUS.find((s) => s.valor === params.status)?.valor ?? "todos") as FiltroStatus;

  const [produtos, categorias] = await Promise.all([
    listarProdutos({ busca, categoriaId: categoriaId || undefined, status }),
    listarCategorias(),
  ]);
  const filtrando = Boolean(busca || categoriaId || status !== "todos");

  return (
    <>
      <p className="-mt-4 text-sm text-ink-muted">
        {produtos.length} {produtos.length === 1 ? "produto" : "produtos"}
        {filtrando && " encontrados com esses filtros"}
      </p>

      <form role="search" className="grid gap-3 rounded-card border border-border bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto]">
        <label htmlFor="busca" className="sr-only">
          Buscar por nome
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input id="busca" name="busca" type="search" defaultValue={busca} placeholder="Buscar por nome" className="pl-10" />
        </div>
        <label htmlFor="categoria" className="sr-only">
          Categoria
        </label>
        <select id="categoria" name="categoria" defaultValue={categoriaId} className="h-11 rounded-lg border border-input bg-white px-3 text-base">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <label htmlFor="status" className="sr-only">
          Status
        </label>
        <select id="status" name="status" defaultValue={status} className="h-11 rounded-lg border border-input bg-white px-3 text-base">
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {produtos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white p-10 text-center">
          <Box className="size-10 text-ink-muted" aria-hidden="true" />
          <p className="font-bold">{filtrando ? "Nenhum produto com esses filtros." : "Nenhum produto cadastrado ainda."}</p>
          {filtrando ? (
            <Link href="/admin/produtos" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
              Limpar filtros
            </Link>
          ) : (
            <Button asChild>
              <Link href="/admin/produtos/novo">Cadastrar o primeiro produto</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Celular: cartões */}
          <ul className="flex flex-col gap-3 md:hidden">
            {produtos.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/produtos/${p.id}`} className="flex gap-3 rounded-card border border-border bg-white p-3">
                  <Miniatura produto={p} className="size-20" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate font-bold">{p.nome}</span>
                      <Selos produto={p} />
                    </div>
                    <span className="text-sm text-ink-muted">{p.categoria ?? "Sem categoria"}</span>
                    <span className="tabular text-sm">
                      <span className="font-bold">{preco(p.precoCentavos)}</span>
                      <span className="text-ink-muted"> · margem {margem(p)} · {p.vendidos} vendidos</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden overflow-x-auto rounded-card border border-border bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Foto</span>
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">Nome</th>
                  <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Preço</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Custo</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Margem</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Vendidos</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-2">
                      <Miniatura produto={p} className="size-12" />
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/produtos/${p.id}`} className="font-bold hover:text-ink-soft hover:underline">
                        {p.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-ink-muted">{p.categoria ?? "—"}</td>
                    <td className="tabular px-4 py-2 text-right font-bold">{preco(p.precoCentavos)}</td>
                    <td className="tabular px-4 py-2 text-right">{custo(p.custoCentavos)}</td>
                    <td className="tabular px-4 py-2 text-right">{margem(p)}</td>
                    <td className="tabular px-4 py-2 text-right">{p.vendidos}</td>
                    <td className="px-4 py-2">
                      <Selos produto={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

function Miniatura({ produto, className }: { produto: ProdutoNaLista; className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-xl bg-surface-strong", className)}>
      {produto.capa ? (
        <Image src={urlFotoProduto(produto.capa)} alt="" fill sizes="80px" className="object-cover" />
      ) : (
        <Box className="absolute inset-0 m-auto size-6 text-line" aria-hidden="true" />
      )}
    </span>
  );
}

function Selos({ produto }: { produto: ProdutoNaLista }) {
  return (
    <span className="flex shrink-0 flex-wrap gap-1">
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-bold",
          produto.ativo ? "bg-success/10 text-success" : "bg-surface text-ink-muted",
        )}
      >
        {produto.ativo ? "Ativo" : "Inativo"}
      </span>
      {produto.destaque && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-strong px-2 py-0.5 text-xs font-bold text-ink">
          <Star className="size-3" aria-hidden="true" />
          Destaque
        </span>
      )}
    </span>
  );
}
