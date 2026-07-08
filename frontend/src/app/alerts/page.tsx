"use client";
import { useLang } from "@/lib/i18n";

export default function AlertsPage() {
  const { t, lang } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">{t("nav.alerts")}</h1>
      <p className="text-lg text-gray-600 leading-relaxed">
        {lang === "es"
          ? "Alertas públicas activas para el Condado de Orange."
          : "Active public alerts for Orange County."}
      </p>
      <p className="mt-4 text-base text-gray-500">
        {lang === "es" ? "No hay alertas activas." : "No active alerts at this time."}
      </p>
    </div>
  );
}
