"use client";
import { useLang } from "@/lib/i18n";
import Link from "next/link";

export function Nav() {
  const { lang, setLang, t } = useLang();
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg text-blue-700">
          {t("app.title")}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-blue-600">{t("nav.home")}</Link>
          <Link href="/datasets" className="hover:text-blue-600">{t("nav.datasets")}</Link>
          <Link href="/alerts" className="hover:text-blue-600">{t("nav.alerts")}</Link>
          <Link href="/about" className="hover:text-blue-600">{t("nav.about")}</Link>
          <button
            onClick={() => setLang(lang === "en" ? "es" : "en")}
            className="ml-2 px-2 py-1 border rounded text-xs hover:bg-gray-50"
            aria-label="Toggle language"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>
        </div>
      </nav>
    </header>
  );
}
