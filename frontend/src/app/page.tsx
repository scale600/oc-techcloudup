"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), { ssr: false });

interface CityData { name: string; population: number; median_income: number; median_home: number; }
type Metric = "median_income" | "population" | "median_home";

const METRICS: { key: Metric; label: string; labelEs: string; symbol: string; format: (v: number) => string; legendFmt: (v: number) => string; colors: [number, string][] }[] = [
  { key: "median_income", label: "Income", labelEs: "Ingreso", symbol: "💰", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`, colors: [[60000,"#e5f5e0"],[80000,"#a1d99b"],[100000,"#41ab5d"],[130000,"#006d2c"]] },
  { key: "population", label: "Population", labelEs: "Población", symbol: "👥", format: (v) => v.toLocaleString(), legendFmt: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`, colors: [[10000,"#eff3ff"],[50000,"#bdd7e7"],[100000,"#6baed6"],[200000,"#2171b5"]] },
  { key: "median_home", label: "Homes", labelEs: "Vivienda", symbol: "🏠", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`, colors: [[600000,"#fee5d9"],[800000,"#fcae91"],[1000000,"#fb6a4a"],[1500000,"#cb181d"]] },
];

function getColor(value: number, stops: [number, string][]) {
  for (let i = stops.length - 1; i >= 0; i--) if (value >= stops[i][0]) return stops[i][1];
  return stops[0][1];
}

export default function MapPage() {
  const { lang } = useLang();
  const isEn = lang === "en";
  const [data, setData] = useState<CityData[]>([]);
  const [metric, setMetric] = useState<Metric>("median_income");
  const [selected, setSelected] = useState<CityData | null>(null);
  const [geoData, setGeoData] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/oc-cities.json").then((r) => r.json()).then((d) => {
      setGeoData(d);
      setData(d.features.map((f: any) => f.properties));
    });
    setMounted(true);
  }, []);

  const selectCity = useCallback((city: CityData) => {
    setSelected(city);
    setMobileOpen(true);
  }, []);

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  function onEachFeature(feature: any, layer: any) {
    const props = feature.properties;
    layer.on({ click: () => selectCity(props) });

    // Permanent faint city name label
    layer.bindTooltip(props.name, {
      permanent: true, direction: "center",
      className: "city-label",
    });

    // Hover: show metric tooltip
    layer.on("mouseover", function (e: any) {
      const l = e.target;
      l._hoverTooltip = (window as any).L.tooltip({
        permanent: false, direction: "top",
        className: "metric-tooltip",
        opacity: 0.95,
      }).setContent(`<b>${props.name}</b><br/>${currentMetric.symbol} ${currentMetric.format(props[metric])}`);
      l._hoverTooltip.setLatLng(l.getBounds().getCenter());
      l._hoverTooltip.addTo(l._map);
    });
    layer.on("mouseout", function (e: any) {
      if (e.target._hoverTooltip) {
        e.target._hoverTooltip.remove();
        e.target._hoverTooltip = null;
      }
    });
  }

  function geoStyle(feature: any) {
    return {
      fillColor: getColor(feature.properties[metric], currentMetric.colors),
      weight: selected && feature.properties.name === selected.name ? 3 : 1,
      color: selected && feature.properties.name === selected.name ? "#1d4ed8" : "#fff",
      fillOpacity: 0.8,
    };
  }

  const m = currentMetric;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100dvh-3rem)]">
      {/* Map area */}
      <div className="flex-1 relative min-h-0">
        {mounted && (
          <MapContainer center={[33.68, -117.82]} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={true} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {geoData && <GeoJSON data={geoData} style={geoStyle} onEachFeature={onEachFeature} />}
          </MapContainer>
        )}

        {/* Metric selector — compact mobile pill bar */}
        <div className="absolute top-2 left-2 right-2 sm:left-3 sm:right-auto z-[1000]">
          <div className="flex gap-1 bg-white/90 backdrop-blur rounded-xl shadow-lg p-1.5 overflow-x-auto">
            {METRICS.map((x) => (
              <button key={x.key} onClick={() => setMetric(x.key)}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  metric === x.key ? "bg-blue-600 text-white shadow" : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
                }`}>
                <span className="hidden sm:inline mr-1">{x.symbol}</span>
                {isEn ? x.label : x.labelEs}
              </button>
            ))}
          </div>
        </div>

        {/* Legend — hide on mobile when panel open */}
        <div className={`absolute bottom-3 left-2 sm:left-3 z-[1000] bg-white/90 backdrop-blur rounded-xl shadow-lg p-2.5 text-xs transition-opacity ${mobileOpen ? "opacity-0 sm:opacity-100" : "opacity-100"}`}>
          <p className="font-semibold mb-1.5 text-gray-700 text-[11px]">{isEn ? m.label : m.labelEs}</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">{isEn ? "Lo" : "Ba"}</span>
            {m.colors.map(([val, color]) => (
              <div key={val} className="flex flex-col items-center gap-0.5">
                <div className="w-5 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[9px] leading-none text-gray-500 whitespace-nowrap">{m.legendFmt(val)}</span>
              </div>
            ))}
            <span className="text-[10px] text-gray-400">{isEn ? "Hi" : "Al"}</span>
          </div>
        </div>

        {/* Data source badge */}
        <div className="absolute bottom-3 right-2 sm:right-3 z-[1000]">
          <span className="text-[10px] text-gray-400 bg-white/80 backdrop-blur rounded-lg px-2 py-1">
            {isEn ? "Source: U.S. Census Bureau ACS 2023" : "Fuente: Censo de EE. UU. ACS 2023"}
          </span>
        </div>
      </div>

      {/* Sidebar: desktop = fixed panel, mobile = bottom sheet */}
      {selected && (
        <>
          {/* Desktop sidebar */}
          <div className="hidden lg:flex w-80 bg-white border-l overflow-y-auto flex-col">
            <CityPanel selected={selected} all={data} metric={metric} isEn={isEn} onClose={() => setSelected(null)} />
          </div>

          {/* Mobile bottom sheet */}
          <div className={`lg:hidden fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-y-0" : "translate-y-full"}`}
            style={{ maxHeight: "70dvh" }}>
            <div className="sticky top-0 bg-white rounded-t-2xl pt-2 pb-1 border-b">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
              <button onClick={() => { setSelected(null); setMobileOpen(false); }}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">&times;</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70dvh - 3rem)" }}>
              <CityPanel selected={selected} all={data} metric={metric} isEn={isEn} onClose={() => { setSelected(null); setMobileOpen(false); }} />
            </div>
          </div>
        </>
      )}

      {/* Mobile: floating "tap a city" hint */}
      {!selected && (
        <div className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900/80 text-white text-sm px-4 py-2 rounded-full pointer-events-none">
          {isEn ? "👆 Tap a city to see details" : "👆 Toca una ciudad para detalles"}
        </div>
      )}
    </div>
  );
}

