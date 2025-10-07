import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SearchProvider } from "@/context/SearchContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRODHAB | Buscador Jurisprudencia",
  description: "Buscador de jurisprudencia sobre protección de datos personales en Costa Rica",
  keywords: "PRODHAB, datos personales, jurisprudencia, Costa Rica, protección de datos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  );
}
