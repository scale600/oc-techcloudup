import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { LanguageProvider } from "@/lib/i18n";
import { Nav } from "@/components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OC Infographics — Orange County Public Data",
  description: "Interactive map of Orange County cities with public data infographics — income, population, housing.",
  openGraph: {
    title: "OC Infographics — Orange County Public Data",
    description: "Interactive map of Orange County cities with public data infographics — income, population, housing.",
    type: "website",
    siteName: "OC Infographics",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script src="/analytics.js" defer />
      </head>
      <body className="h-full flex flex-col bg-white text-gray-900">
        <LanguageProvider>
          <Nav />
          <main className="flex-1">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
