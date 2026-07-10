"use client";
import type { CityData, Metric } from "@/lib/types";
import { getMetric } from "@/lib/metrics";

interface Props {
  selected: CityData[];
  all: CityData[];
  metric: Metric;
  isEn: boolean;
}

const SELECTION_COLORS = ["#6366f1", "#f59e0b", "#10b981"];

export default function ComparisonBar({ selected, all, metric, isEn }: Props) {
  if (all.length === 0 || selected.length === 0) return null;

  const values = all
    .map((c) => c[metric])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const range = max - min || 1;
  const avgPct = ((avg - min) / range) * 100;
  const m = getMetric(metric);

  const isMulti = selected.length > 1;
  const barHeight = isMulti ? "h-1.5" : "h-3";

  return (
    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 space-y-2.5">
      <p className="text-[11px] font-medium text-slate-400">
        {isEn ? "Compared to OC Average" : "Comparado con Promedio OC"}
      </p>
      <div className={`relative ${barHeight} bg-slate-200 rounded-full overflow-hidden mt-1 mb-3`}>
        <div
          className="absolute top-0 w-0.5 h-full bg-slate-400 z-20"
          style={{ left: `${avgPct}%` }}
        />
        <span
          className="absolute -top-5 text-[9px] font-medium text-slate-400 whitespace-nowrap"
          style={{ left: `${avgPct}%`, transform: "translateX(-50%)" }}
        >
          {isEn ? "OC Avg" : "Prom OC"}
        </span>

        {selected.map((city, idx) => {
          const val = city[metric];
          const pct = ((val - min) / range) * 100;
          const color = SELECTION_COLORS[idx] ?? SELECTION_COLORS[0];

          if (isMulti) {
            return (
              <div
                key={city.name}
                className="absolute top-0 h-full rounded-full"
                style={{
                  left: `${Math.max(pct - 1, 0)}%`,
                  width: `${Math.max(pct, 2)}%`,
                  backgroundColor: color,
                  opacity: 0.85,
                }}
              />
            );
          }

          return (
            <div
              key={city.name}
              className={`h-full rounded-full transition-all duration-500 ${val > avg ? "bg-indigo-500" : "bg-orange-400"}`}
              style={{ width: `${Math.max(pct, 2)}%` }}
            />
          );
        })}
      </div>

      {isMulti ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {selected.map((city, idx) => {
            const val = city[metric];
            const color = SELECTION_COLORS[idx] ?? SELECTION_COLORS[0];
            return (
              <span
                key={city.name}
                className="inline-flex items-center gap-1 text-[10px] font-medium"
              >
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600">{city.name}</span>
                <span className="text-slate-400">{m.format(val)}</span>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="flex justify-between text-[10px] text-slate-400">
          <span className="min-w-0 break-all">{m.format(min)}</span>
          <span
            className={`shrink-0 text-center font-semibold ${selected[0][metric] > avg ? "text-indigo-500" : "text-orange-500"}`}
          >
            {selected[0][metric] > avg ? "▲" : "▼"} {m.format(Math.round(avg))}
          </span>
          <span className="min-w-0 break-all text-right">{m.format(max)}</span>
        </div>
      )}
    </div>
  );
}
