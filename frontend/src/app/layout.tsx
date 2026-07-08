import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";
import { Nav } from "@/components/Nav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OC Public Services — Orange County Community Information",
  description:
    "Free public service platform providing Orange County residents with easy access to community data, local information, and AI-powered assistance.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <LanguageProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="border-t py-6 text-center text-sm text-gray-500">
            OC Public Services &middot; Built with open-source AI &middot;{" "}
            <a href="/about" className="underline">Data Policy</a>
          </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
