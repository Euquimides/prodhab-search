"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchIndex } from "@/context/SearchContext";
import { SearchConfigPanel } from "./SearchConfigPanel";
import { SearchResults } from "./SearchResults";

// Hook de debounce personalizado
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [relatedLimit, setRelatedLimit] = useState(5);
  const [isSticky, setIsSticky] = useState(false);
  const { allItems, search, searchResults, error } = useSearchIndex();

  // Debounce de la consulta de búsqueda (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Detectar scroll para aplicar sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Activar FlexSearch cuando cambia la consulta de debounce
  useEffect(() => {
    search(debouncedQuery, limit);
  }, [debouncedQuery, limit, search]);

  // Manejar atajos de teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        setQuery("");
      }
    },
    [],
  );

  // Scroll suave al inicio
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 animate-slide-down">
          <p className="font-medium">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      <SearchConfigPanel
        limit={limit}
        setLimit={setLimit}
        similarityThreshold={similarityThreshold}
        setSimilarityThreshold={setSimilarityThreshold}
        relatedLimit={relatedLimit}
        setRelatedLimit={setRelatedLimit}
      />

      {/* Sticky Search Bar */}
      <div
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isSticky
            ? "bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md shadow-lg py-2 -mx-4 px-4 sm:-mx-6 sm:px-6"
            : "bg-transparent"
        }`}
      >
        {/* Indicador visual sutil cuando está sticky */}
        {isSticky && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-fade-in" />
        )}

        <div
          className={`relative w-full flex flex-col ${isSticky ? "mb-2 gap-1.5" : "mb-4 md:mb-6 gap-2"}`}
        >
          <div className="relative w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-colors duration-200 ${
                  isSticky ? "h-4 w-4" : "h-5 w-5"
                } ${
                  query
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-neutral-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar resoluciones... (Esc para limpiar)"
              className={`w-full pl-12 pr-12 md:pr-10 border rounded-lg text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 ${
                isSticky ? "py-1.5 md:py-1.5 shadow-sm" : "py-3 md:py-2"
              }`}
              aria-label="Buscar resoluciones"
              aria-describedby="search-hint"
            />
            <span id="search-hint" className="sr-only">
              Presiona Escape para limpiar la búsqueda
            </span>
            {query && (
              <button
                onClick={() => setQuery("")}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 transition-all duration-200 ${
                  isSticky ? "p-1" : "p-2 md:p-1.5"
                }`}
                style={{ lineHeight: 0 }}
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
                tabIndex={0}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={isSticky ? "h-4 w-4" : "h-5 w-5 md:h-4 md:w-4"}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {query && (
            <div
              className={`flex items-center justify-between gap-2 ${isSticky ? "" : ""}`}
            >
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {searchResults.length} resultado
                {searchResults.length !== 1 ? "s" : ""} encontrado
                {searchResults.length !== 1 ? "s" : ""}
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className={`rounded-md bg-neutral-100 text-neutral-700 text-xs font-medium hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 active:scale-95 ${
                  isSticky ? "px-2 py-1" : "px-3 py-1.5"
                }`}
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </div>
      <SearchResults
        query={debouncedQuery}
        limit={limit}
        similarityThreshold={similarityThreshold}
        relatedLimit={relatedLimit}
        filteredItems={debouncedQuery.length > 0 ? searchResults : allItems}
        isSearching={debouncedQuery.length > 0}
        useFlexSearch={debouncedQuery.length > 0}
      />

      {/* Botón flotante para volver arriba */}
      {isSticky && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl active:scale-95 transition-all duration-200 animate-scale-in focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Volver arriba"
          title="Volver arriba"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
