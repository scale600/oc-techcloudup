"use client";
import { createContext, useContext, useState, type ReactNode } from "react";

type Lang = "en" | "es";

const en: Record<string, string> = {
  "app.title": "OC Public Services",
  "app.subtitle": "Orange County Community Information",
  "hero.heading": "Ask anything about Orange County",
  "hero.placeholder": "e.g. What is the median income in Santa Ana?",
  "hero.button": "Ask",
  "nav.home": "Home",
  "nav.datasets": "Data Sources",
  "nav.alerts": "Alerts",
  "nav.about": "About",
  "chat.thinking": "Searching public data...",
  "chat.you": "You",
  "chat.assistant": "OC Assistant",
  "confidence.confirmed": "Confirmed",
  "confidence.estimated": "Estimated",
  "confidence.verify": "Verify Needed",
  "confidence.cannot": "Cannot Answer",
  "feedback.helpful": "Was this helpful?",
  "feedback.yes": "Yes",
  "feedback.no": "No",
  "feedback.thanks": "Thanks for your feedback!",
};

const es: Record<string, string> = {
  "app.title": "Servicios Públicos de OC",
  "app.subtitle": "Información Comunitaria del Condado de Orange",
  "hero.heading": "Pregunte lo que sea sobre el Condado de Orange",
  "hero.placeholder": "Ej. ¿Cuál es el ingreso medio en Santa Ana?",
  "hero.button": "Preguntar",
  "nav.home": "Inicio",
  "nav.datasets": "Datos",
  "nav.alerts": "Alertas",
  "nav.about": "Acerca de",
  "chat.thinking": "Buscando datos públicos...",
  "chat.you": "Tú",
  "chat.assistant": "Asistente OC",
  "confidence.confirmed": "Confirmado",
  "confidence.estimated": "Estimado",
  "confidence.verify": "Verificar",
  "confidence.cannot": "Sin respuesta",
  "feedback.helpful": "¿Fue útil?",
  "feedback.yes": "Sí",
  "feedback.no": "No",
  "feedback.thanks": "¡Gracias por tus comentarios!",
};

const dicts: Record<Lang, Record<string, string>> = { en, es };

const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}>({ lang: "en", setLang: () => {}, t: (k) => k });

export function useLang() {
  return useContext(LangCtx);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: string) => dicts[lang][key] ?? key;
  return (
    <LangCtx.Provider value={{ lang, setLang, t }}>
      {children}
    </LangCtx.Provider>
  );
}
