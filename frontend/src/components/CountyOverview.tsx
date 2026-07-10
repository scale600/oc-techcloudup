"use client";
import type { CityData, Metric } from "@/lib/types";
import { getMetric } from "@/lib/metrics";

interface Props {
  all: CityData[];
  metric: Metric;
  isEn: boolean;
}

function getTopCities(cities: CityData[], metric: Metric, count: number, ascending: boolean): CityData[] {
  return [...cities]
    .sort((a, b) => ascending ? a[metric] - b[metric] : b[metric] - a[metric])
    .slice(0, count);
}

function getOCStats(all: CityData[]) {
  const pop = all.reduce((s, c) => s + c.population, 0);
  const income = Math.round(all.reduce((s, c) => s + c.median_income, 0) / all.length);
  const home = Math.round(all.reduce((s, c) => s + c.median_home, 0) / all.length);
  return { pop, income, home };
}

function getBestValueCity(all: CityData[]): CityData | null {
  if (all.length === 0) return null;
  return [...all].sort((a, b) => {
    const ratioA = a.median_income / (a.median_home || 1);
    const ratioB = b.median_income / (b.median_home || 1);
    return ratioB - ratioA;
  })[0];
}

export default function CountyOverview({ all, metric, isEn }: Props) {
  const m = getMetric(metric);
  const stats = getOCStats(all);
  const isDesc = m.direction === "desc";
  const top3 = getTopCities(all, metric, 3, isDesc);
  const bottom3 = getTopCities(all, metric, 3, !isDesc);
  const bestValue = getBestValueCity(all);

  return (
    <div className="p-4 sm:p-5 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {isEn ? "Orange County" : "Condado de Orange"}
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {isEn ? "34 cities · ACS 2019–2023" : "34 ciudades · ACS 2019–2023"}
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: isEn ? "Population" : "Población", value: stats.pop.toLocaleString(), emoji: "👥" },
          { label: isEn ? "Avg Income" : "Ingreso Prom", value: `$${stats.income.toLocaleString()}`, emoji: "💰" },
          { label: isEn ? "Avg Home" : "Vivienda Prom", value: `$${stats.home.toLocaleString()}`, emoji: "🏠" },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-slate-400 font-medium mb-1">{stat.label}</p>
            <p className="text-[13px] font-bold text-slate-800 leading-tight">
              {stat.emoji} {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top 3 cities for current metric */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>{m.symbol}</span>
          {isEn ? `Top ${m.label}` : `Mejor ${m.labelEs}`}
        </p>
        <div className="space-y-1.5">
          {top3.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-[12px] py-1 px-2 rounded-lg bg-slate-50">
              <span className="text-slate-300 font-mono w-5 text-right tabular-nums text-[11px]">
                #{i + 1}
              </span>
              <span className="flex-1 ml-2 text-slate-600 truncate text-[12px]">{c.name}</span>
              <span className="font-semibold text-emerald-600 ml-2 text-[12px]">
                {m.format(c[metric])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom 3 cities for current metric */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>{m.symbol}</span>
          {isEn ? `Bottom ${m.label}` : `Peor ${m.labelEs}`}
        </p>
        <div className="space-y-1.5">
          {bottom3.map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-[12px] py-1 px-2 rounded-lg bg-slate-50">
              <span className="text-slate-300 font-mono w-5 text-right tabular-nums text-[11px]">
                #{all.length - i}
              </span>
              <span className="flex-1 ml-2 text-slate-600 truncate text-[12px]">{c.name}</span>
              <span className="font-semibold text-orange-500 ml-2 text-[12px]">
                {m.format(c[metric])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Best value insight */}
      {bestValue && (
        <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
          <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mb-1">
            {isEn ? "Best Value" : "Mejor Valor"}
          </p>
          <p className="text-[12px] text-indigo-700 leading-relaxed">
            {isEn ? (
              <>
                <span className="font-semibold">{bestValue.name}</span> has the highest income-to-home-price ratio — earn{" "}
                <span className="font-semibold">${bestValue.median_income.toLocaleString()}</span> with homes at{" "}
                <span className="font-semibold">${bestValue.median_home.toLocaleString()}</span>.
              </>
            ) : (
              <>
                <span className="font-semibold">{bestValue.name}</span> tiene la mejor relación ingreso-vivienda — gana{" "}
                <span className="font-semibold">${bestValue.median_income.toLocaleString()}</span> con viviendas de{" "}
                <span className="font-semibold">${bestValue.median_home.toLocaleString()}</span>.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
