import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Plus, Search, Users } from "lucide-react";
import { ConteudoCarregando } from "@/components/painel/carregando";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatarData, formatarMoeda, formatarWhatsApp } from "@/lib/format";
import { linkWhatsApp } from "@/lib/venda";
import { exigirEquipe } from "@/server/auth";
import { listarClientes } from "@/server/clientes";

export const metadata: Metadata = { title: "Clientes" };

type SearchParams = PageProps<"/admin/clientes">["searchParams"];

export default function PaginaClientes({ searchParams }: PageProps<"/admin/clientes">) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Clientes</h1>
        <Button asChild>
          <Link href="/admin/clientes/novo">
            <Plus aria-hidden="true" />
            Novo cliente
          </Link>
        </Button>
      </div>
      <Suspense fallback={<ConteudoCarregando />}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Lista({ searchParams }: { searchParams: SearchParams }) {
  await exigirEquipe();
  const p = await searchParams;
  const busca = typeof p.busca === "string" ? p.busca.trim() : "";
  const clientes = await listarClientes(busca);

  return (
    <>
      <form role="search" className="flex gap-2">
        <label htmlFor="busca" className="sr-only">
          Buscar cliente
        </label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input id="busca" name="busca" type="search" defaultValue={busca} placeholder="Nome, WhatsApp ou Instagram" className="pl-10" />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {clientes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-border bg-white p-10 text-center">
          <Users className="size-10 text-ink-muted" aria-hidden="true" />
          <p className="font-bold">{busca ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
          <p className="max-w-sm text-sm text-ink-muted">Clientes entram aqui ao registrar uma venda ou quando chega uma encomenda pelo site.</p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {clientes.map((c) => (
              <li key={c.id} className="flex items-center gap-2 rounded-card border border-border bg-white p-4">
                <Link href={`/admin/clientes/${c.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{c.nome}</span>
                  <span className="block text-sm text-ink-muted">
                    {c.compras} {c.compras === 1 ? "compra" : "compras"} · {formatarMoeda(c.totalGastoCentavos)}
                    {c.ultimaCompra && ` · última em ${formatarData(c.ultimaCompra)}`}
                  </span>
                </Link>
                {c.whatsapp && (
                  <a
                    href={linkWhatsApp(`Olá, ${c.nome.split(" ")[0]}!`, c.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir WhatsApp de ${c.nome}`}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-ink/10"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-card border border-border bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-ink-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Nome</th>
                  <th scope="col" className="px-4 py-3 font-medium">WhatsApp</th>
                  <th scope="col" className="px-4 py-3 font-medium">Instagram</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Compras</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Total gasto</th>
                  <th scope="col" className="px-4 py-3 font-medium">Última compra</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/clientes/${c.id}`} className="font-bold hover:text-ink-soft hover:underline">
                        {c.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {c.whatsapp ? (
                        <a href={linkWhatsApp(`Olá, ${c.nome.split(" ")[0]}!`, c.whatsapp)} target="_blank" rel="noreferrer" className="text-ink hover:underline">
                          {formatarWhatsApp(c.whatsapp)}
                        </a>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{c.instagram ? `@${c.instagram}` : <span className="text-ink-muted">—</span>}</td>
                    <td className="tabular px-4 py-3 text-right">{c.compras}</td>
                    <td className="tabular px-4 py-3 text-right font-bold">{formatarMoeda(c.totalGastoCentavos)}</td>
                    <td className="tabular px-4 py-3">{c.ultimaCompra ? formatarData(c.ultimaCompra) : "—"}</td>
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
