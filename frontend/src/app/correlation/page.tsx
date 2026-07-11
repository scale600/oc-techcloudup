"use client";
import { useState, useEffect, useMemo } from "react";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { METRICS, getMetric } from "@/lib/metrics";
import type { CityData, Metric, GeoJsonData } from "@/lib/types";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
  for (const p of points) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sx2 += p.x * p.x; sy2 += p.y * p.y;
  }
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const intercept = (sy - slope * sx) / n;
  const r2 = Math.pow((n * sxy - sx * sy) / Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy)), 2);
  return { slope, intercept, r2 };
}

export default function CorrelationPage() {
  const [data, setData] = useState<CityData[]>([]);
  const [xMetric, setXMetric] = useState<Metric>("median_income");
  const [yMetric, setYMetric] = useState<Metric>("edu_pct");

  useEffect(() => {
    fetch("/oc-cities.json")
      .then((r) => r.json() as Promise<GeoJsonData>)
      .then((d) => setData(d.features.map((f) => f.properties)))
      .catch(() => {});
  }, []);

  const xDef = getMetric(xMetric);
  const yDef = getMetric(yMetric);

  const points = useMemo(() =>
    data.map((c) => ({ x: c[xMetric], y: c[yMetric], name: c.name, pop: c.population })),
  [data, xMetric, yMetric]);

  const reg = useMemo(() => {
    const pts = points.map((p) => ({ x: p.x, y: p.y }));
    return linearRegression(pts);
  }, [points]);

  const maxPop = Math.max(...data.map((c) => c.population), 1);

  const xValues = points.map((p) => p.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const xPad = (xMax - xMin) * 0.05 || 1;

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: "Cities",
        data: points.map((p) => ({
          x: p.x,
          y: p.y,
          name: p.name,
          pop: p.pop,
        })),
        backgroundColor: points.map((p) => {
          const ratio = p.pop / maxPop;
          const r = Math.round(99 + (99 - 79) * (1 - ratio));
          const g = Math.round(102 + (70 - 102) * (1 - ratio));
          const b = Math.round(241 + (229 - 241) * (1 - ratio));
          return `rgba(${r},${g},${b},0.7)`;
        }),
        borderColor: "rgba(99,102,241,0.3)",
        borderWidth: 1,
        pointRadius: points.map((p) => 3 + (p.pop / maxPop) * 8),
        pointHoverRadius: points.map((p) => 6 + (p.pop / maxPop) * 10),
      },
      {
        label: `Trend (R²=${reg.r2.toFixed(2)})`,
        data: [
          { x: xMin - xPad, y: reg.slope * (xMin - xPad) + reg.intercept },
          { x: xMax + xPad, y: reg.slope * (xMax + xPad) + reg.intercept },
        ],
        showLine: true,
        borderColor: "rgba(239,68,68,0.6)",
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 0,
        backgroundColor: "transparent",
      },
    ],
  }), [points, reg, maxPop, xMin, xMax, xPad]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: { boxWidth: 12, padding: 16, font: { size: 11 }, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            const r = ctx.raw;
            if (r?.name) {
              return [`${r.name}`, `${xDef.symbol} ${xDef.format(r.x)}`, `${yDef.symbol} ${yDef.format(r.y)}`, `👥 ${r.pop?.toLocaleString()}`];
            }
            return "";
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: xDef.label, font: { size: 12, weight: "bold" as const } },
        ticks: { callback: (v: string | number) => xDef.legendFmt(Number(v)), font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        title: { display: true, text: yDef.label, font: { size: 12, weight: "bold" as const } },
        ticks: { callback: (v: string | number) => yDef.legendFmt(Number(v)), font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
    },
  }), [xDef, yDef]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-4 sm:space-y-6 flex flex-col" style={{ height: "calc(100dvh - 2.75rem)" }}>
      <header className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Metric Correlation</h1>
        <p className="text-sm text-slate-500">Explore how different metrics relate across Orange County cities. Each dot is a city — larger dots have higher population.</p>
      </header>

      {/* Axis selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">X:</span>
          <select
            value={xMetric}
            onChange={(e) => setXMetric(e.target.value as Metric)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.symbol} {m.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Y:</span>
          <select
            value={yMetric}
            onChange={(e) => setYMetric(e.target.value as Metric)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>{m.symbol} {m.label}</option>
            ))}
          </select>
        </div>
        {reg.r2 > 0 && (
          <span className="text-[11px] text-slate-400">
            R² = {reg.r2.toFixed(3)}
          </span>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-slate-200 p-4">
        {data.length > 0 ? (
          <Scatter data={chartData} options={options} style={{ height: "100%" }} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-slate-400">Loading data...</div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 text-center">
        U.S. Census Bureau · ACS 2019–2023 · {data.length} cities
      </p>
    </div>
  );
}
