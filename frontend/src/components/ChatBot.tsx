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

const confidenceBadge: Record<string, { emoji: string; color: string }> = {
  confirmed: { emoji: "🟢", color: "text-green-700" },
  estimated: { emoji: "🟡", color: "text-yellow-700" },
  verify_needed: { emoji: "🔴", color: "text-red-600" },
  cannot_answer: { emoji: "⛔", color: "text-gray-500" },
};

export function ChatBot() {
  const { t } = useLang();
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
      const res: ChatResponse = await sendChat(query);
      const badge = confidenceBadge[res.confidence] ?? confidenceBadge.cannot_answer;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.answer,
          confidence: `${badge.emoji} ${t(`confidence.${res.confidence}`)}`,
          sources: res.sources,
        },
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
      setMessages((prev) =>
        prev.map((m, i) => (i === idx ? { ...m, feedback: true } : m))
      );
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-20">
            {t("hero.heading")}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.confidence && (
                <span className={`inline-block mt-2 text-xs font-medium ${confidenceBadge[msg.confidence?.split(" ")[0] === "🟢" ? "confirmed" : msg.confidence?.split(" ")[0] === "🟡" ? "estimated" : msg.confidence?.split(" ")[0] === "🔴" ? "verify_needed" : "cannot_answer"]?.color ?? "text-gray-500"}`}>
                  {msg.confidence}
                </span>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                  Sources:{" "}
                  {msg.sources.map((s, j) => (
                    <span key={j}>
                      {s.url ? (
                        <a href={s.url} className="underline" target="_blank" rel="noopener">
                          {s.name}
                        </a>
                      ) : (
                        s.name
                      )}
                      {j < msg.sources!.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </div>
              )}
              {msg.role === "assistant" && !msg.feedback && (
                <div className="mt-2 flex gap-2 text-xs text-gray-400">
                  <span>{t("feedback.helpful")}</span>
                  <button onClick={() => handleFeedback(i, true)} aria-label="Thumbs up">👍</button>
                  <button onClick={() => handleFeedback(i, false)} aria-label="Thumbs down">👎</button>
                </div>
              )}
              {msg.feedback && (
                <p className="mt-1 text-xs text-gray-400">{t("feedback.thanks")}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 animate-pulse">
              {t("chat.thinking")}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("hero.placeholder")}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Ask a question"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {t("hero.button")}
        </button>
      </form>
    </div>
  );
}
