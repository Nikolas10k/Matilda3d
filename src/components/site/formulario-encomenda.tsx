"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { dataIsoSaoPaulo } from "@/lib/format";
import { converterParaWebp } from "@/lib/imagem";
import { cn } from "@/lib/utils";
import { errosPorCampo } from "@/lib/validacao/comum";
import { criarEsquemaEncomenda, erroImagem, IMAGEM_TIPOS, TIPOS_PECA } from "@/lib/validacao/encomenda-site";
import { enviarEncomenda } from "@/server/actions/encomenda-site";

/** Máscara (00) 00000-0000 enquanto digita. */
function mascararWhatsApp(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const classeCampo = "h-12 rounded-xl border-[#E3C9BB] bg-white";

export function FormularioEncomendaSite() {
  const router = useRouter();
  const [enviando, iniciar] = useTransition();
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string>();
  const [whatsapp, setWhatsapp] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const inputImagem = useRef<HTMLInputElement>(null);

  function escolherImagem(arquivo: File | undefined) {
    if (!arquivo) return;
    const problema = erroImagem(arquivo);
    setErros((e) => ({ ...e, imagem: problema ?? "" }));
    setImagem(problema ? null : arquivo);
    if (problema && inputImagem.current) inputImagem.current.value = "";
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.delete("imagem");

    // "Hoje" é calculado na hora do envio (a página é estática; não pode ser a data do build).
    const r = criarEsquemaEncomenda(dataIsoSaoPaulo()).safeParse({
      nome: form.get("nome") ?? "",
      whatsapp: form.get("whatsapp") ?? "",
      tipo: form.get("tipo") ?? "",
      quantidade: form.get("quantidade") ?? "",
      descricao: form.get("descricao") ?? "",
      cores: form.get("cores") ?? "",
      dataDesejada: form.get("dataDesejada") ?? "",
      consentimento: form.get("consentimento") === "on",
    });
    if (!r.success) {
      const novos = errosPorCampo(r.error);
      setErros(novos);
      setErroGeral("Confira os campos destacados.");
      document.getElementById(`enc-${Object.keys(novos)[0]}`)?.focus();
      return;
    }

    iniciar(async () => {
      setErroGeral(undefined);
      if (imagem) {
        // Reduz a foto no próprio celular (webp, até 1600px): envio mais rápido.
        try {
          const webp = await converterParaWebp(imagem, 0.85);
          form.set("imagem", new File([webp], "referencia.webp", { type: "image/webp" }));
        } catch {
          form.set("imagem", imagem);
        }
      }
      const resultado = await enviarEncomenda(form);
      if (!resultado.ok) {
        setErros(resultado.campos ?? {});
        setErroGeral(resultado.erro);
        return;
      }
      router.push(resultado.numero ? `/obrigado?n=${resultado.numero}` : "/obrigado");
    });
  }

  const erro = (campo: string) =>
    erros[campo] ? (
      <p id={`enc-${campo}-erro`} className="text-sm font-medium text-danger">
        {erros[campo]}
      </p>
    ) : null;
  const aria = (campo: string) => ({
    "aria-invalid": erros[campo] ? true : undefined,
    "aria-describedby": erros[campo] ? `enc-${campo}-erro` : undefined,
  });

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5 rounded-3xl bg-brand-soft p-6 md:p-8">
      {erroGeral && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-white px-4 py-3 text-sm font-medium text-danger">
          {erroGeral}
        </p>
      )}

      {/* Honeypot: invisível para pessoas; robôs costumam preencher. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="empresa">Empresa</label>
        <input id="empresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="nome" rotulo="Seu nome" erro={erro("nome")}>
          <Input id="enc-nome" name="nome" autoComplete="name" placeholder="Como podemos te chamar?" className={classeCampo} {...aria("nome")} />
        </Campo>
        <Campo id="whatsapp" rotulo="WhatsApp" erro={erro("whatsapp")}>
          <Input
            id="enc-whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(00) 00000-0000"
            value={whatsapp}
            onChange={(e) => setWhatsapp(mascararWhatsApp(e.target.value))}
            className={classeCampo}
            {...aria("whatsapp")}
          />
        </Campo>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
        <Campo id="tipo" rotulo="Tipo de peça" erro={erro("tipo")}>
          <select
            id="enc-tipo"
            name="tipo"
            defaultValue=""
            className={cn("h-12 w-full rounded-xl border bg-white px-3 text-base", erros.tipo ? "border-destructive" : "border-[#E3C9BB]")}
            {...aria("tipo")}
          >
            <option value="" disabled>
              Escolha…
            </option>
            {TIPOS_PECA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id="quantidade" rotulo="Quantidade" erro={erro("quantidade")}>
          <Input id="enc-quantidade" name="quantidade" type="number" inputMode="numeric" min={1} defaultValue={1} className={classeCampo} {...aria("quantidade")} />
        </Campo>
      </div>

      <Campo id="descricao" rotulo="Sua ideia" erro={erro("descricao")} dica={`${descricao.length}/1000`}>
        <Textarea
          id="enc-descricao"
          name="descricao"
          rows={5}
          maxLength={1000}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: 20 chaveiros com o nome dos convidados, na cor rosa"
          className="rounded-xl border-[#E3C9BB] bg-white"
          {...aria("descricao")}
        />
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="cores" rotulo="Cores desejadas (opcional)" erro={erro("cores")}>
          <Input id="enc-cores" name="cores" placeholder="Ex.: rosa e dourado" className={classeCampo} {...aria("cores")} />
        </Campo>
        <Campo id="dataDesejada" rotulo="Para quando? (opcional)" erro={erro("dataDesejada")}>
          <Input
            id="enc-dataDesejada"
            name="dataDesejada"
            type="date"
            onFocus={(e) => (e.currentTarget.min = dataIsoSaoPaulo())}
            className={classeCampo}
            {...aria("dataDesejada")}
          />
        </Campo>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">Imagem de referência (opcional)</span>
        {imagem ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#E3C9BB] bg-white px-4 py-2 text-sm">
            <span className="truncate font-medium">{imagem.name}</span>
            <button
              type="button"
              onClick={() => {
                setImagem(null);
                if (inputImagem.current) inputImagem.current.value = "";
              }}
              aria-label="Remover imagem"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-surface-alt"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E3C9BB] bg-white/60 text-sm font-bold text-ink-muted hover:border-brand hover:text-brand-strong focus-within:border-ring">
            <ImagePlus className="size-5" aria-hidden="true" />
            Escolher imagem (JPG, PNG ou WEBP, até 5 MB)
            <input
              ref={inputImagem}
              id="enc-imagem"
              name="imagem"
              type="file"
              accept={IMAGEM_TIPOS.join(",")}
              className="sr-only"
              onChange={(e) => escolherImagem(e.target.files?.[0])}
            />
          </label>
        )}
        {erro("imagem")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="enc-consentimento" className="flex cursor-pointer items-start gap-3 text-[15px]">
          <input id="enc-consentimento" name="consentimento" type="checkbox" className="mt-0.5 size-6 shrink-0 accent-ink" {...aria("consentimento")} />
          <span>Autorizo a Matilda3D a entrar em contato comigo pelo WhatsApp sobre esta encomenda.</span>
        </label>
        {erro("consentimento")}
      </div>

      <Button type="submit" size="lg" disabled={enviando} className="min-h-[52px] text-base">
        {enviando ? "Enviando…" : "Enviar encomenda"}
      </Button>
      <p className="text-center text-sm text-ink-muted">A gente responde pelo WhatsApp com o valor e o prazo. Enviar não gera nenhum compromisso.</p>
    </form>
  );
}

function Campo({
  id,
  rotulo,
  erro,
  dica,
  children,
}: {
  id: string;
  rotulo: string;
  erro: React.ReactNode;
  dica?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={`enc-${id}`} className="text-sm font-bold">
          {rotulo}
        </label>
        {dica && <span className="tabular text-xs text-ink-muted">{dica}</span>}
      </div>
      {children}
      {erro}
    </div>
  );
}
