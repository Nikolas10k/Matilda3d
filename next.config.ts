import type { NextConfig } from "next";

// Fotos dos produtos e da marca vêm do Supabase Storage.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
    ],
  },
  experimental: {
    // Formulário de encomenda do site: imagem de referência de até 5 MB (docs/03) + campos.
    serverActions: { bodySizeLimit: "6mb" },
    // CSS (Tailwind) embutido no HTML: tira um arquivo bloqueante da primeira pintura.
    inlineCss: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
