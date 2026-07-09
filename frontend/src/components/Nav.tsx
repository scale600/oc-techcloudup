"use client";
import { useLang } from "@/lib/i18n";

export function Nav() {
  const { lang, setLang } = useLang();
  return (
    <header className="h-11 glass flex items-center px-4 z-50 border-b border-slate-200/50">
      <span className="font-semibold text-sm tracking-tight text-slate-800">
        <span className="text-indigo-600">OC</span> Infographics
      </span>
      <div className="ml-auto">
        <button
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          className="px-2.5 py-1 rounded-full text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {lang === "en" ? "ES" : "EN"}
        </button>
      </div>
    </header>
  );
}
