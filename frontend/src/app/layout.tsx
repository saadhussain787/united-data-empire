// FILE: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
import AmbientBackground from "@/components/AmbientBackground";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The United Data | Manchester United Live Stats & Historical Archive",
  description:
    "Real-time match data, live scores, 100-year historical database, and in-depth player analytics for Manchester United.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${bebasNeue.variable}`}>
      <body className="relative min-h-screen bg-[#050508] text-white antialiased selection:bg-brand-red selection:text-white font-sans">
        <AmbientBackground />
        <div className="relative z-10 bg-transparent flex flex-col min-h-screen">
          <JsonLd />
          <Navbar />
          <main className="flex-1 pt-28 md:pt-32 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}