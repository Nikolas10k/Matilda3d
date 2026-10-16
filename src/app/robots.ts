import type { MetadataRoute } from "next";
import { URL_SITE } from "@/lib/whatsapp-site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Painel, login e rotas internas não devem aparecer em buscas.
      disallow: ["/admin", "/login", "/recuperar-senha", "/redefinir-senha", "/acesso-nao-liberado", "/auth/", "/api/", "/obrigado"],
    },
    sitemap: `${URL_SITE}/sitemap.xml`,
  };
}
