"use client";
import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { sendChat, sendFeedback, type ChatResponse } from "@/lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  confidence?: string;
  sources?: { name: string; url: string }[];
  feedback?: boolean;
}

const confidenceBadge: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
  confirmed: { emoji: "🟢", color: "text-green-800", bg: "bg-green-50", label: "Confirmed" },
  estimated: { emoji: "🟡", color: "text-yellow-800", bg: "bg-yellow-50", label: "Estimated" },
  verify_needed: { emoji: "🔴", color: "text-red-700", bg: "bg-red-50", label: "Verify Needed" },
  cannot_answer: { emoji: "⛔", color: "text-gray-600", bg: "bg-gray-100", label: "Cannot Answer" },
};

export function ChatBot() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = input.trim();
    if (!query || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    try {
      const res: ChatResponse = await sendChat(query, lang);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.answer, confidence: res.confidence, sources: res.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleFeedback(idx: number, helpful: boolean) {
    const msg = messages[idx - 1];
    if (msg?.role === "user") {
      sendFeedback(msg.content, helpful);
      setMessages((prev) => prev.map((m, i) => (i === idx ? { ...m, feedback: true } : m)));
    }
  }

  const examples = lang === "es"
    ? [
        "¿Cuál es el ingreso medio en Santa Ana?",
        "¿Dónde está la oficina de WIC más cercana?",
        "¿Cuánto cuesta una casa en Irvine?",
        "¿Cómo ha cambiado la población de OC?",
      ]
    : [
        "What is the median income in Anaheim?",
        "Where is the nearest WIC office in zip 92701?",
        "What are average home prices in Irvine?",
        "How has OC population changed since 2020?",
      ];

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] max-w-3xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="text-center mt-6 px-4 max-w-2xl mx-auto relative">
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-br from-orange-100/20 to-blue-100/10 blur-3xl" />
            </div>
            <div className="relative z-10">
              <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
                {lang === "es"
                  ? "Acceso gratuito a datos públicos del Condado de Orange — estadísticas de población, vivienda, ingresos, servicios locales y más."
                  : "Free access to Orange County public data — population, housing, income, local services, and more."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { emoji: "📊", title: lang === "es" ? "Demografía" : "Demographics", desc: lang === "es" ? "Ingresos, población, vivienda" : "Income, population, housing" },
                  { emoji: "📍", title: lang === "es" ? "Servicios" : "Services", desc: lang === "es" ? "Oficinas WIC, obras viales" : "WIC offices, road work" },
                  { emoji: "🔔", title: lang === "es" ? "Alertas" : "Alerts", desc: lang === "es" ? "Cambios de políticas, salud" : "Policy changes, health" },
                ].map((f) => (
                  <div key={f.title} className="bg-white/80 rounded-xl p-5 text-left shadow-sm border border-gray-100">
                    <p className="text-2xl mb-2">{f.emoji}</p>
                    <p className="text-base font-semibold text-gray-800">{f.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-sm text-gray-400 mb-3 font-medium">
                {lang === "es" ? "Pruebe a preguntar" : "Try asking"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {examples.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-sm text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-full px-4 py-2 transition-colors border border-gray-100 font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const badge = msg.confidence ? confidenceBadge[msg.confidence] ?? confidenceBadge.cannot_answer : null;
          return (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-900 border border-gray-200"
              }`}>
                <p className="text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {badge && (
                  <div className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.color}`}>
                    {badge.emoji} {lang === "es" ? (badge.label === "Confirmed" ? "Confirmado" : badge.label === "Estimated" ? "Estimado" : badge.label === "Verify Needed" ? "Verificar" : "Sin respuesta") : badge.label}
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 text-sm text-gray-500 border-t pt-2">
                    <span className="font-medium">{lang === "es" ? "Fuentes" : "Sources"}: </span>
                    {msg.sources.map((s, j) => (
                      <span key={j}>
                        {s.url ? <a href={s.url} className="underline text-blue-600" target="_blank" rel="noopener">{s.name}</a> : s.name}
                        {j < msg.sources!.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>
                )}

                {msg.role === "assistant" && !msg.feedback && (
                  <div className="mt-3 flex items-center gap-3 text-base text-gray-400">
                    <span className="text-sm">{t("feedback.helpful")}</span>
                    <button onClick={() => handleFeedback(i, true)} className="text-xl hover:scale-110 transition-transform p-1" aria-label="Thumbs up">👍</button>
                    <button onClick={() => handleFeedback(i, false)} className="text-xl hover:scale-110 transition-transform p-1" aria-label="Thumbs down">👎</button>
                  </div>
                )}
                {msg.feedback && (
                  <p className="mt-2 text-sm text-gray-400">{t("feedback.thanks")}</p>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base text-gray-400 animate-pulse">
              {t("chat.thinking")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t-2 p-4 flex gap-3 bg-white">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("hero.placeholder")}
          className="flex-1 border-2 rounded-xl px-5 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={lang === "es" ? "Haga una pregunta" : "Ask a question"}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg font-bold hover:bg-blue-700 disabled:opacity-40 min-w-[80px] transition-colors"
        >
          {t("hero.button")}
        </button>
      </form>
    </div>
  );
}
