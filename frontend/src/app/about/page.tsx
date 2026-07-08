"use client";
import { useLang } from "@/lib/i18n";

export default function AboutPage() {
  const { t, lang } = useLang();
  const isEn = lang === "en";
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <h1 className="text-2xl font-bold">{t("nav.about")}</h1>
      <section>
        <h2 className="text-xl font-semibold mb-2">{isEn ? "Our Mission" : "Nuestra Misión"}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {isEn
            ? "A free platform making Orange County public data accessible to everyone."
            : "Una plataforma gratuita que hace accesibles los datos públicos del Condado de Orange."}
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">{isEn ? "How It Works" : "Cómo Funciona"}</h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {isEn
            ? "Open-source AI answers questions using only verified public data — never making up information."
            : "IA de código abierto responde usando solo datos públicos verificados."}
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">{isEn ? "Data Policy" : "Política de Datos"}</h2>
        <ul className="text-lg text-gray-600 list-disc pl-6 space-y-2">
          <li>{isEn ? "Only publicly available government data" : "Solo datos gubernamentales públicos"}</li>
          <li>{isEn ? "Never collect personal information" : "Nunca recopilamos información personal"}</li>
          <li>{isEn ? "All sources publicly listed" : "Todas las fuentes son públicas"}</li>
        </ul>
      </section>
    </div>
  );
}
