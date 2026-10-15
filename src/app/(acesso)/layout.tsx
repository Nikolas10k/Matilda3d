import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/marca/logo";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Layout das telas de acesso ao painel (login, recuperação de senha, aviso).
export default function LayoutAcesso({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-brand-soft px-4 py-10">
      <Link href="/" className="mb-8 rounded-full" aria-label="Matilda3D, voltar ao site">
        <Logo tamanho={44} />
      </Link>
      <div className="w-full max-w-sm rounded-card border border-[#ffd3bf] bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
