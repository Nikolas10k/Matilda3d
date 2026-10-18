import type { MetadataRoute } from "next";

// PWA simples do painel (docs/07, Fase 8): no celular, "Adicionar à tela inicial"
// abre direto o painel, em tela cheia, como um aplicativo.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Painel Matilda3D",
    short_name: "Matilda3D",
    description: "Vendas, caixa, encomendas e produtos da Matilda3D.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F3F1",
    theme_color: "#F4F3F1",
    lang: "pt-BR",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // O símbolo fica dentro da área segura de 80%, então serve como maskable.
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
