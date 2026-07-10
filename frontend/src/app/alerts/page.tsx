"use client";
import { useLang } from "@/lib/i18n";

interface InstanceCard {
  labelKey: string;
  specKey: string;
}

const instances: InstanceCard[] = [
  { labelKey: "alerts.production", specKey: "alerts.production_spec" },
  { labelKey: "alerts.standby", specKey: "alerts.standby_spec" },
  { labelKey: "alerts.build", specKey: "alerts.build_spec" },
];

const alarms = [
  { labelKey: "alerts.alarm1", descKey: "alerts.alarm1.desc", severity: "CRITICAL" },
  { labelKey: "alerts.alarm2", descKey: "alerts.alarm2.desc", severity: "WARNING" },
];

const severityColor: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 border-red-200",
  WARNING: "bg-amber-100 text-amber-700 border-amber-200",
};

const techStack = [
  { label: "Frontend", value: "Next.js 16 · React 19 · TypeScript · Tailwind CSS 4", detailKey: "alerts.tech.frontend", whyKey: "alerts.tech.frontend_why" },
  { label: "Maps", value: "Leaflet · react-leaflet v5", detailKey: "alerts.tech.map", whyKey: "alerts.tech.map_why" },
  { label: "Charts", value: "Chart.js · react-chartjs-2", detailKey: "alerts.tech.charts", whyKey: "alerts.tech.charts_why" },
  { label: "Infrastructure", value: "Oracle Cloud · Nginx · Cloudflare · Let's Encrypt", detailKey: "alerts.tech.infra", whyKey: "alerts.tech.infra_why" },
  { label: "Data", value: "Static GeoJSON · Census Bureau ACS · Client-side", detailKey: "alerts.tech.data", whyKey: "alerts.tech.data_why" },
];

export default function AlertsPage() {
  const { t } = useLang();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      <header className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("alerts.title")}</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{t("alerts.subtitle")}</p>
      </header>

      {/* Instance health cards - anonymized */}
      <section className="grid gap-5 md:grid-cols-3">
        {instances.map((inst) => (
          <div key={inst.labelKey} className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t(inst.labelKey)}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("alerts.healthy")}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{t(inst.specKey)}</p>
          </div>
        ))}
      </section>

      {/* Monitoring */}
      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("alerts.monitoring")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("alerts.monitoring.desc")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {alarms.map((a) => (
            <div key={a.labelKey} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${severityColor[a.severity]}`}>{a.severity}</span>
                <span className="font-medium text-slate-800">{t(a.labelKey)}</span>
              </div>
              <p className="text-sm text-slate-500">{t(a.descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack — portfolio-style detail */}
      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("alerts.tech")}</h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t("alerts.tech.desc")}</p>
        </div>
        <div className="space-y-6">
          {techStack.map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded shrink-0 mt-0.5">{item.label}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-slate-800">{item.value}</h3>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{t(item.detailKey)}</p>
              </div>
              <div className="bg-amber-50/50 border-t border-amber-100 px-5 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Why: </span>
                  {t(item.whyKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Uptime bar */}
      <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-8 text-center">
        <div className="text-4xl font-bold text-indigo-600">99.9<span className="text-xl">%</span></div>
        <div className="text-sm text-slate-500 mt-1 uppercase tracking-wide">{t("alerts.uptime")}</div>
        <div className="text-xs text-slate-400 mt-3">{t("alerts.last_checked")}: {new Date().toLocaleString()}</div>
      </div>
    </div>
  );
}
