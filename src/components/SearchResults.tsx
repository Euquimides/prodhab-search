import React, { useState } from "react";
import { useSearchIndex, ResolutionItem, DESCRIPTOR_PATTERNS, RESULTADO_LABELS, TIPO_LABELS, ResultadoType, TipoProcedimientoType } from "@/context/SearchContext";
import { findMostSimilar } from "@/utils/semanticSimilarity";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { RelatedResolutions } from "./RelatedResolutions";
import { FileText, Calendar, Download, ChevronDown, Building2, User, Search } from "lucide-react";

// Tres estados semánticos de resultado: positivo, negativo, neutro.
// El color codifica el significado legal del resultado; el tono no es arbitrario.
const RESULTADO_COLORS: Record<ResultadoType, string> = {
  con_lugar: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800",
  sin_lugar: "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
  parcialmente_con_lugar: "bg-emerald-50/60 text-emerald-600 border-emerald-200 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900",
  archivado: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  rechazo_de_plano: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  otro: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
};

// Badges de tipo: todos usan el mismo vocabulario neutro; el significado lo da la etiqueta, no el tono.
const TIPO_COLORS: Record<TipoProcedimientoType, string> = {
  DEN: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  RECONSIDERACION: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  REVOCATORIA: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
};

const RESULTADO_TOOLTIPS: Record<ResultadoType, string> = {
  con_lugar: "La denuncia fue aceptada: PRODHAB encontró una infracción",
  sin_lugar: "La denuncia no fue aceptada: no se encontró infracción",
  parcialmente_con_lugar: "La denuncia fue aceptada en parte",
  archivado: "El expediente fue archivado sin resolución de fondo",
  rechazo_de_plano: "La denuncia fue rechazada sin tramitarse",
  otro: "Resultado no clasificado",
};

