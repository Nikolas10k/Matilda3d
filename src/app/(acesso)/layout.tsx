import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Layout das telas de acesso ao painel (login, recuperação de senha, aviso).
export default function LayoutAcesso({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-surface px-4 py-10">
      <Link href="/" className="mb-8 rounded-lg" aria-label="Matilda3D, voltar ao site">
        <Logo variante="principal" altura={120} priority />
      </Link>
      <div className="w-full max-w-sm rounded-card border border-border bg-white p-6 shadow-[0_1px_2px_rgb(47_47_49/0.06)] sm:p-8">
        {children}
      </div>
    </main>
  );
}
