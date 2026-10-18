"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { converterParaWebp, TAMANHO_MAXIMO_ORIGINAL } from "@/lib/imagem";
import { BUCKET_PRODUTOS, urlFotoProduto } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { MAX_FOTOS } from "@/lib/validacao/produto";

type Props = {
  produtoId: string;
  fotos: string[];
  aoMudar: (fotos: string[]) => void;
  erro?: string;
};

/**
 * Fotos do produto: envia direto do navegador para o Storage (já em webp e no
 * máximo 1600px), reordena arrastando (ou pelas setas) e a primeira é a capa.
 */
export function FotosProduto({ produtoId, fotos, aoMudar, erro }: Props) {
  const inputId = useId();
  // id estável: sem ele o dnd-kit gera ids diferentes no servidor e no navegador.
  const dndId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(0);
  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const vagas = MAX_FOTOS - fotos.length - enviando;

  async function enviar(arquivos: FileList | null) {
    if (!arquivos?.length) return;
    const lista = Array.from(arquivos).slice(0, Math.max(0, vagas));
    if (arquivos.length > lista.length) toast.warning(`Cada produto pode ter até ${MAX_FOTOS} fotos.`);

    const supabase = createClient();
    setEnviando((n) => n + lista.length);
    const novas: string[] = [];
    for (const arquivo of lista) {
      try {
        if (!arquivo.type.startsWith("image/")) throw new Error(`"${arquivo.name}" não é uma imagem.`);
        if (arquivo.size > TAMANHO_MAXIMO_ORIGINAL) throw new Error(`"${arquivo.name}" passa de 20 MB.`);
        const webp = await converterParaWebp(arquivo);
        const caminho = `${produtoId}/${crypto.randomUUID()}.webp`;
        const { error } = await supabase.storage
          .from(BUCKET_PRODUTOS)
          .upload(caminho, webp, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw new Error(`Não foi possível enviar "${arquivo.name}". Tente de novo.`);
        novas.push(caminho);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao enviar a foto.");
      } finally {
        setEnviando((n) => n - 1);
      }
    }
    if (novas.length) aoMudar([...fotos, ...novas]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function aoSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    aoMudar(arrayMove(fotos, fotos.indexOf(String(active.id)), fotos.indexOf(String(over.id))));
  }

  const mover = (de: number, para: number) => aoMudar(arrayMove(fotos, de, para));
  const remover = (caminho: string) => aoMudar(fotos.filter((f) => f !== caminho));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">
        Até {MAX_FOTOS} fotos. A primeira é a capa da vitrine. Arraste para mudar a ordem (no celular, segure a foto
        por um instante antes de arrastar).
      </p>
      <DndContext id={dndId} sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
        <SortableContext items={fotos} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {fotos.map((caminho, i) => (
              <FotoOrdenavel
                key={caminho}
                caminho={caminho}
                indice={i}
                total={fotos.length}
                aoMover={mover}
                aoRemover={remover}
              />
            ))}
            {Array.from({ length: enviando }, (_, i) => (
              <li
                key={`enviando-${i}`}
                className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-surface text-sm text-ink-muted"
              >
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                Enviando…
              </li>
            ))}
            {vagas > 0 && (
              <li>
                <label
                  htmlFor={inputId}
                  className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-white text-sm font-bold text-ink-muted transition hover:border-ink hover:text-ink-soft focus-within:border-ring"
                >
                  <ImagePlus className="size-7" aria-hidden="true" />
                  Adicionar fotos
                  <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => enviar(e.target.files)}
                  />
                </label>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>
      {erro && <p className="text-sm font-medium text-danger">{erro}</p>}
    </div>
  );
}

function FotoOrdenavel({
  caminho,
  indice,
  total,
  aoMover,
  aoRemover,
}: {
  caminho: string;
  indice: number;
  total: number;
  aoMover: (de: number, para: number) => void;
  aoRemover: (caminho: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: caminho });
  const capa = indice === 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white",
        capa ? "border-ink" : "border-border",
        isDragging && "z-10 shadow-lg ring-2 ring-ink",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={`Foto ${indice + 1} de ${total}${capa ? " (capa)" : ""}. Use espaço e as setas para mover.`}
        className="relative aspect-[4/3] cursor-grab touch-manipulation select-none active:cursor-grabbing"
      >
        {/* draggable=false: o "arrastar imagem" nativo do navegador cancelaria o arrastar da lista. */}
        <Image
          src={urlFotoProduto(caminho)}
          alt=""
          fill
          draggable={false}
          sizes="(min-width: 640px) 200px, 50vw"
          className="pointer-events-none object-cover"
        />
        {capa && (
          <span className="absolute top-2 left-2 rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">Capa</span>
        )}
      </div>
      <div className="flex items-center justify-between gap-1 p-1">
        <div className="flex">
          <button
            type="button"
            onClick={() => aoMover(indice, indice - 1)}
            disabled={indice === 0}
            aria-label="Mover para antes"
            className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface disabled:opacity-30"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => aoMover(indice, indice + 1)}
            disabled={indice === total - 1}
            aria-label="Mover para depois"
            className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface disabled:opacity-30"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => aoRemover(caminho)}
          aria-label="Remover foto"
          className="flex size-11 items-center justify-center rounded-lg text-danger hover:bg-danger/5"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
