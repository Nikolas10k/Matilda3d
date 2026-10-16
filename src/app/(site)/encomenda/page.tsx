import type { Metadata } from "next";
import { Faixa } from "@/components/site/blocos";
import { FormularioEncomendaSite } from "@/components/site/formulario-encomenda";

export const metadata: Metadata = {
  title: "Encomenda personalizada",
  description: "Conte a sua ideia e a Matilda3D imprime em 3D: topo de bolo, lembrancinhas, nome em 3D, presentes e peças sob medida.",
  alternates: { canonical: "/encomenda" },
};

export default function PaginaEncomenda() {
  return (
    <Faixa conteudo="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-start">
      <div className="flex flex-col gap-4 lg:sticky lg:top-28">
        <span className="self-start rounded-full border border-[#FFD3BF] bg-white px-3.5 py-1.5 text-sm font-bold text-[#9A3412]">Encomenda personalizada</span>
        <h1 className="text-[clamp(34px,7vw,48px)] leading-tight font-bold tracking-tight">Tem uma ideia? A gente imprime.</h1>
        <p className="text-[17px] leading-relaxed text-ink-muted">
          Lembrancinhas de festa, topo de bolo, nome em 3D, peça de reposição ou presente único. Conte o que você imagina — quanto mais
          detalhes, melhor — e respondemos pelo WhatsApp com o valor e o prazo.
        </p>
        <ul className="flex flex-col gap-2 pt-2 text-ink-muted">
          <li>• Pode mandar uma foto ou print de referência.</li>
          <li>• Diga as cores e, se tiver, a data da festa.</li>
          <li>• Só começamos a imprimir depois que você aprovar.</li>
        </ul>
      </div>
      <FormularioEncomendaSite />
    </Faixa>
  );
}
