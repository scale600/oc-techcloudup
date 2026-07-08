"use client";
import { useLang } from "@/lib/i18n";

export default function AlertsPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">{t("nav.alerts")}</h1>
      <p className="mt-4 text-gray-600">
        Active public alerts for Orange County will appear here — including
        policy changes, road work notices, and public health updates.
      </p>
      <p className="mt-2 text-gray-500 text-sm">
        No active alerts at this time.
      </p>
    </div>
  );
}
