"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), { ssr: false });

interface CityData {
  name: string;
  population: number;
  median_income: number;
  median_home: number;
}

type Metric = "median_income" | "population" | "median_home";

const METRICS: { key: Metric; label: string; labelEs: string; format: (v: number) => string; colors: [number, string][] }[] = [
  { key: "median_income", label: "Median Income", labelEs: "Ingreso Medio", format: (v) => `$${v.toLocaleString()}`, colors: [[60000,"#e5f5e0"],[75000,"#a1d99b"],[90000,"#41ab5d"],[110000,"#006d2c"]] },
  { key: "population", label: "Population", labelEs: "Población", format: (v) => v.toLocaleString(), colors: [[20000,"#eff3ff"],[50000,"#bdd7e7"],[100000,"#6baed6"],[200000,"#2171b5"]] },
  { key: "median_home", label: "Median Home Price", labelEs: "Precio de Vivienda", format: (v) => `$${v.toLocaleString()}`, colors: [[600000,"#fee5d9"],[800000,"#fcae91"],[1000000,"#fb6a4a"],[1400000,"#cb181d"]] },
];

function getColor(value: number, stops: [number, string][]) {
  for (let i = stops.length - 1; i >= 0; i--) {
    if (value >= stops[i][0]) return stops[i][1];
  }
  return stops[0][1];
}

export default function MapPage() {
  const { lang } = useLang();
  const isEn = lang === "en";
  const [data, setData] = useState<CityData[]>([]);
  const [metric, setMetric] = useState<Metric>("median_income");
  const [selected, setSelected] = useState<CityData | null>(null);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/oc-cities.json").then((r) => r.json()).then((d) => {
      setGeoData(d);
      setData(d.features.map((f: any) => f.properties));
    });
  }, []);

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  function onEachFeature(feature: any, layer: any) {
    const props = feature.properties;
    layer.on({ click: () => setSelected(props) });
    layer.bindTooltip(
      `<strong>${props.name}</strong><br/>${currentMetric.label}: ${currentMetric.format(props[metric])}`,
      { sticky: true, direction: "top", opacity: 0.95 }
    );
  }

  function geoStyle(feature: any) {
    return {
      fillColor: getColor(feature.properties[metric], currentMetric.colors),
      weight: 1.5,
      color: "#fff",
      fillOpacity: 0.85,
    };
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className="flex-1 relative">
        {typeof window !== "undefined" && (
          <MapContainer center={[33.68, -117.82]} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={true}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {geoData && <GeoJSON data={geoData} style={geoStyle} onEachFeature={onEachFeature} />}
          </MapContainer>
        )}
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg p-2 flex gap-1">
          {METRICS.map((m) => (
            <button key={m.key} onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${metric === m.key ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>
              {isEn ? m.label : m.labelEs}
            </button>
          ))}
        </div>
        <div className="absolute bottom-6 left-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2 text-gray-700">{isEn ? currentMetric.label : currentMetric.labelEs}</p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">{isEn ? "Low" : "Bajo"}</span>
            {currentMetric.colors.map(([val, color]) => (
              <div key={val} className="flex flex-col items-center gap-0.5">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-500">{currentMetric.format(val)}</span>
              </div>
            ))}
            <span className="text-gray-400 text-[11px]">{isEn ? "High" : "Alto"}</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="w-80 bg-white border-l overflow-y-auto p-5 space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <StatCard emoji="👥" label={isEn ? "Population" : "Población"} value={selected.population.toLocaleString()} />
            <StatCard emoji="💰" label={isEn ? "Median Income" : "Ingreso Medio"} value={`$${selected.median_income.toLocaleString()}`} />
            <StatCard emoji="🏠" label={isEn ? "Median Home" : "Vivienda Promedio"} value={`$${selected.median_home.toLocaleString()}`} />
          </div>
          <ComparisonBar selected={selected} all={data} metric={metric} isEn={isEn} />
        </div>
      )}
    </div>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{emoji} {value}</p>
    </div>
  );
}

function ComparisonBar({ selected, all, metric, isEn }: { selected: CityData; all: CityData[]; metric: Metric; isEn: boolean }) {
  if (all.length === 0) return null;
  const values = all.map((c) => c[metric]).filter((v): v is number => typeof v === "number");
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const val = selected[metric] as number;
  const pct = ((val - min) / (max - min || 1)) * 100;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <p className="text-xs text-gray-500 font-medium">{isEn ? "Compared to OC Cities" : "Comparado con otras ciudades"}</p>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>{METRICS.find((m) => m.key === metric)!.format(min)}</span>
        <span className={val > avg ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
          {val > avg ? "▲" : "▼"} {val > avg ? (isEn ? "Above avg" : "Sobre promedio") : (isEn ? "Below avg" : "Bajo promedio")}
        </span>
        <span>{METRICS.find((m) => m.key === metric)!.format(max)}</span>
      </div>
    </div>
  );
}
