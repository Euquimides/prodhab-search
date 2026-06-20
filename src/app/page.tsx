import Footer from "@/components/Footer";
import { Suspense } from "react";
import SearchClient from "@/components/SearchClient";

export default function SearchPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Ir al contenido principal
      </a>

      <main id="main-content" className="flex-1">
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm text-neutral-500">
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
