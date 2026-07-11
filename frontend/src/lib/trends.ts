import type { CityData, Metric } from "./types";

const YEARS = [2019, 2020, 2021, 2022, 2023] as const;
export type TrendYear = (typeof YEARS)[number];

export interface TrendPoint {
  year: TrendYear;
  value: number;
}

/**
 * Generates synthetic 5-year trend data from the current city value.
 * Applies a directed random walk — most metrics trend slightly upward (income, homes, rent, education, population)
 * while negative metrics trend slightly downward (uninsured, poverty).
 * Structure is identical to what real historical ACS data would look like,
 * making it trivial to swap in real data later.
 */
export function generateTrend(currentValue: number, metric: Metric): TrendPoint[] {
  // Direction: most things improve over time (income up, poverty down)
  const upward = !["uninsured_pct", "poverty_pct"].includes(metric);
  // Random walk with slight drift toward current value from a starting point
  const drift = upward ? 1.015 : 0.985; // ~1.5% per year drift
  const noise = () => 1 + (Math.random() - 0.5) * 0.04; // ±2% noise

  // Work backwards from current (2023) to 2019
  const points: TrendPoint[] = [{ year: 2023, value: currentValue }];

  let val = currentValue;
  for (let i = YEARS.length - 2; i >= 0; i--) {
    val = Math.round((val / drift) * noise());
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
