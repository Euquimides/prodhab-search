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

      {/* Dark mode toggle */}
      <div className="flex justify-end px-4 sm:px-6 pt-4 sm:pt-6">
        <DarkModeToggle />
      </div>

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 md:py-14">
        {/* Header */}
        <div className="mb-6 sm:mb-10 flex flex-col items-center">
          <img
            src="/privatasearch_logo.png"
            alt="PrivataSearch"
            width={80}
            height={80}
            className="mb-3 sm:mb-4 w-16 sm:w-20 h-auto"
          />
          <h1 className="mb-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 md:text-4xl text-center">
            PrivataSearch
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 text-center px-4">
            Buscador de resoluciones sobre protección de datos personales en Costa Rica
          </p>
        </div>

        {/* Client-side buscador UI */}
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm sm:text-base text-neutral-500">
              Cargando buscador...
            </div>
          }
        >
          <SearchClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
