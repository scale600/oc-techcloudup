"use client";
import type { CityData, Metric, MetricDef } from "@/lib/types";
import { getMetric } from "@/lib/metrics";
import ComparisonBar from "./ComparisonBar";

interface Props {
  selected: CityData[];
  all: CityData[];
  metric: Metric;
  isEn: boolean;
  onClose: () => void;
}

const CITY_METRIC_ITEMS: { k: Metric; emoji: string; labelEn: string; labelEs: string }[] = [
  { k: "median_income", emoji: "💰", labelEn: "Income", labelEs: "Ingreso" },
  { k: "population", emoji: "👥", labelEn: "Population", labelEs: "Población" },
  { k: "median_home", emoji: "🏠", labelEn: "Homes", labelEs: "Vivienda" },
  { k: "uninsured_pct", emoji: "🏥", labelEn: "Uninsured", labelEs: "Sin Seguro" },
  { k: "poverty_pct", emoji: "🧩", labelEn: "Poverty", labelEs: "Pobreza" },
  { k: "median_rent", emoji: "🏢", labelEn: "Rent", labelEs: "Alquiler" },
  { k: "edu_pct", emoji: "🎓", labelEn: "Education", labelEs: "Educación" },
];

const SELECTION_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

function getRank(city: CityData, all: CityData[], metric: Metric): number {
  return all.filter((c) => c[metric] > city[metric]).length + 1;
}

function getBestCityForMetric(cities: CityData[], metricKey: Metric, def: MetricDef): string | null {
  if (cities.length < 2) return null;
  const sorted = [...cities].sort((a, b) =>
    def.direction === "desc" ? a[metricKey] - b[metricKey] : b[metricKey] - a[metricKey]
  );
  return sorted[0].name;
}

export default function CityPanel({ selected, all, metric, isEn, onClose }: Props) {
  const m = getMetric(metric);
  const total = all.length;

  // Single city mode — keep original layout
  if (selected.length === 1) {
    const city = selected[0];
    const rank = getRank(city, all, metric);

    return (
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">{city.name}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Orange County, California ·{" "}
              <span className="text-indigo-500 font-medium">
                #{rank} of {total}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="hidden lg:block text-slate-300 hover:text-slate-500 text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CITY_METRIC_ITEMS.map((item) => {
            const val = city[item.k];
            const metricDef = getMetric(item.k);
            const isActive = item.k === metric;
            return (
              <div
                key={item.k}
                className={`rounded-xl p-2.5 sm:p-3 transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 ring-1 ring-indigo-200 shadow-sm"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-1">
                  {isEn ? item.labelEn : item.labelEs}
                </p>
                <p className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-tight">
                  {item.emoji} {metricDef.format(val)}
                </p>
              </div>
            );
          })}
        </div>

        <ComparisonBar selected={selected} all={all} metric={metric} isEn={isEn} />

        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isEn ? "OC Rankings" : "Ranking OC"}
          </p>
          {all
            .filter((c) => c.name !== city.name)
            .sort((a, b) => b[metric] - a[metric])
            .slice(0, 5)
            .map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-[13px] py-1">
                <span className="text-slate-300 font-mono w-5 text-right tabular-nums">
                  #{i + 1}
                </span>
                <span className="flex-1 ml-3 text-slate-600 truncate">{c.name}</span>
                <span className="font-medium text-slate-800 ml-2">
                  {m.format(c[metric])}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Multi-city comparison mode
  const names = selected.map((c) => c.name).join(` ${isEn ? "vs" : "vs"} `);

  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {isEn ? "Comparing" : "Comparando"}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">{names}</p>
        </div>
        <button
          onClick={onClose}
          className="hidden lg:block text-slate-300 hover:text-slate-500 text-xl leading-none transition-colors"
        >
          &times;
        </button>
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 pr-2 font-medium text-slate-400" />
              {selected.map((city, idx) => (
                <th
                  key={city.name}
                  className="text-right py-2 px-2 font-semibold whitespace-nowrap"
                  style={{ color: SELECTION_COLORS[idx] ?? SELECTION_COLORS[0] }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1 align-middle"
                    style={{ backgroundColor: SELECTION_COLORS[idx] ?? SELECTION_COLORS[0] }}
                  />
                  {city.name}
                </th>
              ))}
              <th className="text-right py-2 px-2 font-medium text-slate-400 whitespace-nowrap">
                {isEn ? "OC Avg" : "Prom OC"}
              </th>
            </tr>
          </thead>
          <tbody>
            {CITY_METRIC_ITEMS.map((item) => {
              const metricDef = getMetric(item.k);
              const bestName = getBestCityForMetric(selected, item.k, metricDef);
              const isActive = item.k === metric;
              const itemAvg = Math.round(all.reduce((s, c) => s + c[item.k], 0) / all.length);
              return (
                <tr
                  key={item.k}
                  className={`border-b border-slate-100 ${
                    isActive ? "bg-indigo-50/50" : ""
                  }`}
                >
                  <td className="py-2 pr-2 whitespace-nowrap">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.emoji} {isEn ? item.labelEn : item.labelEs}
                    </span>
                  </td>
                  {selected.map((city) => {
                    const rank = getRank(city, all, item.k);
                    const isBest = city.name === bestName;
                    return (
                      <td
                        key={city.name}
                        className={`text-right py-2 px-2 font-medium tabular-nums whitespace-nowrap ${
                          isBest ? "text-emerald-600" : "text-slate-700"
                        }`}
                      >
                        {metricDef.format(city[item.k])}
                        <span className="text-[10px] text-slate-400 ml-1 font-normal">
                          #{rank}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-right py-2 px-2 text-slate-400 tabular-nums whitespace-nowrap">
                    {metricDef.format(itemAvg)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ComparisonBar selected={selected} all={all} metric={metric} isEn={isEn} />

      {/* Remove chip for each city */}
      <div className="flex flex-wrap gap-1.5">
        {selected.map((city, idx) => (
          <span
            key={city.name}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-white"
            style={{ backgroundColor: SELECTION_COLORS[idx] ?? SELECTION_COLORS[0] }}
          >
            {city.name}
          </span>
        ))}
        <span className="text-[10px] text-slate-400 self-center ml-1">
          {isEn ? "Shift+Click to add/remove" : "Shift+Click para agregar/quitar"}
        </span>
      </div>
    </div>
  );
}
