"use client";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useSearchIndex,
  DESCRIPTOR_LABELS,
  RESULTADO_LABELS,
  TIPO_LABELS,
  ResultadoType,
  TipoProcedimientoType,
} from "@/context/SearchContext";
import { SearchConfigPanel } from "./SearchConfigPanel";
import { SearchResults } from "./SearchResults";

const HISTORY_KEY = "ps_search_history";

const MAX_INLINE_CHIPS = 5;

interface DescriptorChipStripProps {
  isSearching: boolean;
  descriptorCounts: Record<string, number>;
  selectedDescriptores: string[];
  setSelectedDescriptores: (value: string[]) => void;
}

function DescriptorChipStrip({
  isSearching,
  descriptorCounts,
  selectedDescriptores,
  setSelectedDescriptores,
}: DescriptorChipStripProps) {
  const topChips = useMemo(() => {
    if (!isSearching) return [];
    return Object.entries(descriptorCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, MAX_INLINE_CHIPS)
      .map(([key, count]) => ({ key, label: DESCRIPTOR_LABELS[key] ?? key, count }));
  }, [isSearching, descriptorCounts]);

  if (topChips.length === 0) return null;

  const activeKey = selectedDescriptores.length === 1 ? selectedDescriptores[0] : null;
  const hasActiveChip = activeKey !== null && topChips.some((c) => c.key === activeKey);

  const handleChip = (key: string) => {
    if (selectedDescriptores.includes(key)) {
      setSelectedDescriptores([]);
    } else {
      setSelectedDescriptores([key]);
    }
  };

  return (
    <div className="mb-4" aria-label="Refinar por tema">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {hasActiveChip ? "Filtrando por tema" : "Refinar por tema"}
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Temas jurídicos">
        {topChips.map(({ key, label, count }, index) => {
          const active = selectedDescriptores.includes(key);
          return (
            <button
              key={key}
              onClick={() => handleChip(key)}
              aria-pressed={active}
              className={`animate-chip-in inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:scale-95 ${
                active
                  ? "border-indigo-500 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200"
              }`}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span>{label}</span>
              <span
                className={`rounded-full px-1 py-px text-[10px] font-bold tabular-nums ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
const MAX_HISTORY = 8;
const STICKY_SCROLL_THRESHOLD = 100; // px desde arriba antes de que la barra de búsqueda se fije

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
  const [selectedDescriptores, setSelectedDescriptores] = useState<string[]>(
    [],
  );
  const [selectedResultados, setSelectedResultados] = useState<ResultadoType[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<TipoProcedimientoType[]>([]);
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [page, setPage] = useState(1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const { allItems, search, searchResults, error } = useSearchIndex();

  // Cargar historial de búsqueda desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setSearchHistory(JSON.parse(stored));
    } catch {}
  }, []);

  // Debounce de la consulta de búsqueda (300ms)
  const debouncedQuery = useDebounce(query, 300);

  // Computar años disponibles para los filtros de fecha — usa anio (int) directamente
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allItems.forEach((item) => {
      const y = item.metadatos?.anio;
      if (y) years.add(y);
    });
    return Array.from(years).sort();
  }, [allItems]);

  // Filtrar resultados por año usando useMemo para evitar cálculos innecesarios
  const dateFilteredResults = useMemo(() => {
    if (!yearFrom && !yearTo) return searchResults;
    return searchResults.filter((item) => {
      const y = item.metadatos?.anio;
      if (!y) return true;
      if (yearFrom && y < yearFrom) return false;
      if (yearTo && y > yearTo) return false;
      return true;
    });
  }, [searchResults, yearFrom, yearTo]);

  // Facet counts: muestra el conteo absoluto de cada descriptor en el pool actual
  // Esto es más intuitivo: el usuario ve cuántos resultados tienen cada tema
  const descriptorCounts = useMemo(() => {
    const pool = debouncedQuery ? dateFilteredResults : allItems;
    const counts: Record<string, number> = {};
    for (const key of Object.keys(DESCRIPTOR_LABELS)) counts[key] = 0;

    pool.forEach((item) => {
      item.descriptores?.forEach((d) => {
        if (d in counts) counts[d]++;
      });
    });

    return counts;
  }, [dateFilteredResults, allItems, debouncedQuery]);

  // Resetear página cuando cambia la consulta o cualquier filtro
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, yearFrom, yearTo, selectedDescriptores, selectedResultados, selectedTipos]);

  // Filtrar por descriptores seleccionados (OR: coincide con cualquiera)
  const descriptorFilteredResults = useMemo(() => {
    if (selectedDescriptores.length === 0) return dateFilteredResults;
    return dateFilteredResults.filter((item) =>
      selectedDescriptores.some((d) => item.descriptores?.includes(d)),
    );
  }, [dateFilteredResults, selectedDescriptores]);

  // Filtrar por resultado (OR)
  const resultadoFilteredResults = useMemo(() => {
    if (selectedResultados.length === 0) return descriptorFilteredResults;
    return descriptorFilteredResults.filter((item) =>
      item.metadatos?.resultado
        ? selectedResultados.includes(item.metadatos.resultado)
        : false,
    );
  }, [descriptorFilteredResults, selectedResultados]);

  // Filtrar por tipo de procedimiento (OR)
  const tipoFilteredResults = useMemo(() => {
    if (selectedTipos.length === 0) return resultadoFilteredResults;
    return resultadoFilteredResults.filter((item) =>
      item.metadatos?.tipo_procedimiento
        ? selectedTipos.includes(item.metadatos.tipo_procedimiento)
        : false,
    );
  }, [resultadoFilteredResults, selectedTipos]);

  // Detectar scroll para aplicar sticky — throttled via rAF to one update per frame
  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setIsSticky(window.scrollY > STICKY_SCROLL_THRESHOLD);
        rafId = null;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
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

  // Cerrar el desplegable de historial al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        historyRef.current &&
        !historyRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowHistory(false);
        setActiveHistoryIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Manejar atajos de teclado — incluye navegación por el historial (combobox ARIA pattern)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const historyVisible = showHistory && !query && searchHistory.length > 0;

      if (e.key === "ArrowDown") {
        if (!historyVisible) return;
        e.preventDefault();
        setActiveHistoryIndex((prev) =>
          prev < searchHistory.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        if (!historyVisible) return;
        e.preventDefault();
        setActiveHistoryIndex((prev) =>
          prev > 0 ? prev - 1 : searchHistory.length - 1,
        );
      } else if (e.key === "Enter") {
        if (historyVisible && activeHistoryIndex >= 0) {
          e.preventDefault();
          setQuery(searchHistory[activeHistoryIndex]);
          setShowHistory(false);
          setActiveHistoryIndex(-1);
        }
      } else if (e.key === "Escape") {
        if (historyVisible) {
          setShowHistory(false);
          setActiveHistoryIndex(-1);
        } else if (query) {
          setQuery("");
        }
      }
    },
    [query, showHistory, searchHistory, activeHistoryIndex],
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
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 animate-slide-down"
        >
          <p className="font-medium">No se pudo cargar el índice de resoluciones</p>
          <p className="text-sm mt-0.5">{error}. Recarga la página para intentarlo de nuevo.</p>
        </div>
      )}

      {/* Sticky Search Bar */}
      <div
        className={`sticky top-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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
              onFocus={() => { setShowHistory(true); setActiveHistoryIndex(-1); }}
              placeholder="Buscar por texto, expediente o tema jurídico..."
              role="combobox"
              aria-expanded={showHistory && !query && searchHistory.length > 0}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-history-listbox"
              aria-activedescendant={
                showHistory && !query && activeHistoryIndex >= 0
                  ? `history-option-${activeHistoryIndex}`
                  : undefined
              }
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
                      try {
                        localStorage.removeItem(HISTORY_KEY);
                      } catch {}
                      setShowHistory(false);
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors px-2 py-1.5 -mr-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    aria-label="Borrar historial de búsquedas"
                  >
                    Borrar
                  </button>
                </div>
                {searchHistory.map((h, idx) => (
                  <button
                    key={h}
                    id={`history-option-${idx}`}
                    role="option"
                    aria-selected={idx === activeHistoryIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setQuery(h);
                      setShowHistory(false);
                      setActiveHistoryIndex(-1);
                    }}
                    onMouseEnter={() => setActiveHistoryIndex(idx)}
                    onMouseLeave={() => setActiveHistoryIndex(-1)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 transition-colors text-left ${
                      idx === activeHistoryIndex
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <svg
                      className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0"
                      aria-hidden="true"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="truncate">{h}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {query && (
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center flex-wrap gap-1.5"
            >
              {tipoFilteredResults.length === 1
                ? "1 resolución encontrada"
                : `${tipoFilteredResults.length} resoluciones encontradas`}
              {(yearFrom || yearTo) && (
                <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium">
                  {yearFrom ?? "…"}–{yearTo ?? "…"}
                </span>
              )}
              {selectedDescriptores.map((d) => (
                <span
                  key={d}
                  className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium"
                >
                  {DESCRIPTOR_LABELS[d] ?? d}
                </span>
              ))}
              {selectedResultados.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium"
                >
                  {RESULTADO_LABELS[r] ?? r}
                </span>
              ))}
              {selectedTipos.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-neutral-200 px-1.5 py-0.5 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200 font-medium"
                >
                  {TIPO_LABELS[t] ?? t}
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
        selectedResultados={selectedResultados}
        setSelectedResultados={setSelectedResultados}
        selectedTipos={selectedTipos}
        setSelectedTipos={setSelectedTipos}
        isSearching={debouncedQuery.length > 0}
      />

      <DescriptorChipStrip
        isSearching={debouncedQuery.length > 0}
        descriptorCounts={descriptorCounts}
        selectedDescriptores={selectedDescriptores}
        setSelectedDescriptores={setSelectedDescriptores}
      />

      <SearchResults
        query={debouncedQuery}
        limit={limit}
        similarityThreshold={similarityThreshold}
        relatedLimit={relatedLimit}
        filteredItems={
          debouncedQuery.length > 0 ? tipoFilteredResults : allItems
        }
        isSearching={debouncedQuery.length > 0}
        useFlexSearch={debouncedQuery.length > 0}
        highlightEnabled={highlightEnabled}
        selectedDescriptores={selectedDescriptores}
        page={page}
        setPage={setPage}
        totalItems={allItems.length}
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
