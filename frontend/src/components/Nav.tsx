"use client";
import { useLang } from "@/lib/i18n";

export function Nav() {
  const { lang, setLang } = useLang();
  return (
    <header className="h-12 bg-white border-b flex items-center px-4 z-50">
      <span className="font-bold text-base text-blue-700">📍 OC Infographics</span>
      <div className="ml-auto flex items-center gap-3 text-sm">
        <button onClick={() => setLang(lang === "en" ? "es" : "en")}
          className="px-2 py-1 border rounded-md text-xs font-bold hover:bg-blue-50">
          {lang === "en" ? "ES" : "EN"}
        </button>
      </div>
    </header>
  );
}
