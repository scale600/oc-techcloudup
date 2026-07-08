"use client";
import { ChatBot } from "@/components/ChatBot";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { t } = useLang();
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900">{t("app.title")}</h1>
        <p className="mt-2 text-lg text-gray-500">{t("app.subtitle")}</p>
      </div>
      <ChatBot />
    </div>
  );
}
