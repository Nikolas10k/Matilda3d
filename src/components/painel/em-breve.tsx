import { Hammer } from "lucide-react";

/** Marcador das telas que ainda serão construídas (com a fase do docs/07). */
export function EmBreve({ titulo, fase, descricao }: { titulo: string; fase: number; descricao: string }) {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold md:text-3xl">{titulo}</h1>
      <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-white p-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-strong text-ink">
          <Hammer className="size-5" aria-hidden="true" />
        </span>
        <p className="font-bold">Em construção — chega na Fase {fase}.</p>
        <p className="text-ink-muted">{descricao}</p>
      </div>
    </section>
  );
}

/** Aviso para quem abre uma tela que o seu papel não permite. */
export function SemPermissao() {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-white p-6">
      <h1 className="text-2xl font-bold">Área só para a responsável</h1>
      <p className="text-ink-muted">
        Esta tela é exclusiva de quem tem perfil de admin. Se precisar mudar algo aqui, fale com a responsável.
      </p>
    </section>
  );
}
