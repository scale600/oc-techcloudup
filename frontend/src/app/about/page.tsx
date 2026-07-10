"use client";
import { useLang } from "@/lib/i18n";

const useCases = [
  { icon: "🏠", key: "about.use.residents" },
  { icon: "📰", key: "about.use.journalists" },
  { icon: "🏢", key: "about.use.realtors" },
  { icon: "🎓", key: "about.use.students" },
  { icon: "🏛️", key: "about.use.planners" },
];

const features = [
  "about.overview.feature1",
  "about.overview.feature2",
  "about.overview.feature3",
  "about.overview.feature4",
  "about.overview.feature5",
  "about.overview.feature6",
];

export default function AboutPage() {
  const { t } = useLang();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-20">
      {/* Hero */}
      <header className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t("about.title")}</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{t("about.subtitle")}</p>
      </header>

      {/* Why We Started */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-8">
          <div className="text-2xl mb-3">💡</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("about.why_title")}</h2>
          <p className="text-slate-600 leading-relaxed text-sm">{t("about.why.desc")}</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-8">
          <div className="text-2xl mb-3">🌱</div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("about.purpose_title")}</h2>
          <p className="text-slate-600 leading-relaxed text-sm">{t("about.purpose.desc")}</p>
        </div>
      </section>

      {/* Extended narrative */}
      <section className="space-y-5">
        <p className="text-slate-600 leading-relaxed text-sm">{t("about.why.desc2")}</p>
        <p className="text-slate-600 leading-relaxed text-sm">{t("about.purpose.desc2")}</p>
      </section>

      {/* How You Can Use This */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 text-center">{t("about.use_title")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => (
            <div key={uc.key} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-shadow">
              <span className="text-xl shrink-0 mt-0.5">{uc.icon}</span>
              <p className="text-xs text-slate-600 leading-relaxed">{t(uc.key)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Project Overview */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">{t("about.overview_title")}</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl mx-auto leading-relaxed">{t("about.overview.desc")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((fk, i) => (
            <div key={fk} className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-slate-700">{t(fk)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform stats */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-slate-800 text-center">{t("about.stats")}</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "34", label: t("about.cities") },
            { value: "7", label: t("about.metrics_about") },
            { value: "$0", label: t("about.cost") },
          ].map((s) => (
            <div key={s.label} className="text-center p-6 rounded-xl bg-white border border-slate-200">
              <div className="text-3xl font-bold text-indigo-600">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Open invitation */}
      <section className="rounded-xl bg-gradient-to-br from-indigo-50 to-amber-50 border border-indigo-100 p-8 text-center">
        <div className="text-2xl mb-3">🤝</div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">{t("about.invite_title")}</h2>
        <p className="text-slate-600 leading-relaxed text-sm max-w-2xl mx-auto">{t("about.invite.desc")}</p>
      </section>
    </div>
  );
}
