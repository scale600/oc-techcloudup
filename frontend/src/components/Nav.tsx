"use client";
import { useLang } from "@/lib/i18n";
import Link from "next/link";

export function Nav() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="border-b-2 bg-white sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-blue-700">
          {t("app.title")}
        </Link>
        <div className="flex items-center gap-5 text-base">
          <Link href="/" className="hover:text-blue-600 font-medium">{t("nav.home")}</Link>
          <Link href="/datasets/" className="hover:text-blue-600 font-medium">{t("nav.datasets")}</Link>
          <Link href="/alerts/" className="hover:text-blue-600 font-medium">{t("nav.alerts")}</Link>
          <Link href="/about/" className="hover:text-blue-600 font-medium">{t("nav.about")}</Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-2 px-3 py-1.5 border-2 rounded-lg text-sm font-bold hover:bg-blue-50 hover:border-blue-400"
            aria-label="Toggle language"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>
        </div>
      </nav>
    </header>
  );
}
