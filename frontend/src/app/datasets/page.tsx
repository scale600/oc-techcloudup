"use client";
import { useLang } from "@/lib/i18n";

export default function DatasetsPage() {
  const { t, lang } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">{t("nav.datasets")}</h1>
      <p className="text-lg text-gray-600 leading-relaxed">
        {lang === "es"
          ? "Recopilamos datos de fuentes oficiales del Condado de Orange y la Oficina del Censo de EE. UU."
          : "We collect data from official Orange County and U.S. Census Bureau sources."}
      </p>
      <p className="mt-4 text-base text-gray-500">
        {lang === "es" ? "Las fuentes de datos aparecerán aquí pronto." : "Data sources will be listed here soon."}
      </p>
    </div>
  );
}
