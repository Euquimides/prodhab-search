import React, { useState } from "react";
import { useSearchIndex, ResolutionItem, DESCRIPTOR_PATTERNS } from "@/context/SearchContext";
import { findMostSimilar } from "@/utils/semanticSimilarity";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { RelatedResolutions } from "./RelatedResolutions";
import { FileText, Calendar, Download } from "lucide-react";

interface ResultCardProps {
  item: ResolutionItem;
  index: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  related: { item: ResolutionItem; similarity: number }[];
  highlight: (text: string) => React.ReactNode;
  similarityThreshold: number;
  relatedLimit: number;
}

const ResultCard = React.memo(function ResultCard({
  item,
  index,
  isExpanded,
  onToggle,
  related,
  highlight,
  similarityThreshold,
  relatedLimit,
}: ResultCardProps) {
  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 4) * 0.05}s` }}
    >
      <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" aria-hidden="true" />
      <div className="p-4 sm:p-6 pl-6 sm:pl-8">
        {/* Botón descarga */}
        {item.metadatos?.archivo_origen && (
          <div className="mb-3 flex justify-end">
            <a
              href={item.metadatos.archivo_origen}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Descargar resolución${item.metadatos?.resolucion ? ": " + item.metadatos.resolucion : item.metadatos?.expediente ? " " + item.metadatos.expediente : ""}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 hover:shadow-sm active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
              title="Descargar Resolución"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Descargar</span>
            </a>
          </div>
        )}

        {/* Etiquetas de Metadatos */}
        <div className="mb-4 flex flex-wrap gap-2">
          {item.metadatos?.expediente && (
            <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              Exp: {item.metadatos.expediente}
            </span>
          )}
          {item.metadatos?.resolucion && (
            <span className="rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Res: {item.metadatos.resolucion}
            </span>
          )}
          {item.metadatos?.fecha && (
            <span className="rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {item.metadatos.fecha}
            </span>
          )}
        </div>

        <div className="mb-4 text-neutral-700 dark:text-neutral-300">
          <p
            id={`card-text-${item.id}`}
            className={`text-sm sm:text-base leading-relaxed break-words ${!isExpanded ? "line-clamp-3" : ""}`}
          >
            {highlight(isExpanded ? item.texto : item.texto.slice(0, 300))}
            {!isExpanded && item.texto.length > 300 && "..."}
          </p>
          {item.texto.length > 300 && (
            <button
              onClick={() => onToggle(item.id)}
              aria-expanded={isExpanded}
              aria-controls={`card-text-${item.id}`}
              className="mt-1 py-2 -my-2 px-1 -mx-1 inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 transition-colors"
            >
              {isExpanded ? "Ver menos" : "Ver más"}
            </button>
          )}
        </div>

        {/* Resoluciones relacionadas */}
        {related.length > 0 && (
          <div className="mt-6 border-t border-neutral-100 pt-6 dark:border-neutral-800">
            <RelatedResolutions
              items={related.map((r) => ({
                id: r.item.id,
                titulo: r.item.titulo,
                expediente: r.item.metadatos?.expediente,
                resolucion: r.item.metadatos?.resolucion,
                date: r.item.metadatos?.fecha,
                similarity: r.similarity,
                texto: r.item.texto,
                archivo_origen: r.item.metadatos?.archivo_origen,
              }))}
              minSimilarity={similarityThreshold}
              maxItems={relatedLimit}
              showVisualization={true}
              highlight={highlight}
            />
          </div>
        )}
      </div>
    </article>
  );
});

interface SearchResultsProps {
  query: string;
  limit: number;
  similarityThreshold: number;
  relatedLimit: number;
  filteredItems: ResolutionItem[];
  useFlexSearch?: boolean;
  isSearching?: boolean;
  highlightEnabled?: boolean;
  selectedDescriptores?: string[];
  page?: number;
  setPage?: (p: number) => void;
}

export function SearchResults({
  query,
  limit,
  similarityThreshold,
  relatedLimit,
  filteredItems,
  useFlexSearch = false,
  isSearching = false,
  highlightEnabled = true,
  selectedDescriptores = [],
  page = 1,
  setPage,
}: SearchResultsProps) {
  const { indexReady } = useSearchIndex();

  // Pre-calcula los patrones para resaltado
  const queryPatterns = React.useMemo(
    () => (highlightEnabled ? buildQueryPatterns(query) : []),
    [query, highlightEnabled],
  );
  const descriptorPatterns = React.useMemo(
    () =>
      highlightEnabled
        ? DESCRIPTOR_PATTERNS.filter(([key]) => selectedDescriptores.includes(key)).map(([, pattern]) => pattern)
        : [],
    [selectedDescriptores, highlightEnabled],
  );

  const highlight = React.useCallback(
    (text: string) =>
      highlightEnabled
        ? highlightText(text, queryPatterns, descriptorPatterns)
        : text,
    [highlightEnabled, queryPatterns, descriptorPatterns],
  );
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set(),
  );

  // Conjunto completo de resultados (sin paginar) para calcular totalPages
  const allResults = React.useMemo(() => {
    if (!query) return [];
    if (useFlexSearch) return filteredItems;
    const lowerQuery = query.toLowerCase();
    return filteredItems.filter(
      (item) =>
        item.titulo.toLowerCase().includes(lowerQuery) ||
        item.texto.toLowerCase().includes(lowerQuery),
    );
  }, [query, filteredItems, useFlexSearch]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / limit));
  const safePage = Math.min(page, totalPages);

  // Página actual
  const searchResults = React.useMemo(
    () => allResults.slice((safePage - 1) * limit, safePage * limit),
    [allResults, safePage, limit],
  );

  const goToPage = (p: number) => {
    setPage?.(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Memoriza el cálculo de elementos relacionados para evitar recalcular en cada renderizado
  const relatedItemsCache = React.useMemo(() => {
    const cache = new Map<
      string,
      { item: ResolutionItem; similarity: number }[]
    >();

    for (const item of searchResults) {
      if (item.vector) {
        const related = findMostSimilar(
          item.vector,
          filteredItems.filter((i) => i.id !== item.id),
          relatedLimit,
          similarityThreshold,
          similarityThreshold,
        );
        cache.set(item.id, related);
      }
    }

    return cache;
  }, [searchResults, filteredItems, relatedLimit, similarityThreshold]);

  const toggleExpanded = React.useCallback((id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Página de números pre-calculada para evitar reconstruir el array en cada render
  const pageItems = React.useMemo(() =>
    Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
        acc.push(p);
        return acc;
      }, []),
  [totalPages, safePage]);

  // Si el índice no está listo, muestra pantalla de carga
  if (!indexReady) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-12 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="relative mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          Preparando búsqueda
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Cargando índice...
        </p>
      </div>
    );
  }

  // Si no se está buscando, muestra mensaje inicial
  if (!isSearching) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-12 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30" aria-hidden="true">
          <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Comienza tu búsqueda
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ingresa términos de búsqueda para encontrar resoluciones relevantes
        </p>
      </div>
    );
  }

  // Si se está buscando y no hay resultados, muestra mensaje de no encontrado
  if (isSearching && searchResults.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800" aria-hidden="true">
          <svg
            className="h-8 w-8 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          No se encontraron resultados
        </h2>
        <p className="mb-1 text-neutral-600 dark:text-neutral-400">
          No hay coincidencias para{" "}
          <span className="font-semibold">"{query}"</span>
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Intenta con otros términos o ajusta los filtros de búsqueda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles Expandir/Colapsar Todos */}
      {searchResults.length > 0 && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() =>
              setExpandedResults(new Set(searchResults.map((item) => item.id)))
            }
            aria-label="Ver texto completo de todos los resultados"
            className="py-2 -my-2 px-1 -mx-1 text-xs text-blue-600 hover:underline dark:text-blue-400 transition-colors"
          >
            Ver todos
          </button>
          <span className="text-neutral-300 dark:text-neutral-700" aria-hidden="true">·</span>
          <button
            onClick={() => setExpandedResults(new Set())}
            aria-label="Colapsar texto de todos los resultados"
            className="py-2 -my-2 px-1 -mx-1 text-xs text-neutral-500 hover:underline dark:text-neutral-400 transition-colors"
          >
            Colapsar todos
          </button>
        </div>
      )}

      {/* Cuadrícula de Resultados */}
      <div className="space-y-4">
        <h2 className="sr-only">Resultados de búsqueda</h2>
        {searchResults.map((item, index) => (
          <ResultCard
            key={item.id}
            item={item}
            index={index}
            isExpanded={expandedResults.has(item.id)}
            onToggle={toggleExpanded}
            related={relatedItemsCache.get(item.id) ?? []}
            highlight={highlight}
            similarityThreshold={similarityThreshold}
            relatedLimit={relatedLimit}
          />
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <nav aria-label="Paginación de resultados" className="mt-6">
          {/* Vista móvil: Anterior / Página X de Y / Siguiente */}
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              ‹ Anterior
            </button>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Siguiente ›
            </button>
          </div>

          {/* Vista escritorio: barra completa con números de página */}
          <div className="hidden sm:flex items-center justify-center gap-1">
            {/* Primera página */}
            <button
              onClick={() => goToPage(1)}
              disabled={safePage === 1}
              aria-label="Primera página"
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              «
            </button>
            {/* Página anterior */}
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              ‹ Anterior
            </button>

            {/* Números de página */}
            <div className="flex items-center gap-1">
              {pageItems.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-neutral-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    aria-current={p === safePage ? "page" : undefined}
                    aria-label={`Página ${p}`}
                    className={`min-w-[2.25rem] rounded-lg border px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                      p === safePage
                        ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                        : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>

            {/* Página siguiente */}
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Siguiente ›
            </button>
            {/* Última página */}
            <button
              onClick={() => goToPage(totalPages)}
              disabled={safePage === totalPages}
              aria-label="Última página"
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm text-neutral-600 transition-all duration-150 hover:bg-neutral-50 hover:border-neutral-400 disabled:pointer-events-none disabled:opacity-30 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              »
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
