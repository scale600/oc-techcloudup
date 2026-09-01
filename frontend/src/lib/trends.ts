import type { CityData, Metric } from "./types";

const YEARS = [2019, 2020, 2021, 2022, 2023] as const;
export type TrendYear = (typeof YEARS)[number];

export interface TrendPoint {
  year: TrendYear;
  value: number;
}

/**
 * Generates a deterministic, clearly-estimated 5-year trend from the current
 * (ACS 2023) value. No randomness — the same input always produces the same
 * series, so the chart is stable across re-renders and metric switches.
 *
 * IMPORTANT: these are *estimates* projected backward from the single 2023
 * value, NOT real historical ACS data. The TrendChart labels them as such.
 */
export function generateTrend(currentValue: number, metric: Metric): TrendPoint[] {
  // Direction: most things improve over time (income up, poverty down)
  const upward = !["uninsured_pct", "poverty_pct"].includes(metric);
  const drift = upward ? 1.015 : 0.985; // ~1.5% per year backward projection

  // Work backwards from current (2023) to 2019
  const points: TrendPoint[] = [{ year: 2023, value: currentValue }];

  let val = currentValue;
  for (let i = YEARS.length - 2; i >= 0; i--) {
    val = Math.round(val / drift);
    points.unshift({ year: YEARS[i], value: Math.max(val, 0) });
  }

  return points;
}

export function generateOCTrend(all: CityData[], metric: Metric): TrendPoint[] {
  const currentAvg = Math.round(all.reduce((s, c) => s + c[metric], 0) / all.length);
  return generateTrend(currentAvg, metric);
}

export function getTrendForCity(city: CityData, metric: Metric): TrendPoint[] {
  return generateTrend(city[metric], metric);
}

export { YEARS };
