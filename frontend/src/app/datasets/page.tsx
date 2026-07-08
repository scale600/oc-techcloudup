"use client";
import { useLang } from "@/lib/i18n";

export default function DatasetsPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold">{t("nav.datasets")}</h1>
      <p className="mt-4 text-gray-600">
        We collect and serve data from official Orange County and U.S. Census Bureau sources.
        All data is publicly available and updated on a regular schedule.
      </p>
      <p className="mt-2 text-gray-500 text-sm">
        Data sources will be listed here once collection workflows are active.
      </p>
    </div>
  );
}
