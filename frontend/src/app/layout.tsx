// FILE: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import Navbar from "@/components/Navbar";
import JsonLd from "@/components/JsonLd";
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
      <body className="bg-brand-carbon text-gray-100 min-h-screen antialiased selection:bg-brand-red selection:text-white font-sans">
        <JsonLd />
        <Navbar />
        {children}
      </body>
    </html>
  );
}