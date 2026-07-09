"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/lib/i18n";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import("react-leaflet").then((m) => m.GeoJSON), { ssr: false });

interface CityData { name: string; population: number; median_income: number; median_home: number; uninsured_pct: number; poverty_pct: number; median_rent: number; edu_pct: number; }
type Metric = "median_income" | "population" | "median_home" | "uninsured_pct" | "poverty_pct" | "median_rent" | "edu_pct";

const METRICS: { key: Metric; label: string; labelEs: string; desc: string; descEs: string; symbol: string; format: (v: number) => string; legendFmt: (v: number) => string; colors: [number, string][] }[] = [
  { key: "median_income", label: "Income", labelEs: "Ingreso", desc: "Median household income", descEs: "Ingreso medio por hogar", symbol: "💰", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1000 ? `$${(v/1000).toFixed(0)}K` : `$${v}`, colors: [[60000,"#e2e8f0"],[80000,"#93c5fd"],[100000,"#3b82f6"],[130000,"#1d4ed8"]] },
  { key: "population", label: "Population", labelEs: "Población", desc: "Total residents", descEs: "Residentes totales", symbol: "👥", format: (v) => v.toLocaleString(), legendFmt: (v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : `${v}`, colors: [[10000,"#e2e8f0"],[50000,"#93c5fd"],[100000,"#3b82f6"],[200000,"#1d4ed8"]] },
  { key: "median_home", label: "Homes", labelEs: "Vivienda", desc: "Median home value", descEs: "Valor medio de vivienda", symbol: "🏠", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`, colors: [[600000,"#e2e8f0"],[800000,"#93c5fd"],[1000000,"#3b82f6"],[1500000,"#1d4ed8"]] },
  { key: "uninsured_pct", label: "Uninsured", labelEs: "Sin Seguro", desc: "% without health insurance", descEs: "% sin seguro médico", symbol: "🏥", format: (v) => `${v.toFixed(1)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[3,"#dcfce7"],[6,"#86efac"],[9,"#fb923c"],[14,"#ef4444"]] },
  { key: "poverty_pct", label: "Poverty", labelEs: "Pobreza", desc: "% below poverty line", descEs: "% bajo línea de pobreza", symbol: "🧩", format: (v) => `${v.toFixed(1)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[5,"#dcfce7"],[8,"#86efac"],[12,"#fb923c"],[16,"#ef4444"]] },
  { key: "median_rent", label: "Rent", labelEs: "Alquiler", desc: "Median gross rent", descEs: "Alquiler medio bruto", symbol: "🏢", format: (v) => `$${v.toLocaleString()}`, legendFmt: (v) => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`, colors: [[1800,"#e2e8f0"],[2100,"#93c5fd"],[2400,"#3b82f6"],[2800,"#1d4ed8"]] },
  { key: "edu_pct", label: "Education", labelEs: "Educación", desc: "% with bachelor's degree+", descEs: "% con título universitario", symbol: "🎓", format: (v) => `${v.toFixed(0)}%`, legendFmt: (v) => `${v.toFixed(0)}%`, colors: [[20,"#e2e8f0"],[35,"#93c5fd"],[50,"#3b82f6"],[65,"#1d4ed8"]] },
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
    layer.bindTooltip(props.name, { permanent: true, direction: "center", className: "city-label" });
    layer.on("mouseover", function (e: any) {
      const l = e.target;
      l._hoverTooltip = (window as any).L.tooltip({
        permanent: false, direction: "top", className: "metric-tooltip", opacity: 1,
      }).setContent(`<b>${props.name}</b><br/>${currentMetric.symbol} ${currentMetric.format(props[metric])}`);
      l._hoverTooltip.setLatLng(l.getBounds().getCenter());
      l._hoverTooltip.addTo(l._map);
    });
    layer.on("mouseout", function (e: any) {
      if (e.target._hoverTooltip) { e.target._hoverTooltip.remove(); e.target._hoverTooltip = null; }
    });
  }

  function geoStyle(feature: any) {
    const isSelected = selected && feature.properties.name === selected.name;
    return {
      fillColor: getColor(feature.properties[metric], currentMetric.colors),
      weight: isSelected ? 2.5 : 0.5,
      color: isSelected ? "#6366f1" : "rgba(255,255,255,0.6)",
      fillOpacity: 0.75,
      dashArray: isSelected ? undefined : undefined,
    };
  }

  const m = currentMetric;

  return (
    <div className="flex flex-col lg:flex-row" style={{ height: "calc(100dvh - 2.75rem)" }}>
      {/* Map area */}
      <div className="flex-1 relative min-h-0">
        {mounted && (
          <MapContainer center={[33.68, -117.82]} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={true} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {geoData && <GeoJSON data={geoData} style={geoStyle} onEachFeature={onEachFeature} />}
          </MapContainer>
        )}

        {/* Metric pills */}
        <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-[1000]">
          <div className="flex gap-1 glass rounded-2xl shadow-lg shadow-slate-200/50 p-1 overflow-x-auto no-scrollbar">
            {METRICS.map((x) => (
              <button
                key={x.key}
                onClick={() => setMetric(x.key)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                  metric === x.key
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                }`}>
                <span className="mr-1">{x.symbol}</span>
                {isEn ? x.label : x.labelEs}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className={`absolute bottom-4 left-3 sm:left-4 z-[1000] transition-all duration-300 ${mobileOpen ? "opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto" : "opacity-100"}`}>
          <div className="glass rounded-2xl shadow-lg shadow-slate-200/50 p-3">
            <p className="text-[12px] font-semibold text-slate-700 mb-0.5">{isEn ? m.label : m.labelEs}</p>
            <p className="text-[10px] text-slate-400 mb-2">{isEn ? m.desc : m.descEs}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium w-5">Lo</span>
              {m.colors.map(([val, color]) => (
                <div key={val} className="flex flex-col items-center gap-1">
                  <div className="w-6 h-3 rounded-sm" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">{m.legendFmt(val)}</span>
                </div>
              ))}
              <span className="text-[10px] text-slate-400 font-medium ml-0.5">Hi</span>
            </div>
          </div>
        </div>

        {/* Source */}
        <div className={`absolute bottom-4 right-3 sm:right-4 z-[1000] transition-all duration-300 ${mobileOpen ? "opacity-0 sm:opacity-100" : "opacity-100"}`}>
          <span className="text-[10px] text-slate-400 bg-white/70 backdrop-blur rounded-full px-3 py-1.5">
            {isEn ? "U.S. Census Bureau · ACS 2023" : "Censo de EE. UU. · ACS 2023"}
          </span>
        </div>

        {/* Mobile hint */}
        {!selected && (
          <div className="lg:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-slate-800/90 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none shadow-lg">
            {isEn ? "👆 Tap a city to see details" : "👆 Toca una ciudad para detalles"}
          </div>
        )}
      </div>

      {/* Sidebar / bottom sheet */}
      {selected && (
        <>
          <div className="hidden lg:flex w-80 bg-white border-l border-slate-200 overflow-y-auto flex-col shadow-lg shadow-slate-200/50">
            <CityPanel selected={selected} all={data} metric={metric} isEn={isEn} onClose={() => setSelected(null)} />
          </div>
          <div className={`lg:hidden fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${mobileOpen ? "translate-y-0" : "translate-y-full"}`}
            style={{ maxHeight: "75dvh" }}>
            <div className="sticky top-0 bg-white rounded-t-2xl pt-2 pb-1 border-b border-slate-100">
              <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto mb-2" />
              <button onClick={() => { setSelected(null); setMobileOpen(false); }}
                className="absolute right-3 top-1.5 text-slate-400 hover:text-slate-600 text-xl leading-none p-1">&times;</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(75dvh - 2.5rem)" }}>
              <CityPanel selected={selected} all={data} metric={metric} isEn={isEn} onClose={() => { setSelected(null); setMobileOpen(false); }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CityPanel({ selected, all, metric, isEn, onClose }: { selected: CityData; all: CityData[]; metric: Metric; isEn: boolean; onClose: () => void }) {
  const m = METRICS.find((x) => x.key === metric)!;
  return (
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">{selected.name}</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Orange County, California</p>
        </div>
        <button onClick={onClose} className="hidden lg:block text-slate-300 hover:text-slate-500 text-xl leading-none transition-colors">&times;</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { k: "median_income", emoji: "💰", labelEn: "Income", labelEs: "Ingreso" },
          { k: "population", emoji: "👥", labelEn: "Population", labelEs: "Población" },
          { k: "median_home", emoji: "🏠", labelEn: "Homes", labelEs: "Vivienda" },
          { k: "uninsured_pct", emoji: "🏥", labelEn: "Uninsured", labelEs: "Sin Seguro" },
          { k: "poverty_pct", emoji: "🧩", labelEn: "Poverty", labelEs: "Pobreza" },
          { k: "median_rent", emoji: "🏢", labelEn: "Rent", labelEs: "Alquiler" },
          { k: "edu_pct", emoji: "🎓", labelEn: "Education", labelEs: "Educación" },
        ].map((item) => {
          const val = selected[item.k as keyof CityData] as number;
          const m2 = METRICS.find((x) => x.key === item.k)!;
          const isActive = item.k === metric;
          return (
            <div
              key={item.k}
              className={`rounded-xl p-2.5 sm:p-3 transition-all duration-200 ${
                isActive
                  ? "bg-indigo-50 ring-1 ring-indigo-200 shadow-sm"
                  : "bg-slate-50 hover:bg-slate-100"
              }`}>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mb-1">{isEn ? item.labelEn : item.labelEs}</p>
              <p className="text-[13px] sm:text-sm font-semibold text-slate-800 leading-tight">{item.emoji} {m2.format(val)}</p>
            </div>
          );
        })}
      </div>

      <ComparisonBar selected={selected} all={all} metric={metric} isEn={isEn} />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{isEn ? "OC Rankings" : "Ranking OC"}</p>
        {all
          .filter((c) => c.name !== selected.name)
          .sort((a, b) => (b[metric] as number) - (a[metric] as number))
          .slice(0, 5)
          .map((c, i) => (
            <div key={c.name} className="flex items-center justify-between text-[13px] py-1">
              <span className="text-slate-300 font-mono w-5 text-right tabular-nums">#{i + 1}</span>
              <span className="flex-1 ml-3 text-slate-600 truncate">{c.name}</span>
              <span className="font-medium text-slate-800 ml-2">{m.format((c[metric] as number))}</span>
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
  const avgPct = ((avg - min) / (max - min || 1)) * 100;
  const m = METRICS.find((x) => x.key === metric)!;

  return (
    <div className="bg-slate-50 rounded-xl p-3 sm:p-4 space-y-2.5">
      <p className="text-[11px] font-medium text-slate-400">{isEn ? "Compared to OC Average" : "Comparado con Promedio OC"}</p>
      <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="absolute top-0 w-0.5 h-full bg-slate-300 z-10" style={{ left: `${avgPct}%` }} />
        <div
          className={`h-full rounded-full transition-all duration-500 ${val > avg ? "bg-indigo-500" : "bg-orange-400"}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span className="min-w-0 break-all">{m.format(min)}</span>
        <span className={`shrink-0 text-center font-semibold ${val > avg ? "text-indigo-500" : "text-orange-500"}`}>
          {val > avg ? "▲" : "▼"} {m.format(Math.round(avg))}
        </span>
        <span className="min-w-0 break-all text-right">{m.format(max)}</span>
      </div>
    </div>
  );
}
