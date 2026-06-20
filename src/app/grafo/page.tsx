"use client";

import dynamic from "next/dynamic";
import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/Footer";

const CitationGraph = dynamic(() => import("@/components/CitationGraph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[70vh]">
      <div className="text-center">
        <div className="h-10 w-10 mx-auto mb-4 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando grafo de citas…</p>
      </div>
    </div>
  ),
});

export default function GrafoPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <SiteHeader subtitle="Red de citas" />
      <main className="h-[calc(100vh-3rem)]">
        <CitationGraph />
      </main>
      <Footer />
    </div>
  );
}
