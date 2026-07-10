export interface CityData extends Record<Metric, number> {
  name: string;
  population: number;
  median_income: number;
  median_home: number;
  uninsured_pct: number;
  poverty_pct: number;
  median_rent: number;
  edu_pct: number;
}

export type Metric =
  | "median_income"
  | "population"
  | "median_home"
  | "uninsured_pct"
  | "poverty_pct"
  | "median_rent"
  | "edu_pct";

export interface MetricDef {
  key: Metric;
  label: string;
  labelEs: string;
  desc: string;
  descEs: string;
  symbol: string;
  direction: "asc" | "desc";
  tip: string;
  format: (v: number) => string;
  legendFmt: (v: number) => string;
  colors: [number, string][];
}

export interface GeoJsonFeature {
  type: "Feature";
  properties: CityData;
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface GeoJsonData {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}