const TIPO_TOOLTIPS: Record<TipoProcedimientoType, string> = {
  DEN: "Denuncia: procedimiento iniciado por una parte",
  RECONSIDERACION: "Reconsideración: solicitud de revisión de una resolución anterior",
  REVOCATORIA: "Revocatoria: solicitud de anulación de una resolución anterior",
};

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
  const [relatedExpanded, setRelatedExpanded] = useState(false);

  return (
    <article
      className="group rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 animate-slide-up"
      style={{ animationDelay: `${Math.min(index, 4) * 0.05}s` }}
    >
      <div className="p-4 sm:p-5">
        {/* Cabecera: identificador principal + metadatos secundarios + descarga */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {item.metadatos?.expediente && (
              <p
                className="text-base font-semibold text-neutral-900 dark:text-neutral-100 leading-snug"
                title="Número de expediente: identificador único del caso ante PRODHAB"
              >
                Expediente {item.metadatos.expediente}
              </p>
            )}
            {/* Línea secundaria: resolución + fecha formateada */}
            {(item.metadatos?.resolucion || item.metadatos?.fecha) && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                {item.metadatos?.resolucion && (
                  <span>{item.metadatos.resolucion}</span>
                )}
                {item.metadatos?.resolucion && item.metadatos?.fecha && (
                  <span className="text-neutral-300 dark:text-neutral-600" aria-hidden="true">·</span>
                )}
                {item.metadatos?.fecha && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                    {new Date(item.metadatos.fecha + "T00:00:00").toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
              </p>
            )}

            {/* Badges: resultado + tipo procedimiento */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {item.metadatos?.resultado && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${RESULTADO_COLORS[item.metadatos.resultado]}`}
                  title={RESULTADO_TOOLTIPS[item.metadatos.resultado]}
                >
                  {RESULTADO_LABELS[item.metadatos.resultado]}
                </span>
              )}
              {item.metadatos?.tipo_procedimiento && (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TIPO_COLORS[item.metadatos.tipo_procedimiento]}`}
                  title={TIPO_TOOLTIPS[item.metadatos.tipo_procedimiento]}
                >
                  {TIPO_LABELS[item.metadatos.tipo_procedimiento]}
                </span>
              )}
            </div>

            {/* Partes: denunciado + firmante */}
            <div className="mt-2 flex flex-col gap-0.5">
              {item.metadatos?.denunciado && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <Building2 className="h-3 w-3 flex-shrink-0 text-neutral-400" aria-hidden="true" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">{item.metadatos.denunciado}</span>
                </p>
              )}
              {item.metadatos?.firmante && (
                <p className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                  <User className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                  {item.metadatos.firmante}
                </p>
              )}
            </div>

            {/* Resoluciones citadas */}
            {item.metadatos?.resoluciones_citadas && item.metadatos.resoluciones_citadas.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mr-0.5">Cita:</span>
                {item.metadatos.resoluciones_citadas.map((r) => (
                  <span
                    key={r}
                    className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                  >
                    {r}
                  </span>
                ))}
              </div>
            )}

          </div>
          {item.metadatos?.archivo_origen && (
            <a
              href={item.metadatos.archivo_origen}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Descargar resolución${item.metadatos?.resolucion ? ": " + item.metadatos.resolucion : item.metadatos?.expediente ? " " + item.metadatos.expediente : ""}`}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-200"
              title="Descargar Resolución"
            >
              <Download className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          )}
        </div>

        <div className="mb-3 text-neutral-700 dark:text-neutral-300">
          <p
            id={`card-text-${item.id}`}
            className={`text-sm leading-relaxed break-words ${!isExpanded ? "line-clamp-3" : ""}`}
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

        {/* Resoluciones relacionadas — collapsed by default */}
        {related.length > 0 && (
          <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            {!relatedExpanded ? (
              <button
                onClick={() => setRelatedExpanded(true)}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors"
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                Ver {related.length} caso{related.length !== 1 ? "s" : ""} relacionado{related.length !== 1 ? "s" : ""}
              </button>
            ) : (
              <div>
                <button
                  onClick={() => setRelatedExpanded(false)}
                  className="mb-3 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5 rotate-180" aria-hidden="true" />
                  Ocultar relacionados
                </button>
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
  totalItems?: number;
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
  totalItems = 0,
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
      <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-14 text-center">
        <div className="relative mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
          Preparando el índice de resoluciones
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Este paso ocurre una sola vez. Suele tardar 2 a 5 segundos.
        </p>
      </div>
    );
  }

  // Si no se está buscando, muestra mensaje inicial
  if (!isSearching) {
    return (
      <div className="py-10 sm:py-14 text-center">
        <FileText className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-2 text-base font-semibold text-neutral-700 dark:text-neutral-300">
          Busca en las resoluciones de PRODHAB
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          Escribe una pregunta, un tema (videovigilancia, datos bancarios...) o un número de expediente como <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">138-07-2023-DEN</span>.
        </p>
        {totalItems > 0 && (
          <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-600">
            {totalItems.toLocaleString("es-CR")} resoluciones disponibles
          </p>
        )}
      </div>
    );
  }

  // Si se está buscando y no hay resultados, muestra mensaje de no encontrado
  if (isSearching && searchResults.length === 0) {
    return (
      <div className="py-10 sm:py-12 text-center">
        <Search className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-1 text-base font-semibold text-neutral-700 dark:text-neutral-300">
          Sin resultados para &ldquo;{query}&rdquo;
        </h2>
        <div className="mt-4 text-left max-w-xs mx-auto space-y-2">
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">
            Intenta lo siguiente
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Usar menos palabras o una sola palabra clave
          </p>
          {selectedDescriptores.length > 0 && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Quitar los filtros de tema activos ({selectedDescriptores.length} activo{selectedDescriptores.length !== 1 ? "s" : ""})
            </p>
          )}
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Abrir <strong className="font-medium text-neutral-700 dark:text-neutral-300">Filtros &rsaquo; Opciones avanzadas</strong> y reducir la precisión de coincidencias
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Buscar por número de expediente, ej. <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">00456-2023</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Controles Expandir/Colapsar Todos */}
      {searchResults.length > 0 && (
        <div className="mb-3 flex items-center justify-end gap-3">
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

      {/* Resultados */}
      <div className="space-y-3">
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
          </div>
        </nav>
      )}
    </div>
  );
}
