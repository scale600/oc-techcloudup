"use client";
import { useLang } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.about")}</h1>
      <section>
        <h2 className="text-lg font-semibold">Our Mission</h2>
        <p className="mt-2 text-gray-600">
          OC Public Services is a free, open-source platform that makes Orange County
          public data accessible to everyone. We believe government information should
          be easy to find and understand — regardless of technical skill or income.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">How It Works</h2>
        <p className="mt-2 text-gray-600">
          We collect public data from official sources like the U.S. Census Bureau
          and Orange County agencies. An open-source AI model helps answer your questions
          using only verified data — never making up information.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Data Policy</h2>
        <ul className="mt-2 text-gray-600 list-disc pl-5 space-y-1">
          <li>We only use publicly available government data.</li>
          <li>We never collect or store personal information (PII).</li>
          <li>All data sources and update schedules are publicly listed.</li>
          <li>We operate at $0 cost using free cloud resources.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold">Technology</h2>
        <p className="mt-2 text-gray-600">
          Built on Oracle Cloud Infrastructure (Always Free tier), powered by
          open-source AI (Ollama + Phi-3), and automated with n8n workflows.
        </p>
      </section>
    </div>
  );
}
