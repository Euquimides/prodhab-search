"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchIndex, DESCRIPTOR_LABELS } from "@/context/SearchContext";
import { SearchConfigPanel } from "./SearchConfigPanel";
import { SearchResults } from "./SearchResults";

const HISTORY_KEY = "ps_search_history";
const MAX_HISTORY = 8;
const STICKY_SCROLL_THRESHOLD = 100; // px from top before search bar becomes sticky

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
  const [yearFrom, setYearFrom] = useState<number | null>(null);
  const [yearTo, setYearTo] = useState<number | null>(null);
  const [selectedDescriptores, setSelectedDescriptores] = useState<string[]>([]);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [page, setPage] = useState(1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { allItems, search, searchResults, error } = useSearchIndex();

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch {}
  }, []);

  // Debounce de la consulta de búsqueda (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Computar años disponibles para los filtros de fecha
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allItems.forEach((item) => {
      const year = item.metadatos?.fecha?.split("/")[2];
      if (year) years.add(parseInt(year));
    });
    return Array.from(years).sort();
  }, [allItems]);

  // Filtrar resultados por año usando useMemo para evitar cálculos innecesarios
  const dateFilteredResults = useMemo(() => {
    if (!yearFrom && !yearTo) return searchResults;
    return searchResults.filter((item) => {
      const year = item.metadatos?.fecha?.split("/")[2];
      if (!year) return true;
      const y = parseInt(year);
      if (yearFrom && y < yearFrom) return false;
      if (yearTo && y > yearTo) return false;
      return true;
    });
  }, [searchResults, yearFrom, yearTo]);

  // Facet counts con lógica disyuntiva:
  // - Descriptores no seleccionados: cuántos resultados NUEVOS añadirían al conjunto actual
  // - Descriptores ya seleccionados: su conteo absoluto propio
  const descriptorCounts = useMemo(() => {
    const pool = debouncedQuery ? dateFilteredResults : allItems;
    const counts: Record<string, number> = {};
    for (const key of Object.keys(DESCRIPTOR_LABELS)) counts[key] = 0;

    pool.forEach((item) => {
      // Si el item ya está incluido por algún descriptor activo, no sumar de nuevo
      const alreadyIncluded =
        selectedDescriptores.length > 0 &&
        selectedDescriptores.some((d) => item.descriptores?.includes(d));

      if (!alreadyIncluded) {
        item.descriptores?.forEach((d) => {
          if (d in counts) counts[d]++;
        });
      }
    });

    // Para descriptores activos, mostrar su conteo absoluto propio
    selectedDescriptores.forEach((sel) => {
      if (sel in counts) {
        counts[sel] = pool.filter((item) => item.descriptores?.includes(sel)).length;
      }
    });

    return counts;
  }, [dateFilteredResults, allItems, debouncedQuery, selectedDescriptores]);

  // Resetear página cuando cambia la consulta o cualquier filtro
  useEffect(() => { setPage(1); }, [debouncedQuery, yearFrom, yearTo, selectedDescriptores]);

  // Filtrar por descriptores seleccionados (OR: coincide con cualquiera)
  const descriptorFilteredResults = useMemo(() => {
    if (selectedDescriptores.length === 0) return dateFilteredResults;
    return dateFilteredResults.filter((item) =>
      selectedDescriptores.some((d) => item.descriptores?.includes(d))
    );
  }, [dateFilteredResults, selectedDescriptores]);

  // Detectar scroll para aplicar sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > STICKY_SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Activar FlexSearch cuando cambia la consulta de debounce
  // Usamos un límite interno alto para obtener suficientes resultados antes de aplicar filtros
  // El límite de visualización se aplica después de filtrar por fecha y descriptores
  useEffect(() => {
    search(debouncedQuery, 500);
  }, [debouncedQuery, search]);

  // Sincronizar el historial de búsqueda con localStorage y mantener solo las últimas N entradas únicas
  useEffect(() => {
    if (!debouncedQuery.trim()) return;
    setSearchHistory((prev) => {
      const next = [
        debouncedQuery,
        ...prev.filter((q) => q !== debouncedQuery),
      ].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [debouncedQuery]);

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar atajos de teclado
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        if (query) {
          setQuery("");
        } else {
          setShowHistory(false);
        }
      }
    },
    [query],
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
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 animate-slide-down">
          <p className="font-medium">Error al cargar datos</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

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
          <div className="absolute bottom-0 left-0 right-0 h-px bg-neutral-200 dark:bg-neutral-800 animate-fade-in" />
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
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowHistory(true)}
              placeholder="Buscar resoluciones..."
              role="combobox"
              aria-expanded={showHistory && !query && searchHistory.length > 0}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-history-listbox"
              aria-label="Buscar resoluciones"
              aria-describedby="search-hint"
              autoComplete="off"
              className={`w-full pl-12 pr-12 md:pr-10 border border-neutral-300 rounded-lg text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 ${
                isSticky ? "py-1.5 shadow-sm" : "py-3 sm:py-2.5 md:py-2"
              }`}
            />
            <span id="search-hint" className="sr-only">
              Presiona Escape para limpiar la búsqueda
            </span>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:text-neutral-200 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 transition-all duration-200"
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

            {/* Search history dropdown */}
            {showHistory && !query && searchHistory.length > 0 && (
              <div
                ref={historyRef}
                id="search-history-listbox"
                role="listbox"
                aria-label="Búsquedas recientes"
                className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 animate-slide-down"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Búsquedas recientes
                  </span>
                  <button
                    onClick={() => {
                      setSearchHistory([]);
                      try { localStorage.removeItem(HISTORY_KEY); } catch {}
                      setShowHistory(false);
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors px-2 py-1.5 -mr-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Borrar historial de búsquedas"
                  >
                    Borrar
                  </button>
                </div>
                {searchHistory.map((h) => (
                  <button
                    key={h}
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(h);
                      setShowHistory(false);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <svg className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {query && (
            <p aria-live="polite" aria-atomic="true" className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center flex-wrap gap-1.5">
              {descriptorFilteredResults.length} resultado
              {descriptorFilteredResults.length !== 1 ? "s" : ""} encontrado
              {descriptorFilteredResults.length !== 1 ? "s" : ""}
              {(yearFrom || yearTo) && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                  {yearFrom ?? "…"}–{yearTo ?? "…"}
                </span>
              )}
              {selectedDescriptores.map((d) => (
                <span key={d} className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium">
                  {DESCRIPTOR_LABELS[d] ?? d}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <SearchConfigPanel
        limit={limit}
        setLimit={setLimit}
        similarityThreshold={similarityThreshold}
        setSimilarityThreshold={setSimilarityThreshold}
        relatedLimit={relatedLimit}
        setRelatedLimit={setRelatedLimit}
        yearFrom={yearFrom}
        setYearFrom={setYearFrom}
        yearTo={yearTo}
        setYearTo={setYearTo}
        availableYears={availableYears}
        selectedDescriptores={selectedDescriptores}
        setSelectedDescriptores={setSelectedDescriptores}
        descriptorCounts={descriptorCounts}
        highlightEnabled={highlightEnabled}
        setHighlightEnabled={setHighlightEnabled}
        isSearching={debouncedQuery.length > 0}
      />

      <SearchResults
        query={debouncedQuery}
        limit={limit}
        similarityThreshold={similarityThreshold}
        relatedLimit={relatedLimit}
        filteredItems={debouncedQuery.length > 0 ? descriptorFilteredResults : allItems}
        isSearching={debouncedQuery.length > 0}
        useFlexSearch={debouncedQuery.length > 0}
        highlightEnabled={highlightEnabled}
        selectedDescriptores={selectedDescriptores}
        page={page}
        setPage={setPage}
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
