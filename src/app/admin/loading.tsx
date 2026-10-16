import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto exibido enquanto uma tela do painel carrega os dados
// (a moldura com menu e cabeçalho continua visível).
export default function CarregandoTela() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-24 w-full rounded-card" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-24 rounded-card" />
      </div>
    </div>
  );
}
