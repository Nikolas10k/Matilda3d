"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ATALHOS_PERIODO } from "@/lib/periodo";
import { cn } from "@/lib/utils";

/** Atalhos de período (este mês, mês passado...) e datas personalizadas, guardados na URL. */
export function FiltroPeriodo({ atalho, de, ate }: { atalho: string; de: string; ate: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [personalizado, setPersonalizado] = useState(atalho === "personalizado");
  const [datas, setDatas] = useState({ de, ate });

  function hrefCom(mudancas: Record<string, string | null>) {
    const novos = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudancas)) {
      if (v === null) novos.delete(k);
      else novos.set(k, v);
    }
    const qs = novos.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const chip = (ativo: boolean) =>
    cn(
      "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-bold whitespace-nowrap transition-colors",
      ativo ? "border-ink bg-ink text-white" : "border-input bg-white text-ink hover:border-ink",
    );

  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Período" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        {ATALHOS_PERIODO.map((a) => (
          <Link
            key={a.valor}
            href={hrefCom({ periodo: a.valor, de: null, ate: null })}
            aria-current={!personalizado && atalho === a.valor ? "true" : undefined}
            className={chip(!personalizado && atalho === a.valor)}
            onClick={() => setPersonalizado(false)}
          >
            {a.rotulo}
          </Link>
        ))}
        <button type="button" className={chip(personalizado)} onClick={() => setPersonalizado(true)} aria-expanded={personalizado}>
          Personalizado
        </button>
      </nav>
      {personalizado && (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (datas.de && datas.ate && datas.de <= datas.ate) {
              router.push(hrefCom({ periodo: null, de: datas.de, ate: datas.ate }));
            }
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="periodo-de" className="text-sm font-bold">
              De
            </Label>
            <Input id="periodo-de" type="date" value={datas.de} onChange={(e) => setDatas((d) => ({ ...d, de: e.target.value }))} className="w-auto" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="periodo-ate" className="text-sm font-bold">
              Até
            </Label>
            <Input id="periodo-ate" type="date" value={datas.ate} onChange={(e) => setDatas((d) => ({ ...d, ate: e.target.value }))} className="w-auto" />
          </div>
          <Button type="submit" variant="outline" disabled={!datas.de || !datas.ate || datas.de > datas.ate}>
            Aplicar
          </Button>
          {datas.de > datas.ate && <p className="w-full text-sm text-danger">A data inicial precisa vir antes da final.</p>}
        </form>
      )}
    </div>
  );
}
