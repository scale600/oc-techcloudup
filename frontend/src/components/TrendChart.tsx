"use client";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import type { Metric } from "@/lib/types";
import { getMetric } from "@/lib/metrics";
import { getTrendForCity, generateOCTrend, YEARS } from "@/lib/trends";
import type { CityData } from "@/lib/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface Props {
  city: CityData;
  all: CityData[];
  metric: Metric;
  isEn: boolean;
}

export default function TrendChart({ city, all, metric, isEn }: Props) {
  const m = getMetric(metric);

  const cityTrend = useMemo(() => getTrendForCity(city, metric), [city, metric]);
  const ocTrend = useMemo(() => generateOCTrend(all, metric), [all, metric]);

  const data = useMemo(() => ({
    labels: YEARS.map(String),
    datasets: [
      {
        label: city.name,
        data: cityTrend.map((p) => p.value),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2,
        pointBackgroundColor: "#6366f1",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      },
      {
        label: isEn ? "OC Average" : "Promedio OC",
        data: ocTrend.map((p) => p.value),
        borderColor: "#94a3b8",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [4, 3],
        pointBackgroundColor: "#94a3b8",
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: false,
      },
    ],
  }), [cityTrend, ocTrend, city.name, isEn]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
          font: { size: 11 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${m.format(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          font: { size: 10 },
          callback: (v: string | number) => m.legendFmt(Number(v)),
        },
      },
    },
  }), [m]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{m.symbol}</span>
        <h3 className="text-xs font-semibold text-slate-700">
          {isEn ? `5-Year Trend: ${m.label}` : `Tendencia 5 Años: ${m.labelEs}`}
        </h3>
      </div>
      <div style={{ height: 180 }}>
        <Line data={data} options={options} />
      </div>
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        {isEn
          ? "ACS 5-Year Estimates · 2019–2023"
          : "Estimaciones ACS 5 Años · 2019–2023"}
      </p>
    </div>
  );
}
