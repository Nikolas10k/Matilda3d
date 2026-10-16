"use client";

import Image from "next/image";
import { useState } from "react";
import { BotaoWhatsApp } from "@/components/site/botao-whatsapp";
import { FotoVazia } from "@/components/site/cartao-produto";
import { urlFotoProduto } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { linkPedido, mensagemPedido } from "@/lib/whatsapp-site";

/** Galeria: foto grande + miniaturas clicáveis. */
export function Galeria({ fotos, nome }: { fotos: string[]; nome: string }) {
  const [atual, setAtual] = useState(0);
  if (fotos.length === 0) {
    return (
      <div className="aspect-[4/3] overflow-hidden rounded-card border border-border">
        <FotoVazia grande />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card border border-border bg-surface-alt">
        <Image
          key={fotos[atual]}
          src={urlFotoProduto(fotos[atual])}
          alt={`${nome}${fotos.length > 1 ? ` — foto ${atual + 1} de ${fotos.length}` : ""}`}
          fill
          priority
          sizes="(min-width: 1024px) 600px, 92vw"
          className="object-cover"
        />
      </div>
      {fotos.length > 1 && (
        <ul className="grid grid-cols-6 gap-2" aria-label="Fotos do produto">
          {fotos.map((f, i) => (
            <li key={f}>
              <button
                type="button"
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === atual ? "true" : undefined}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors",
                  i === atual ? "border-ink" : "border-transparent hover:border-input",
                )}
              >
                <Image src={urlFotoProduto(f)} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Escolha de cor + botão de pedido (a cor escolhida entra na mensagem do WhatsApp). */
export function PedidoProduto({
  produto,
  numeroLoja,
}: {
  produto: { id: string; nome: string; slug: string; precoCentavos: number | null; cores: string[] };
  numeroLoja: string | null;
}) {
  const [cor, setCor] = useState<string | null>(produto.cores.length === 1 ? produto.cores[0] : null);
  const link = linkPedido(numeroLoja, mensagemPedido({ ...produto, cor }));

  return (
    <div className="flex flex-col gap-5">
      {produto.cores.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">
            Cor{cor ? `: ${cor}` : " (escolha uma, se quiser)"}
          </legend>
          <div className="flex flex-wrap gap-2">
            {produto.cores.map((c) => (
              <label
                key={c}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                  cor === c ? "border-ink bg-ink text-white" : "border-input bg-white hover:border-ink",
                )}
              >
                <input type="radio" name="cor" value={c} checked={cor === c} onChange={() => setCor(c)} className="sr-only" />
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <BotaoWhatsApp href={link} origem="pagina_produto" produtoId={produto.id} className="min-h-[52px] w-full text-base sm:w-auto sm:px-8">
        Pedir pelo WhatsApp
      </BotaoWhatsApp>
      <p className="text-sm text-ink-muted">Você combina detalhes, valor final e entrega direto com a gente no WhatsApp.</p>
    </div>
  );
}
