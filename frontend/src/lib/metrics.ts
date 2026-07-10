import type { Metric, MetricDef } from "./types";

const _METRICS: MetricDef[] = [
  { key: "median_income", label: "Income", labelEs: "Ingreso", desc: "Median household income", descEs: "Ingreso medio por hogar", symbol: "💰", direction: "asc", tip: "Higher income cities tend to have better-funded schools, services, and amenities", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`, colors: [[60000,"#e2e8f0"],[80000,"#93c5fd"],[100000,"#3b82f6"],[130000,"#1d4ed8"]] },
  { key: "population", label: "Population", labelEs: "Población", desc: "Total residents", descEs: "Residentes totales", symbol: "👥", direction: "asc", tip: "Larger cities have more diverse services but also more infrastructure demand", format: (v) => v.toLocaleString(), legendFmt: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`, colors: [[10000,"#e2e8f0"],[50000,"#93c5fd"],[100000,"#3b82f6"],[200000,"#1d4ed8"]] },
  { key: "median_home", label: "Homes", labelEs: "Vivienda", desc: "Median home value", descEs: "Valor medio de vivienda", symbol: "🏠", direction: "asc", tip: "Home values reflect neighborhood desirability, school quality, and investment potential", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`, colors: [[600000,"#e2e8f0"],[800000,"#93c5fd"],[1000000,"#3b82f6"],[1500000,"#1d4ed8"]] },
  { key: "uninsured_pct", label: "Uninsured", labelEs: "Sin Seguro", desc: "% without health insurance", descEs: "% sin seguro médico", symbol: "🏥", direction: "desc", tip: "Lower is better — uninsured residents face higher medical debt and delayed care", format: (v) => `${v.toFixed(1)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[3,"#dcfce7"],[6,"#86efac"],[9,"#fb923c"],[14,"#ef4444"]] },
  { key: "poverty_pct", label: "Poverty", labelEs: "Pobreza", desc: "% below poverty line", descEs: "% bajo línea de pobreza", symbol: "🧩", direction: "desc", tip: "Lower is better — correlates with crime rates, health outcomes, and school performance", format: (v) => `${v.toFixed(1)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[5,"#dcfce7"],[8,"#86efac"],[12,"#fb923c"],[16,"#ef4444"]] },
  { key: "median_rent", label: "Rent", labelEs: "Alquiler", desc: "Median gross rent", descEs: "Alquiler medio bruto", symbol: "🏢", direction: "asc", tip: "Rent levels indicate cost of living — useful for budgeting housing expenses", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`, colors: [[1800,"#e2e8f0"],[2100,"#93c5fd"],[2400,"#3b82f6"],[2800,"#1d4ed8"]] },
  { key: "edu_pct", label: "Education", labelEs: "Educación", desc: "% with bachelor's degree+", descEs: "% con título universitario", symbol: "🎓", direction: "asc", tip: "Higher education levels link to higher earnings, civic engagement, and economic mobility", format: (v) => `${v.toFixed(0)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[20,"#e2e8f0"],[35,"#93c5fd"],[50,"#3b82f6"],[65,"#1d4ed8"]] },
];

/** Ordered list for UI iteration (metric pills, panels). */
export const METRICS: readonly MetricDef[] = _METRICS;

/** O(1) lookup by metric key. */
const METRICS_BY_KEY: Record<Metric, MetricDef> = Object.fromEntries(
  _METRICS.map((m) => [m.key, m])
) as Record<Metric, MetricDef>;

export function getColor(value: number, stops: [number, string][]): string {
  for (let i = stops.length - 1; i >= 0; i--) if (value >= stops[i][0]) return stops[i][1];
  return stops[0][1];
}

export function getMetric(key: Metric): MetricDef {
  return METRICS_BY_KEY[key];
}
