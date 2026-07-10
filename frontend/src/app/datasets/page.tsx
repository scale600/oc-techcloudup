"use client";
import { useLang } from "@/lib/i18n";
import { METRICS } from "@/lib/metrics";

interface Source {
  icon: string;
  titleKey: string;
  descKey: string;
  updated: string;
  points: number;
}

const sources: Source[] = [
  { icon: "📊", titleKey: "datasets.census.title", descKey: "datasets.census.desc", updated: "2023", points: 1420 },
  { icon: "🗺️", titleKey: "datasets.geojson.title", descKey: "datasets.geojson.desc", updated: "2024", points: 34 },
  { icon: "📋", titleKey: "datasets.census_raw.title", descKey: "datasets.census_raw.desc", updated: "2023", points: 3860 },
];

const METRIC_SOURCE_TABLES: Record<string, string> = {
  median_income: "B19013",
  population: "B01003",
  median_home: "B25077",
  uninsured_pct: "S2701",
  poverty_pct: "S1701",
  median_rent: "B25064",
  edu_pct: "S1501",
};

const DATA_FIELDS: { field: string; type: string; descEn: string; descEs: string }[] = [
  { field: "name", type: "string", descEn: "City name", descEs: "Nombre de la ciudad" },
  { field: "population", type: "number", descEn: "Total population", descEs: "Población total" },
  { field: "median_income", type: "number", descEn: "Median household income (USD)", descEs: "Ingreso medio por hogar (USD)" },
  { field: "median_home", type: "number", descEn: "Median home value (USD)", descEs: "Valor medio de vivienda (USD)" },
  { field: "uninsured_pct", type: "number", descEn: "Percent without health insurance", descEs: "Porcentaje sin seguro médico" },
  { field: "poverty_pct", type: "number", descEn: "Percent below poverty line", descEs: "Porcentaje bajo línea de pobreza" },
  { field: "median_rent", type: "number", descEn: "Median gross rent (USD)", descEs: "Alquiler medio bruto (USD)" },
  { field: "edu_pct", type: "number", descEn: "Percent with bachelor's degree or higher", descEs: "Porcentaje con título universitario o superior" },
];

const GEO_FIELDS: { field: string; type: string; descEn: string; descEs: string }[] = [
  { field: "type", type: "string", descEn: "Always \"FeatureCollection\"", descEs: "Siempre \"FeatureCollection\"" },
  { field: "features", type: "array", descEn: "Array of 34 city features", descEs: "Lista de 34 características de ciudad" },
  { field: "features[].type", type: "string", descEn: "Always \"Feature\"", descEs: "Siempre \"Feature\"" },
  { field: "features[].properties", type: "object", descEn: "CityData object (see fields above)", descEs: "Objeto CityData (ver campos arriba)" },
  { field: "features[].geometry", type: "object", descEn: "GeoJSON Polygon with city boundary coordinates", descEs: "Polígono GeoJSON con coordenadas del límite de la ciudad" },
];

export default function DatasetsPage() {
  const { t } = useLang();
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("datasets.title")}</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{t("datasets.subtitle")}</p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        {[{ value: "34", label: t("datasets.cities") }, { value: "7", label: t("datasets.metrics") }, { value: "26 KB", label: t("datasets.size") }].map((s) => (
          <div key={s.label} className="text-center p-6 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="text-2xl font-bold text-indigo-600">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800">{t("datasets.sources")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {sources.map((s) => (
            <div key={s.titleKey} className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-3">{s.icon}</div>
              <h3 className="font-semibold text-slate-800 mb-2">{t(s.titleKey)}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{t(s.descKey)}</p>
              <div className="flex items-center gap-3 text-xs text-slate-400 pt-3 border-t border-slate-100">
                {t("datasets.updated")} {s.updated} · {s.points.toLocaleString()} {t("datasets.points")}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("datasets.metrics_title")}</h2>
          <p className="text-sm text-slate-500 mt-2">{t("datasets.metrics_subtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{m.symbol}</span>
                <h3 className="font-semibold text-slate-800 text-sm">{m.label}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">{m.tip}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5">
                  {t("datasets.source_table")}: {METRIC_SOURCE_TABLES[m.key] ?? "—"}
                </span>
                <span>
                  {m.direction === "asc" ? "Higher = better" : "Lower = better"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("datasets.datafile_title")}</h2>
          <p className="text-sm text-slate-500 mt-2">{t("datasets.datafile_desc")}</p>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              oc-cities.json — CityData Fields
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_field")}</th>
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_type")}</th>
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_desc_col")}</th>
              </tr>
            </thead>
            <tbody>
              {DATA_FIELDS.map((f) => (
                <tr key={f.field} className="border-b border-slate-50">
                  <td className="px-5 py-2.5 font-mono text-[12px] text-indigo-600">{f.field}</td>
                  <td className="px-5 py-2.5">
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-mono">{f.type}</span>
                  </td>
                  <td className="px-5 py-2.5 text-[12px] text-slate-600">{f.descEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GeoJSON Wrapper Structure
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_field")}</th>
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_type")}</th>
                <th className="px-5 py-2 text-[11px] font-semibold text-slate-400 uppercase">{t("datasets.datafile_desc_col")}</th>
              </tr>
            </thead>
            <tbody>
              {GEO_FIELDS.map((f) => (
                <tr key={f.field} className="border-b border-slate-50">
                  <td className="px-5 py-2.5 font-mono text-[12px] text-emerald-600">{f.field}</td>
                  <td className="px-5 py-2.5">
                    <span className="text-[11px] bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 font-mono">{f.type}</span>
                  </td>
                  <td className="px-5 py-2.5 text-[12px] text-slate-600">{f.descEn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl bg-slate-50 border border-slate-200 p-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("datasets.methodology")}</h2>
        <p className="text-slate-600 leading-relaxed">{t("datasets.methodology.desc")}</p>
      </section>
    </div>
  );
}
