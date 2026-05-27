import Image from "next/image";
import Footer from "@/components/Footer";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Contenido principal */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white dark:bg-neutral-900 px-4 py-2 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Ir al contenido principal
      </a>

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Barra superior: toggle de tema alineado al contenido */}
        <div className="flex justify-center pt-4 sm:pt-5">
          <DarkModeToggle />
        </div>

        {/* Header */}
        <div className="mb-8 sm:mb-12 mt-4 sm:mt-6 flex flex-col items-center">
          <Image
            src="/privatasearch_logo.png"
            alt="PrivataSearch"
            width={72}
            height={72}
            priority
            className="mb-4 w-14 sm:w-18 h-auto"
          />
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl text-center">
            PrivataSearch
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 text-center max-w-lg">
            Resoluciones de la Agencia de Protección de Datos (PRODHAB) de Costa Rica
          </p>
        </div>

        {/* Client-side buscador UI */}
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm text-neutral-500">
              Cargando buscador...
            </div>
          }
        >
          <SearchClient />
        </Suspense>

        {/* Espacio de respiro antes del footer */}
        <div className="h-12 sm:h-16" />
      </main>
      <Footer />
    </div>
  );
}