function CityPanel({ selected, all, metric, isEn, onClose }: { selected: CityData; all: CityData[]; metric: Metric; isEn: boolean; onClose: () => void }) {
  const m = METRICS.find((x) => x.key === metric)!;
  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
        <button onClick={onClose} className="hidden lg:block text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { k: "median_income", emoji: "💰", labelEn: "Income", labelEs: "Ingreso" },
          { k: "population", emoji: "👥", labelEn: "Population", labelEs: "Población" },
          { k: "median_home", emoji: "🏠", labelEn: "Homes", labelEs: "Vivienda" },
        ].map((item) => {
          const val = selected[item.k as keyof CityData] as number;
          const fmt = METRICS.find((x) => x.key === item.k)!.format(val * (item.k === "median_income" || item.k === "median_home" ? 1 : 1));
          // Fix format: use raw value
          const rawFmt = item.k === "median_income" || item.k === "median_home"
            ? `$${val.toLocaleString()}`
            : val.toLocaleString();
          return (
            <div key={item.k} className={`bg-gray-50 rounded-xl p-2.5 sm:p-3 ${item.k === metric ? "ring-2 ring-blue-300" : ""}`}>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">{isEn ? item.labelEn : item.labelEs}</p>
              <p className="text-sm sm:text-base font-bold text-gray-900">{item.emoji} {rawFmt}</p>
            </div>
          );
        })}
      </div>

      <ComparisonBar selected={selected} all={all} metric={metric} isEn={isEn} />

      {/* Nearby cities ranking */}
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2">
        <p className="text-xs text-gray-500 font-medium">{isEn ? "OC Rankings" : "Ranking OC"}</p>
        {all
          .filter((c) => c.name !== selected.name)
          .sort((a, b) => (b[metric] as number) - (a[metric] as number))
          .slice(0, 5)
          .map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <span className="text-gray-500">#{i + 1}</span>
              <span className="flex-1 ml-2 text-gray-700">{c.name}</span>
              <span className="font-medium text-gray-900">{m.format((c[metric] as number))}</span>
            </div>
          ))}
      </div>
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
  const m = METRICS.find((x) => x.key === metric)!;

  return (
    <div className="bg-gray-50 rounded-xl p-3 sm:p-4 space-y-2">
      <p className="text-xs text-gray-500 font-medium">{isEn ? "Compared to OC Average" : "Comparado con Promedio OC"}</p>
      <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-400" style={{ left: `${((avg - min) / (max - min || 1)) * 100}%` }} />
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] sm:text-xs text-gray-400">
        <span>{m.format(min)}</span>
        <span className={val > avg ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
          {val > avg ? "▲" : "▼"} {isEn ? "vs avg" : "vs prom"} {m.format(Math.round(avg))}
        </span>
        <span>{m.format(max)}</span>
      </div>
    </div>
  );
}
