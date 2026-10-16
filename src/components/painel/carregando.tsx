import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de formulário (seções em cartões) enquanto os dados chegam. */
export function FormularioCarregando() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-card" />
      ))}
    </div>
  );
}

/** Esqueleto genérico de conteúdo. */
export function ConteudoCarregando() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-24 w-full rounded-card" />
      <Skeleton className="h-24 w-full rounded-card" />
    </div>
  );
}
