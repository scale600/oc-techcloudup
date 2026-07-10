"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/", labelEn: "Home", labelEs: "Inicio" },
  { href: "/datasets/", labelEn: "Data", labelEs: "Datos" },
  { href: "/about/", labelEn: "About", labelEs: "Acerca de" },
  { href: "/alerts/", labelEn: "Tech", labelEs: "Tecnología" },
] as const;

export function Nav() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const isEn = lang === "en";

  return (
    <header className="h-11 glass flex items-center px-4 z-50 border-b border-slate-200/50">
      <Link href="/" className="font-semibold text-sm tracking-tight text-slate-800 hover:text-indigo-600 transition-colors">
        <span className="text-indigo-600">OC</span> Infographics
      </Link>

      <nav className="ml-6 flex items-center gap-1" aria-label="Main navigation">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors ${
                isActive
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {isEn ? link.labelEn : link.labelEs}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-0.5">
        <a href="https://github.com/scale600" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="GitHub repository">
          <span className="sr-only">GitHub</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
        <a href="https://www.linkedin.com/in/scale600" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="LinkedIn profile">
          <span className="sr-only">LinkedIn</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <a href="https://project.techcloudup.com" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="About the project">
          <span className="sr-only">About</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
        </a>
        <button
          onClick={() => setLang(lang === "en" ? "es" : "en")}
          className="px-2 py-1 ml-1 rounded-full text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={isEn ? "Switch to Spanish" : "Cambiar a Inglés"}
        >
          {lang === "en" ? "ES" : "EN"}
        </button>
      </div>
    </header>
  );
}
