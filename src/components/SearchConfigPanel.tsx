import React from "react";
import { Settings, Filter, TrendingUp, Calendar } from "lucide-react";

interface SearchConfigPanelProps {
  limit: number;
  setLimit: (value: number) => void;
  similarityThreshold: number;
  setSimilarityThreshold: (value: number) => void;
  relatedLimit: number;
  setRelatedLimit: (value: number) => void;
  yearFrom: number | null;
  setYearFrom: (value: number | null) => void;
  yearTo: number | null;
  setYearTo: (value: number | null) => void;
  availableYears: number[];
}

export function SearchConfigPanel({
  limit,
  setLimit,
  similarityThreshold,
  setSimilarityThreshold,
  relatedLimit,
  setRelatedLimit,
  yearFrom,
  setYearFrom,
  yearTo,
  setYearTo,
  availableYears,
}: SearchConfigPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleReset = () => {
    setLimit(10);
    setSimilarityThreshold(0.5);
    setRelatedLimit(5);
    setYearFrom(null);
    setYearTo(null);
  };

  const hasActiveFilters =
    limit !== 10 || similarityThreshold !== 0.5 || relatedLimit !== 5 || yearFrom !== null || yearTo !== null;

  return (
    <div className="mb-4 sm:mb-6">
      {/* Encabezado compacto - siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="search-config-content"
        className="w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3 sm:p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-blue-800 dark:focus:ring-offset-neutral-950"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-50 flex-shrink-0 dark:bg-blue-900/30">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-left min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              Configuración de búsqueda
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {hasActiveFilters
                ? "Filtros personalizados activos"
                : "Haz clic para personalizar resultados"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" aria-hidden="true" />
          )}
          <svg
            className={`h-5 w-5 text-neutral-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Panel expandible */}
      <div
        id="search-config-content"
        className={`grid transition-all duration-300 ease-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
        <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Configuración de resultados */}
            <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
                <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Límites de resultados
                </h3>
              </div>

              <div>
                <label
                  htmlFor="result-limit"
                  className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Resultados principales
                </label>
                <div className="relative">
                  <select
                    id="result-limit"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 pr-10 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-blue-700"
                  >
                    <option value={5}>5 resultados</option>
                    <option value={10}>10 resultados</option>
                    <option value={20}>20 resultados</option>
                    <option value={50}>50 resultados</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="related-limit"
                  className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Resoluciones relacionadas
                </label>
                <div className="relative">
                  <select
                    id="related-limit"
                    value={relatedLimit}
                    onChange={(e) => setRelatedLimit(Number(e.target.value))}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 pr-10 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-blue-700"
                  >
                    <option value={3}>3 relacionadas</option>
                    <option value={5}>5 relacionadas</option>
                    <option value={10}>10 relacionadas</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de similitud */}
            <div className="space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
              <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Precisión de similitud
                </h3>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label
                    htmlFor="similarity-threshold"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Umbral mínimo
                  </label>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white tabular-nums">
                    {(similarityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  id="similarity-threshold"
                  type="range"
                  min={0}
                  max={100}
                  value={similarityThreshold * 100}
                  onChange={(e) =>
                    setSimilarityThreshold(Number(e.target.value) / 100)
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-full transition-all duration-200"
                  style={{
                    background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${similarityThreshold * 100}%, var(--slider-track-empty) ${similarityThreshold * 100}%, var(--slider-track-empty) 100%)`,
                  }}
                />
                <div className="mt-2 flex justify-between text-xs text-neutral-500">
                  <span>Más resultados</span>
                  <span>Más precisos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rango de fechas */}
          <div className="mt-6 space-y-4 rounded-lg border border-neutral-100 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-700">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Rango de fechas
              </h3>
              {(yearFrom || yearTo) && (
                <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {yearFrom ?? "…"} – {yearTo ?? "…"}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="year-from" className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Desde
                </label>
                <div className="relative">
                  <select
                    id="year-from"
                    value={yearFrom ?? ""}
                    onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-blue-700"
                  >
                    <option value="">Cualquier año</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y} disabled={yearTo !== null && y > yearTo}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="year-to" className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Hasta
                </label>
                <div className="relative">
                  <select
                    id="year-to"
                    value={yearTo ?? ""}
                    onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-blue-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-blue-700"
                  >
                    <option value="">Cualquier año</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y} disabled={yearFrom !== null && y < yearFrom}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto rounded-lg border border-neutral-300 bg-white px-4 py-2.5 sm:py-2 text-sm font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Restablecer
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 sm:py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Listo
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
