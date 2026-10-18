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
        <span className="rotulo text-ink-muted">Encomenda personalizada</span>
        <h1 className="text-[clamp(34px,7vw,48px)] leading-tight font-light">Tem uma ideia? A gente imprime.</h1>
        <p className="text-[17px] leading-relaxed text-ink-soft">
          Lembrancinhas de festa, topo de bolo, nome em 3D, peça de reposição ou presente único. Conte o que você imagina — quanto mais
          detalhes, melhor — e respondemos pelo WhatsApp com o valor e o prazo.
        </p>
        <ul className="flex flex-col gap-2 pt-2 text-ink-soft">
          {["Pode mandar uma foto ou print de referência.", "Diga as cores e, se tiver, a data da festa.", "Só começamos a imprimir depois que você aprovar."].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-3 h-px w-4 shrink-0 bg-line" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <FormularioEncomendaSite />
    </Faixa>
  );
}
