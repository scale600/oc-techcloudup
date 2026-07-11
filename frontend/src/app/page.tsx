"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import type { GeoJSON as LeafletGeoJSON, Tooltip as LeafletTooltip, LeafletMouseEvent } from "leaflet";
import { useLang } from "@/lib/i18n";
import type { CityData, Metric, GeoJsonData } from "@/lib/types";
import { METRICS, getColor, getMetric } from "@/lib/metrics";
import CityPanel from "@/components/CityPanel";
import CountyOverview from "@/components/CountyOverview";
import CityTable from "@/components/CityTable";

let _L: typeof import("leaflet") | null = null;
async function getL() {
  if (!_L) _L = await import("leaflet");
  return _L;
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((m) => m.GeoJSON),
  { ssr: false }
);

export default function MapPage() {
  const { lang } = useLang();
  const isEn = lang === "en";
  const [data, setData] = useState<CityData[]>([]);
  const [metric, setMetric] = useState<Metric>("median_income");
  const [selected, setSelected] = useState<CityData[]>([]);
  const [geoData, setGeoData] = useState<GeoJsonData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  const searchRef = useRef<HTMLDivElement>(null);

  // Stable refs for values used inside Leaflet callbacks (avoids re-binding events)
  const selectCityRef = useRef<(city: CityData, isShift: boolean) => void>(() => {});
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const metricRef = useRef(metric);
  metricRef.current = metric;

  useEffect(() => {
    let cancelled = false;
    const initialHash = window.location.hash.slice(1);
    fetch("/oc-cities.json")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data (${r.status})`);
        return r.json() as Promise<GeoJsonData>;
      })
      .then((d) => {
        if (cancelled) return;
        setGeoData(d);
        const cities = d.features.map((f) => f.properties);
        setData(cities);

        const params = new URLSearchParams(initialHash);
        const hashMetric = params.get("metric") as Metric | null;
        const hashCities = params.getAll("city").map((c) => c.replace(/\+/g, " "));
        if (hashMetric && METRICS.some((x) => x.key === hashMetric)) {
          setMetric(hashMetric);
        }
        if (hashCities.length > 0) {
          const found = hashCities
            .map((name) => cities.find((c) => c.name.toLowerCase() === name.toLowerCase()))
            .filter((c): c is CityData => !!c);
          if (found.length > 0) {
            setSelected(found);
            setMobileOpen(true);
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load data");
        }
      });

    setMounted(true);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (selected.length === 0) {
      window.history.replaceState(null, "", window.location.pathname);
      return;
    }
    const params = new URLSearchParams();
    params.set("metric", metric);
    for (const c of selected) params.append("city", c.name);
    window.history.replaceState(null, "", `#${params.toString()}`);
  }, [metric, selected, mounted]);

  const selectCity = useCallback((city: CityData, isShift: boolean) => {
    setSelected((prev) => {
      if (isShift) {
        const exists = prev.find((c) => c.name === city.name);
        if (exists) return prev.filter((c) => c.name !== city.name);
        if (prev.length >= 3) return prev; // max 3
        return [...prev, city];
      }
      // Plain click: toggle if same city, otherwise replace
      if (prev.length === 1 && prev[0].name === city.name) return [];
      return [city];
    });
    setMobileOpen(true);
  }, []);
  selectCityRef.current = selectCity;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDropdown]);

  const filteredCities = searchQuery.trim()
    ? data.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleCitySearch = (city: CityData) => {
    selectCity(city, false);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const currentMetric = useMemo(() => getMetric(metric), [metric]);

  const onEachFeature = useCallback(
    (feature: { properties: CityData }, layer: LeafletGeoJSON) => {
      const props = feature.properties;

      layer.on("click", (e: LeafletMouseEvent) => {
        const isShift = !!(e.originalEvent as MouseEvent).shiftKey;
        selectCityRef.current(props, isShift);
      });

      layer.bindTooltip(props.name, {
        permanent: true,
        direction: "center",
        className: "city-label",
      });

      layer.on("mouseover", async function (this: LeafletGeoJSON, e: LeafletMouseEvent) {
        const l = e.target as LeafletGeoJSON & { _hoverTooltip?: LeafletTooltip | null };
        const m = getMetric(metricRef.current);
        const L = await getL();
        const tooltip = L.tooltip({
          permanent: false,
          direction: "top",
          className: "metric-tooltip",
          opacity: 1,
        }).setContent(
          `<b>${props.name}</b><br/>${m.symbol} ${m.format(props[metricRef.current])}`
        );
        tooltip.setLatLng(l.getBounds().getCenter());
        tooltip.addTo(l._map!);
        l._hoverTooltip = tooltip;
      });

      layer.on("mouseout", function (this: LeafletGeoJSON, e: LeafletMouseEvent) {
        const l = e.target as LeafletGeoJSON & { _hoverTooltip?: LeafletTooltip | null };
        if (l._hoverTooltip) {
          l._hoverTooltip.remove();
          l._hoverTooltip = undefined;
        }
      });
    },
    []
  );

  const geoStyle = useCallback(
    (feature: { properties: CityData } | undefined) => {
      const colors = ["#6366f1", "#f59e0b", "#10b981"];
      if (!currentMetric || !feature)
        return { fillColor: "#e2e8f0", weight: 0.5, color: "rgba(255,255,255,0.6)", fillOpacity: 0.75 };
      const sel = selectedRef.current;
      const idx = sel.findIndex((c) => c.name === feature.properties.name);
      if (idx >= 0) {
        return {
          fillColor: getColor(feature.properties[metricRef.current], currentMetric.colors),
          weight: 2.5,
          color: colors[idx] ?? colors[0],
          fillOpacity: 0.8,
        };
      }
      return {
        fillColor: getColor(feature.properties[metricRef.current], currentMetric.colors),
        weight: 0.5,
        color: "rgba(255,255,255,0.6)",
        fillOpacity: 0.75,
      };
    },
    [currentMetric]
  );

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3 p-8">
          <p className="text-4xl">⚠️</p>
          <p className="text-slate-600 font-medium">
            {isEn ? "Unable to load map data" : "No se pueden cargar los datos"}
          </p>
          <p className="text-sm text-slate-400">{loadError}</p>
        </div>
      </div>
    );
  }

  const m = currentMetric;

  return (
    <div
      className="flex flex-col lg:flex-row"
      style={{ height: "calc(100dvh - 2.75rem)" }}
    >
      {/* Map area */}
      <div className="flex-1 relative min-h-0">
        {/* View toggle — map vs table */}
        <div className="absolute top-3 right-3 sm:right-4 z-[1001] flex rounded-xl glass shadow-lg shadow-slate-200/50 p-0.5">
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-2 rounded-[10px] text-[12px] font-medium transition-all duration-200 ${
              viewMode === "map"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🗺️ {isEn ? "Map" : "Mapa"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-2 rounded-[10px] text-[12px] font-medium transition-all duration-200 ${
              viewMode === "table"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            📋 {isEn ? "Table" : "Tabla"}
          </button>
        </div>

        {/* Loading state */}
        {mounted && !geoData && (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-slate-100/50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-slate-500 font-medium">
                {isEn ? "Loading map data…" : "Cargando datos del mapa…"}
              </p>
            </div>
          </div>
        )}

        {viewMode === "map" && mounted && (
          <MapContainer
            center={[33.68, -117.89]}
            zoom={10.3}
            zoomSnap={0.25}
            zoomDelta={0.25}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {geoData && (
              <GeoJSON
                data={geoData}
                style={geoStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        )}

        {viewMode === "table" && mounted && (
          <CityTable
            all={data}
            metric={metric}
            selected={selected}
            isEn={isEn}
            onSelect={(city) => selectCity(city, false)}
          />
        )}

        {viewMode === "map" && m && (
          <>
            {/* Metric pills */}
            <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-[2001]">
              <div className="flex gap-1 glass rounded-2xl shadow-lg shadow-slate-200/50 p-1 overflow-x-auto no-scrollbar">
                {METRICS.map((x) => (
                  <button
                    key={x.key}
                    onClick={() => setMetric(x.key)}
                    title={x.tip}
                    aria-pressed={metric === x.key}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                      metric === x.key
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    <span className="mr-1">{x.symbol}</span>
                    {isEn ? x.label : x.labelEs}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 ml-1 text-[11px] text-slate-600 font-medium transition-all duration-200">
                {m.symbol} {isEn ? m.desc : m.descEs}
              </p>

              {/* City search */}
              <div className="relative mt-2 ml-1 w-full sm:w-52" ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={isEn ? "Search city…" : "Buscar ciudad…"}
                  className="w-full px-3 py-1.5 text-[12px] bg-white/90 backdrop-blur rounded-xl border border-slate-200/60 outline-none focus:ring-2 focus:ring-indigo-300 text-slate-700 placeholder-slate-400 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 text-sm"
                  >
                    &times;
                  </button>
                )}
                {showDropdown && filteredCities.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 glass rounded-xl shadow-lg overflow-hidden z-50 max-h-48 overflow-y-auto">
                    {filteredCities.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => handleCitySearch(c)}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-slate-600 hover:bg-indigo-50 transition-colors"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown &&
                  searchQuery.trim() &&
                  filteredCities.length === 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 glass rounded-xl shadow-lg p-2 text-[11px] text-slate-400 text-center z-50">
                      {isEn ? "No cities found" : "Sin resultados"}
                    </div>
                  )}
              </div>
            </div>

            {/* Legend */}
            <div
              className={`absolute bottom-4 left-3 sm:left-4 z-[1000] transition-all duration-300 ${
                mobileOpen
                  ? "opacity-0 sm:opacity-100 pointer-events-none sm:pointer-events-auto"
                  : "opacity-100"
              }`}
            >
              <div className="glass rounded-2xl shadow-lg shadow-slate-200/50 p-3">
                <p className="text-[12px] font-semibold text-slate-700 mb-0.5">
                  {isEn ? m.label : m.labelEs}
                </p>
                <p className="text-[10px] text-slate-400 mb-2">
                  {isEn ? m.desc : m.descEs}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {m.direction === "desc"
                      ? isEn
                        ? "Better"
                        : "Mejor"
                      : isEn
                        ? "Low"
                        : "Bajo"}
                  </span>
                  {m.colors.map(([val, color]) => (
                    <div
                      key={val}
                      className="flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-6 h-3 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                        {m.legendFmt(val)}
                      </span>
                    </div>
                  ))}
                  <span className="text-[10px] text-slate-400 font-medium ml-0.5">
                    {m.direction === "desc"
                      ? isEn
                        ? "Worse"
                        : "Peor"
                      : isEn
                        ? "High"
                        : "Alto"}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Source */}
        {viewMode === "map" && (
        <div
          className={`absolute bottom-4 right-3 sm:right-4 z-[1000] transition-all duration-300 ${
            mobileOpen
              ? "opacity-0 sm:opacity-100"
              : "opacity-100"
          }`}
        >
          <span className="text-[10px] text-slate-400 bg-white/70 backdrop-blur rounded-full px-3 py-1.5">
            {isEn
              ? "U.S. Census Bureau · ACS 2019–2023"
              : "Censo de EE. UU. · ACS 2019–2023"}
          </span>
        </div>
        )}

        {/* Mobile hint */}
        {viewMode === "map" && selected.length === 0 && (
          <div className="nav-mobile-only absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] bg-slate-800/90 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none shadow-lg">
            {isEn
              ? "👆 Tap a city to see details"
              : "👆 Toca una ciudad para detalles"}
          </div>
        )}
      </div>

      {/* Desktop sidebar — always visible */}
      <div className="nav-desktop w-96 bg-white border-l border-slate-200 overflow-y-auto flex-col shadow-lg shadow-slate-200/50">
        {selected.length > 0 ? (
          <CityPanel
            selected={selected}
            all={data}
            metric={metric}
            isEn={isEn}
            onClose={() => setSelected([])}
          />
        ) : (
          <CountyOverview all={data} metric={metric} isEn={isEn} />
        )}
      </div>

      {/* Mobile bottom sheet — only when city selected */}
      {selected.length > 0 && (
        <div
          className={`nav-mobile-only fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 overflow-hidden ${
            mobileOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ maxHeight: "60dvh" }}
        >
          <div className="sticky top-0 bg-white rounded-t-2xl pt-2.5 pb-2 border-b border-slate-100">
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />
            <button
              onClick={() => {
                setSelected([]);
                setMobileOpen(false);
              }}
              className="absolute right-2 top-1 flex items-center justify-center w-10 h-10 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label={isEn ? "Close panel" : "Cerrar panel"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(60dvh - 3rem)" }}
          >
            <CityPanel
              selected={selected}
              all={data}
              metric={metric}
              isEn={isEn}
              onClose={() => {
                setSelected([]);
                setMobileOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
