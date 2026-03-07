import Footer from "@/components/Footer";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 sm:mb-12 md:mb-16 flex flex-col items-center">
          <img
            src="/privatasearch_logo.png"
            alt="Privatasearch Logo"
            className="mb-4 sm:mb-6 w-20 sm:w-24 md:w-28 h-auto"
          />
          <h1 className="mb-2 sm:mb-3 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl text-center leading-tight sm:leading-normal">
            PrivataSearch
          </h1>
          <h3
            className="mb-3 text-base sm:text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 text-center leading-relaxed px-2"
            style={{ lineHeight: "1.5" }}
          >
            Buscador De Resoluciones Sobre Protección De Datos Personales En
            Costa Rica
          </h3>
        </div>
        {/* Client-side buscador UI */}
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm sm:text-base">
              Cargando buscador...
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}
