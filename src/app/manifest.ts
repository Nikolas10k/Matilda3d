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
    background_color: "#FFF4EE",
    theme_color: "#1E1B33",
    lang: "pt-BR",
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
