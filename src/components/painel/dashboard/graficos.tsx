"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { LinhaMensal } from "@/lib/dashboard";
import { formatarMoeda } from "@/lib/format";

// Cores dos gráficos (validadas com o validador de paleta da skill dataviz:
// par entradas/saídas passa no teste de daltonismo; ver docs/02, "Gráficos").
const COR = {
  entradas: "#1F7A47",
  saidas: "#C2410C",
  saldo: "#1E1B33",
  grade: "#ECE9F3",
  texto: "#4A4660",
  superficie: "#FFFFFF",
};

const compacto = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const eixoReais = (centavos: number) => (centavos === 0 ? "0" : compacto.format(centavos / 100));

function Dica({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-bold capitalize">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-muted">{p.name}:</span>
          <span className="tabular font-bold">{formatarMoeda(Number(p.value))}</span>
        </p>
      ))}
    </div>
  );
}

function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-4 text-sm text-ink-muted" aria-hidden="true">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-sm" style={{ background: i.cor }} />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

const eixo = { stroke: COR.grade, tick: { fill: COR.texto, fontSize: 12 }, tickLine: false } as const;

/** Barras agrupadas: entradas × saídas por mês. */
export function GraficoEntradasSaidas({ meses }: { meses: LinhaMensal[] }) {
  return (
    <figure className="flex flex-col gap-3">
      <Legenda itens={[{ cor: COR.entradas, rotulo: "Entradas" }, { cor: COR.saidas, rotulo: "Saídas" }]} />
      <div className="h-64 w-full" role="img" aria-label="Gráfico de barras com entradas e saídas dos últimos 6 meses. Valores na tabela abaixo.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={meses} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke={COR.grade} />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis tickFormatter={eixoReais} {...eixo} axisLine={false} width={44} />
            <Tooltip content={Dica} cursor={{ fill: "#F6F4FB" }} />
            <Bar dataKey="entradasCentavos" name="Entradas" fill={COR.entradas} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            <Bar dataKey="saidasCentavos" name="Saídas" fill={COR.saidas} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <TabelaMeses
        meses={meses}
        colunas={[
          { rotulo: "Entradas", valor: (m) => m.entradasCentavos },
          { rotulo: "Saídas", valor: (m) => m.saidasCentavos },
          { rotulo: "Resultado", valor: (m) => m.resultadoCentavos },
        ]}
      />
    </figure>
  );
}

/** Linha (com área suave): saldo em caixa no fim de cada mês. */
export function GraficoSaldo({ meses }: { meses: LinhaMensal[] }) {
  const ultimo = meses.at(-1);
  return (
    <figure className="flex flex-col gap-3">
      {ultimo && (
        <p className="text-sm text-ink-muted">
          Agora: <span className="tabular font-bold text-ink">{formatarMoeda(ultimo.saldoCentavos)}</span>
        </p>
      )}
      <div className="h-64 w-full" role="img" aria-label="Gráfico de linha com o saldo em caixa nos últimos 6 meses. Valores na tabela abaixo.">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={meses} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="lavagem-saldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COR.saldo} stopOpacity={0.1} />
                <stop offset="100%" stopColor={COR.saldo} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COR.grade} />
            <XAxis dataKey="rotulo" {...eixo} />
            <YAxis tickFormatter={eixoReais} {...eixo} axisLine={false} width={44} />
            <Tooltip content={Dica} cursor={{ stroke: COR.grade, strokeWidth: 1 }} />
            <Area
              type="linear"
              dataKey="saldoCentavos"
              name="Saldo"
              stroke={COR.saldo}
              strokeWidth={2}
              fill="url(#lavagem-saldo)"
              // Só o ponto do mês atual ganha marcador (8px, anel de 2px na cor do fundo).
              dot={({ cx, cy, index }) =>
                index === meses.length - 1 ? (
                  <circle key="fim" cx={cx} cy={cy} r={4} fill={COR.saldo} stroke={COR.superficie} strokeWidth={2} />
                ) : (
                  <g key={index} />
                )
              }
              isAnimationActive={false}
              activeDot={{ r: 5, fill: COR.saldo, stroke: COR.superficie, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TabelaMeses meses={meses} colunas={[{ rotulo: "Saldo no fim do mês", valor: (m) => m.saldoCentavos }]} />
    </figure>
  );
}

/** Tabela equivalente ao gráfico (acessibilidade: o gráfico nunca é a única forma de ler um valor). */
function TabelaMeses({
  meses,
  colunas,
}: {
  meses: LinhaMensal[];
  colunas: { rotulo: string; valor: (m: LinhaMensal) => number }[];
}) {
  return (
    <details className="group text-sm">
      <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium text-brand-strong">Ver em tabela</summary>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="text-left text-ink-muted">
            <tr>
              <th scope="col" className="py-1 pr-3 font-medium">Mês</th>
              {colunas.map((c) => (
                <th key={c.rotulo} scope="col" className="py-1 pr-3 text-right font-medium">
                  {c.rotulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.mes} className="border-t border-border">
                <th scope="row" className="py-1 pr-3 text-left font-medium capitalize">{m.rotulo}</th>
                {colunas.map((c) => (
                  <td key={c.rotulo} className="tabular py-1 pr-3 text-right">
                    {formatarMoeda(c.valor(m))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
