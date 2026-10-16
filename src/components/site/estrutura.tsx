import Link from "next/link";
import { Logo } from "@/components/marca/logo";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { MenuCelular } from "@/components/site/menu-celular";
import { linkPedido, mensagemContato, numeroDaLoja } from "@/lib/whatsapp-site";
import { obterMarca } from "@/server/publico";

const LINKS = [
  { href: "/produtos", rotulo: "Produtos" },
  { href: "/#como-encomendar", rotulo: "Como encomendar" },
  { href: "/sobre", rotulo: "Sobre nós" },
];

/** Cabeçalho do site (docs/03): logo, links e botão verde "Fale no WhatsApp". */
export async function Cabecalho() {
  const marca = await obterMarca();
  const whatsapp = linkPedido(numeroDaLoja(marca.whatsapp), mensagemContato());

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="rounded-full" aria-label="Matilda3D, página inicial">
          <Logo tamanho={38} />
        </Link>
        <nav aria-label="Menu principal" className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded py-2 hover:text-brand-strong">
              {l.rotulo}
            </Link>
          ))}
          <BotaoWhatsApp href={whatsapp} origem="header" className="px-5">
            Fale no WhatsApp
          </BotaoWhatsApp>
        </nav>
        <MenuCelular links={LINKS} linkWhatsApp={whatsapp} />
      </div>
    </header>
  );
}

function IconeInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </svg>
  );
}

export function linkInstagram(usuario: string | null) {
  const u = (usuario || process.env.NEXT_PUBLIC_INSTAGRAM_USUARIO || "matilda3d").replace(/^@/, "");
  return { usuario: u, url: `https://instagram.com/${u}` };
}

export { IconeInstagram };

/** Rodapé (docs/03): logo, Instagram, WhatsApp, links e crédito. */
export async function Rodape() {
  const marca = await obterMarca();
  const instagram = linkInstagram(marca.instagram);
  const whatsapp = linkPedido(numeroDaLoja(marca.whatsapp), mensagemContato());

  return (
    <footer className="bg-[#15132A] text-[#C9C4E0]">
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="flex flex-col gap-3">
          <Logo tamanho={34} claro />
          <p className="max-w-xs text-sm">Peças impressas em 3D, feitas camada por camada. Encomendas pelo WhatsApp.</p>
        </div>
        <nav aria-label="Links do rodapé" className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold text-white">Site</p>
          <Link href="/produtos" className="py-1.5 hover:text-white">Produtos</Link>
          <Link href="/encomenda" className="py-1.5 hover:text-white">Encomenda personalizada</Link>
          <Link href="/sobre" className="py-1.5 hover:text-white">Sobre nós</Link>
        </nav>
        <div className="flex flex-col gap-1 text-sm">
          <p className="mb-1 font-bold text-white">Fale com a gente</p>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="py-1.5 hover:text-white">WhatsApp</a>
          <a href={instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 py-1.5 hover:text-white">
            <IconeInstagram className="size-4" />@{instagram.usuario}
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs md:px-6">
          <span>© {marca.nome}</span>
          <span>
            Site por <span className="font-bold text-white">Givance Tech</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
