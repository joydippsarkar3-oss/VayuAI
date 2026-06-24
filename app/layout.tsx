import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VayuAI — AI Weather Intelligence for India",
  description:
    "Multi-source, AI-fused daily weather forecasts for India. Combines Open-Meteo, wttr.in and 7Timer! with ensemble intelligence and confidence scoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sky-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
