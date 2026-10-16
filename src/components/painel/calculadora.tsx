"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InputMoeda } from "@/components/formulario/input-moeda";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularPreco, type ResultadoCalculadora } from "@/lib/calculadora";
import { centavosParaTexto, formatarMoeda, formatarPercentual, paraCentavos } from "@/lib/format";
import type { PadroesCalculadora } from "@/server/produtos";

export type ResultadoParaProduto = ResultadoCalculadora & { gramas: number; minutos: number };

type Props = {
  padroes: PadroesCalculadora;
  inicial?: { gramas?: number | null; minutos?: number | null };
  /** Dentro do formulário de produto: devolve custo e preço para os campos. */
  aoUsar?: (r: ResultadoParaProduto) => void;
};

const numero = (t: string) => {
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const textoNumero = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function Calculadora({ padroes, inicial, aoUsar }: Props) {
  const minutosIniciais = inicial?.minutos ?? 0;
  const [v, setV] = useState({
    gramas: textoNumero(inicial?.gramas),
    horas: minutosIniciais ? String(Math.floor(minutosIniciais / 60)) : "",
    minutos: minutosIniciais ? String(minutosIniciais % 60) : "",
    precoKg: centavosParaTexto(padroes.precoKgFilamentoCentavos),
    energia: centavosParaTexto(padroes.custoEnergiaHoraCentavos),
    desgaste: centavosParaTexto(padroes.desgasteHoraCentavos),
    embalagem: centavosParaTexto(padroes.embalagemCentavos),
    falhas: textoNumero(padroes.taxaFalhasPct),
    margem: textoNumero(padroes.margemPct),
  });
  const mudar = (campo: keyof typeof v) => (texto: string) => setV((a) => ({ ...a, [campo]: texto }));

  const minutosTotais = Math.round(numero(v.horas)) * 60 + Math.round(numero(v.minutos));
  const r = useMemo(
    () =>
      calcularPreco({
        gramas: numero(v.gramas),
        precoKgFilamentoCentavos: paraCentavos(v.precoKg) ?? 0,
        minutosImpressao: minutosTotais,
        custoEnergiaHoraCentavos: paraCentavos(v.energia) ?? 0,
        desgasteHoraCentavos: paraCentavos(v.desgaste) ?? 0,
        embalagemCentavos: paraCentavos(v.embalagem) ?? 0,
        taxaFalhasPct: numero(v.falhas),
        margemPct: numero(v.margem),
      }),
    [v, minutosTotais],
  );

  const linhas: { rotulo: string; valor: string; explicacao: string; destaque?: boolean }[] = [
    {
      rotulo: "Custo do material",
      valor: formatarMoeda(r.custoMaterialCentavos),
      explicacao: "O filamento gasto: gramas × preço do quilo ÷ 1000.",
    },
    {
      rotulo: "Custo de máquina",
      valor: formatarMoeda(r.custoMaquinaCentavos),
      explicacao: "Energia elétrica e desgaste da impressora durante as horas de impressão.",
    },
    {
      rotulo: "Custo com perdas",
      valor: formatarMoeda(r.custoComPerdasCentavos),
      explicacao:
        "Algumas impressões dão errado, então a gente reserva um pouco para cobrir o filamento perdido.",
    },
    {
      rotulo: "Custo total",
      valor: formatarMoeda(r.custoTotalCentavos),
      explicacao: "Tudo o que a peça custa para ficar pronta, já com a embalagem.",
    },
    {
      rotulo: "Preço sugerido",
      valor: formatarMoeda(r.precoSugeridoCentavos),
      explicacao: "Custo total + a margem que vocês escolheram, arredondado para cima até os próximos 50 centavos.",
      destaque: true,
    },
    {
      rotulo: "Lucro por peça",
      valor: formatarMoeda(r.lucroPorPecaCentavos),
      explicacao: "O que sobra para o negócio em cada peça vendida.",
    },
    {
      rotulo: "Margem real",
      valor: formatarPercentual(r.margemReal),
      explicacao: "Quanto do preço é lucro. 50% quer dizer que metade do preço fica com vocês.",
    },
  ];

  const linkNovoProduto = `/admin/produtos/novo?${new URLSearchParams({
    preco: String(r.precoSugeridoCentavos),
    custo: String(r.custoTotalCentavos),
    gramas: String(numero(v.gramas)),
    minutos: String(minutosTotais),
  })}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <fieldset className="flex flex-col gap-5">
        <legend className="mb-3 text-lg font-bold">Sobre a peça</legend>
        <div className="grid grid-cols-3 gap-3">
          <CampoNumero id="calc-gramas" rotulo="Gramas" valor={v.gramas} aoMudar={mudar("gramas")} decimal />
          <CampoNumero id="calc-horas" rotulo="Horas" valor={v.horas} aoMudar={mudar("horas")} />
          <CampoNumero id="calc-minutos" rotulo="Minutos" valor={v.minutos} aoMudar={mudar("minutos")} />
        </div>

        <p className="text-sm font-bold text-ink">Custos e margem</p>
        <p className="-mt-3 text-sm text-ink-muted">
          Já vêm preenchidos com os padrões das configurações. Mude aqui só para esta conta.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <CampoDinheiro id="calc-kg" rotulo="Quilo do filamento" valor={v.precoKg} aoMudar={mudar("precoKg")} />
          <CampoDinheiro id="calc-energia" rotulo="Energia por hora" valor={v.energia} aoMudar={mudar("energia")} />
          <CampoDinheiro id="calc-desgaste" rotulo="Desgaste por hora" valor={v.desgaste} aoMudar={mudar("desgaste")} />
          <CampoDinheiro id="calc-embalagem" rotulo="Embalagem" valor={v.embalagem} aoMudar={mudar("embalagem")} />
          <CampoNumero id="calc-falhas" rotulo="Taxa de falhas (%)" valor={v.falhas} aoMudar={mudar("falhas")} decimal />
          <CampoNumero id="calc-margem" rotulo="Margem desejada (%)" valor={v.margem} aoMudar={mudar("margem")} decimal />
        </div>
      </fieldset>

      <section aria-labelledby="calc-resultado" className="flex flex-col gap-4">
        <h2 id="calc-resultado" className="text-lg font-bold">
          Passo a passo
        </h2>
        <ol className="flex flex-col gap-2" aria-live="polite">
          {linhas.map((l) => (
            <li
              key={l.rotulo}
              className={
                l.destaque
                  ? "rounded-xl border border-brand/40 bg-brand-soft p-4"
                  : "rounded-xl border border-border bg-white p-4"
              }
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-bold">{l.rotulo}</span>
                <span className={l.destaque ? "tabular text-xl font-bold text-brand-strong" : "tabular font-bold"}>
                  {l.valor}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-muted">{l.explicacao}</p>
            </li>
          ))}
        </ol>
        {aoUsar ? (
          <Button type="button" size="lg" onClick={() => aoUsar({ ...r, gramas: numero(v.gramas), minutos: minutosTotais })}>
            Usar este preço no produto
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href={linkNovoProduto}>Criar produto com este preço</Link>
          </Button>
        )}
      </section>
    </div>
  );
}

function CampoNumero({
  id,
  rotulo,
  valor,
  aoMudar,
  decimal = false,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
  decimal?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </Label>
      <Input
        id={id}
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        value={valor}
        onChange={(e) => aoMudar(e.target.value.replace(decimal ? /[^\d.,]/g : /\D/g, ""))}
        className="tabular"
      />
    </div>
  );
}

function CampoDinheiro({
  id,
  rotulo,
  valor,
  aoMudar,
}: {
  id: string;
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm font-bold">
        {rotulo}
      </Label>
      <InputMoeda id={id} value={valor} onValueChange={aoMudar} />
    </div>
  );
}
