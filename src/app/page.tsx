// Página provisória da Fase 0. A home real é construída na Fase 7 (docs/03).
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-brand-soft px-4 py-20 text-center">
      <span className="rounded-full border border-[#ffd3bf] bg-white px-4 py-1.5 text-sm font-bold text-brand-strong">
        Em construção
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Matilda<span className="text-brand">3D</span>
      </h1>
      <p className="max-w-md text-lg text-ink-muted">
        Ideias que saem da impressora direto pra sua mão.
      </p>
    </main>
  );
}
