import type { Metadata, Viewport } from "next";
import { DM_Sans, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Matilda3D | Peças impressas em 3D",
    template: "%s | Matilda3D",
  },
  description:
    "Chaveiros, decoração, presentes e peças personalizadas impressas em 3D. Peça direto pelo WhatsApp.",
  applicationName: "Matilda3D",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Matilda3D" },
  appleWebApp: { capable: true, title: "Matilda3D", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#F4F3F1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${jost.variable} ${dmSans.variable} h-full antialiased`}
      // O script abaixo marca <html data-js> antes de pintar (animações de entrada).
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.dataset.js=''" }} />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
