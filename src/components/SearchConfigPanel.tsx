"use client";
import React from "react";
import { Filter, Calendar, Tag, TrendingUp, Highlighter, ChevronDown, ListOrdered } from "lucide-react";
import {
  DESCRIPTOR_LABELS,
  RESULTADO_LABELS,
  TIPO_LABELS,
  ResultadoType,
  TipoProcedimientoType,
} from "@/context/SearchContext";

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
  selectedDescriptores: string[];
  setSelectedDescriptores: (value: string[]) => void;
  descriptorCounts: Record<string, number>;
  highlightEnabled: boolean;
  setHighlightEnabled: (value: boolean) => void;
  selectedResultados: ResultadoType[];
  setSelectedResultados: (value: ResultadoType[]) => void;
  selectedTipos: TipoProcedimientoType[];
  setSelectedTipos: (value: TipoProcedimientoType[]) => void;
  isSearching: boolean;
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
  selectedDescriptores,
  setSelectedDescriptores,
  descriptorCounts,
  highlightEnabled,
  setHighlightEnabled,
  selectedResultados,
  setSelectedResultados,
  selectedTipos,
  setSelectedTipos,
  isSearching,
}: SearchConfigPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleReset = () => {
    setLimit(10);
    setSimilarityThreshold(0.5);
    setRelatedLimit(5);
    setYearFrom(null);
    setYearTo(null);
    setSelectedDescriptores([]);
    setSelectedResultados([]);
    setSelectedTipos([]);
  };

  const toggleDescriptor = (key: string) => {
    setSelectedDescriptores(
      selectedDescriptores.includes(key)
        ? selectedDescriptores.filter((d) => d !== key)
        : [...selectedDescriptores, key],
    );
  };

  const sortedDescriptores = React.useMemo(
    () =>
      Object.entries(DESCRIPTOR_LABELS)
        .map(([key, label]) => ({
          key,
          label,
          count: descriptorCounts[key] ?? 0,
        }))
        .filter(
          ({ count, key }) => count > 0 || selectedDescriptores.includes(key),
        )
        .sort((a, b) => b.count - a.count),
    [descriptorCounts, selectedDescriptores],
  );

  const toggleResultado = (key: ResultadoType) => {
    setSelectedResultados(
      selectedResultados.includes(key)
        ? selectedResultados.filter((r) => r !== key)
        : [...selectedResultados, key],
    );
  };

  const toggleTipo = (key: TipoProcedimientoType) => {
    setSelectedTipos(
      selectedTipos.includes(key)
        ? selectedTipos.filter((t) => t !== key)
        : [...selectedTipos, key],
    );
  };

  const hasActiveFilters =
    limit !== 10 ||
    yearFrom !== null ||
    yearTo !== null ||
    selectedDescriptores.length > 0 ||
    selectedResultados.length > 0 ||
    selectedTipos.length > 0;

  const hasAdvancedChanges =
    similarityThreshold !== 0.5 || relatedLimit !== 5 || !highlightEnabled;

  const activeCount =
    (yearFrom !== null || yearTo !== null ? 1 : 0) +
    selectedDescriptores.length +
    selectedResultados.length +
    selectedTipos.length +
    (limit !== 10 ? 1 : 0);

  return (
    <div className="mb-4 sm:mb-6">
      {/* Trigger row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="search-config-content"
        className="group w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 sm:py-2.5 text-left transition-colors duration-150 hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60 dark:focus:ring-offset-neutral-950"
      >
        <div className="flex items-center gap-2.5">
          <Filter
            className={`h-4 w-4 flex-shrink-0 transition-colors ${isExpanded ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 group-hover:text-neutral-500 dark:group-hover:text-neutral-300"}`}
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Filtros
          </span>
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-semibold tabular-nums text-white">
              {activeCount}
            </span>
          )}
          {hasAdvancedChanges && activeCount === 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Expandable body */}
      <div
        id="search-config-content"
        className={`grid transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="mt-2 rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">

            {/* ── Primary filters ── */}
            <div className="p-4 sm:p-5 space-y-5">

              {/* Date range */}
              <fieldset>
                <legend className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Período
                </legend>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="year-from" className="sr-only">Desde el año</label>
                    <div className="relative">
                      <select
                        id="year-from"
                        value={yearFrom ?? ""}
                        onChange={(e) => setYearFrom(e.target.value ? Number(e.target.value) : null)}
                        className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">Desde...</option>
                        {availableYears.map((y) => (
                          <option key={y} value={y} disabled={yearTo !== null && y > yearTo}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="year-to" className="sr-only">Hasta el año</label>
                    <div className="relative">
                      <select
                        id="year-to"
                        value={yearTo ?? ""}
                        onChange={(e) => setYearTo(e.target.value ? Number(e.target.value) : null)}
                        className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">Hasta...</option>
                        {availableYears.map((y) => (
                          <option key={y} value={y} disabled={yearFrom !== null && y < yearFrom}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <ChevronIcon />
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Resultado */}
              <fieldset>
                <legend className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                  Resultado
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(RESULTADO_LABELS) as ResultadoType[]).map((key) => {
                    const active = selectedResultados.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleResultado(key)}
                        aria-pressed={active}
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 active:scale-95 ${
                          active
                            ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-700"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                        }`}
                      >
                        {RESULTADO_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Tipo de procedimiento */}
              <fieldset>
                <legend className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                  Tipo de procedimiento
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TIPO_LABELS) as TipoProcedimientoType[]).map((key) => {
                    const active = selectedTipos.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleTipo(key)}
                        aria-pressed={active}
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 active:scale-95 ${
                          active
                            ? "border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-700"
                            : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                        }`}
                      >
                        {TIPO_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Results per page */}
              <div>
                <label
                  htmlFor="result-limit"
                  className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                >
                  <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                  Resultados por página
                </label>
                <div className="relative w-full max-w-[12rem]">
                  <select
                    id="result-limit"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>

              {/* Descriptors — only while searching */}
              {isSearching && sortedDescriptores.length > 0 && (
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      Tema jurídico
                    </span>
                    {selectedDescriptores.length > 0 && (
                      <button
                        onClick={() => setSelectedDescriptores([])}
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        aria-label="Limpiar temas seleccionados"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sortedDescriptores.map(({ key, label, count }) => {
                      const active = selectedDescriptores.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleDescriptor(key)}
                          aria-pressed={active}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 active:scale-95 ${
                            active
                              ? "border-indigo-500 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-700"
                              : "border-neutral-200 bg-white text-neutral-600 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-200"
                          }`}
                        >
                          <span>{label}</span>
                          <span
                            className={`rounded-full px-1 py-px text-[10px] font-bold tabular-nums ${
                              active
                                ? "bg-white/20 text-white"
                                : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-400 dark:text-neutral-500">
                    Los números muestran cuántas resoluciones coinciden con tu búsqueda.
                  </p>
                </div>
              )}
            </div>

            {/* ── Advanced toggle ── */}
            <div className="border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                aria-expanded={showAdvanced}
                className="flex w-full items-center justify-between px-4 sm:px-5 py-3 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  Opciones avanzadas: similitud y resaltado
                  {hasAdvancedChanges && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                  )}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${showAdvanced ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className={`grid transition-all duration-300 ease-out ${showAdvanced ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <div className="space-y-5 px-4 sm:px-5 pb-5 pt-1">

                    {/* Similarity threshold */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="similarity-threshold"
                          className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                          title="Qué tan cercana debe ser una resolución a tu búsqueda para aparecer en los resultados"
                        >
                          Precisión de coincidencias
                        </label>
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
                          {(similarityThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        id="similarity-threshold"
                        type="range"
                        min={0}
                        max={100}
                        value={similarityThreshold * 100}
                        onChange={(e) => setSimilarityThreshold(Number(e.target.value) / 100)}
                        className="h-2 w-full cursor-pointer appearance-none rounded-full transition-all duration-200"
                        style={{
                          background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${similarityThreshold * 100}%, var(--slider-track-empty) ${similarityThreshold * 100}%, var(--slider-track-empty) 100%)`,
                        }}
                      />
                      <div className="mt-1.5 flex justify-between text-[11px] text-neutral-400 dark:text-neutral-500">
                        <span>Más resultados</span>
                        <span>Solo exactos</span>
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                        {similarityThreshold <= 0.4
                          ? "Valor bajo: aparecen más resultados, aunque algunos tengan poca relación."
                          : similarityThreshold <= 0.65
                            ? "Valor recomendado: resultados relevantes sin ser demasiado estricto."
                            : "Valor alto: solo las resoluciones más cercanas a tu búsqueda. Bájalo si no encuentras resultados."}
                      </p>
                    </div>

                    {/* Related resolutions */}
                    <div>
                      <label
                        htmlFor="related-limit"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                      >
                        Resoluciones relacionadas
                      </label>
                      <div className="relative w-full max-w-[12rem]">
                        <select
                          id="related-limit"
                          value={relatedLimit}
                          onChange={(e) => setRelatedLimit(Number(e.target.value))}
                          className="w-full appearance-none rounded-md border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        >
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                        </select>
                        <ChevronIcon />
                      </div>
                    </div>

                    {/* Highlight toggle */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Highlighter className="h-4 w-4 flex-shrink-0 text-neutral-400" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Resaltado de coincidencias
                          </p>
                          {highlightEnabled && (
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <mark className="rounded-sm bg-amber-200 px-1 text-amber-900 dark:bg-amber-700/60 dark:text-amber-100">A</mark>
                                Términos de búsqueda
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                                <mark className="rounded-sm bg-indigo-200 px-1 text-indigo-900 dark:bg-indigo-700/60 dark:text-indigo-100">A</mark>
                                Temas jurídicos
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        role="switch"
                        aria-checked={highlightEnabled}
                        aria-label="Activar resaltado de coincidencias"
                        onClick={() => setHighlightEnabled(!highlightEnabled)}
                        className="flex-shrink-0 p-2.5 -m-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
                      >
                        <span
                          className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ${
                            highlightEnabled ? "bg-blue-600" : "bg-neutral-300 dark:bg-neutral-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${highlightEnabled ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer actions ── */}
            <div className="flex items-center border-t border-neutral-100 px-4 sm:px-5 py-3 dark:border-neutral-800" style={{ justifyContent: (hasActiveFilters || hasAdvancedChanges) ? "space-between" : "flex-end" }}>
              {(hasActiveFilters || hasAdvancedChanges) && (
                <button
                  onClick={handleReset}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  Restablecer todo
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-md bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900"
              >
                Listo
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
