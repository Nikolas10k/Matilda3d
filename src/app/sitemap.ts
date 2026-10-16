import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/whatsapp-site";
import { listarProdutosPublicos } from "@/server/publico";

// Páginas públicas + produtos ativos (docs/03, SEO). O painel fica de fora.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const produtos = await listarProdutosPublicos();
  const fixas = ["", "/produtos", "/encomenda", "/sobre"].map((caminho) => ({
    url: `${URL_SITE}${caminho}`,
    changeFrequency: "weekly" as const,
    priority: caminho === "" ? 1 : 0.8,
  }));
  return [
    ...fixas,
    ...produtos.map((p) => ({
      url: `${URL_SITE}/produtos/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
