import React, { useState, useCallback } from "react";
import { useSearchIndex, ResolutionItem, DESCRIPTOR_PATTERNS, DESCRIPTOR_LABELS, RESULTADO_LABELS, TIPO_LABELS, ResultadoType } from "@/context/SearchContext";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { FileText, Search, ClipboardCopy, Check, Share2 } from "lucide-react";
import Link from "next/link";
import { formatCitaCR, fmtFecha } from "@/utils/formatters";

const BADGE_COLORS: Record<string, string> = {
  con_lugar: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700",
  parcialmente_con_lugar: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
  sin_lugar: "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700",
  archivado: "border-neutral-400 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-600",
  rechazo_de_plano: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700",
  otro: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
};

interface ResultCardProps {
  item: ResolutionItem;
  index: number;
  highlight: (text: string) => React.ReactNode;
  onOpen: (item: ResolutionItem) => void;
}

const ResultCard = React.memo(function ResultCard({ item, index, highlight, onOpen }: ResultCardProps) {
  const [citaCopied, setCitaCopied] = useState(false);

  const copiarCita = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatCitaCR(item)).then(() => {
      setCitaCopied(true);
      setTimeout(() => setCitaCopied(false), 2000);
    }).catch(() => {});
  }, [item]);

  const resultado = item.metadatos?.resultado;
  const badgeColor = resultado ? (BADGE_COLORS[resultado] ?? BADGE_COLORS.otro) : BADGE_COLORS.otro;

  return (
    <article
      className="group relative bg-white border border-neutral-200 border-l-blue-500 transition-all hover:bg-neutral-50 hover:border-neutral-300 hover:border-l-blue-500 hover:-translate-y-px cursor-pointer dark:bg-neutral-900 dark:border-neutral-800 dark:border-l-blue-500 dark:hover:bg-neutral-800/60 dark:hover:border-neutral-700 dark:hover:border-l-blue-500 animate-slide-up overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
      style={{ animationDelay: `${Math.min(index, 4) * 0.05}s` }}
      tabIndex={0}
      role="button"
      aria-label={`Abrir resolución: ${item.titulo}`}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(item); } }}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: badge + resolution + date */}
        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          {resultado && (
            <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {RESULTADO_LABELS[resultado]}
            </span>
          )}
          <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
            {item.metadatos?.resolucion ?? ""}
          </span>
          <span className="flex-1" />
          {item.metadatos?.fecha && (
            <span className="font-mono text-xs text-neutral-400 dark:text-neutral-500">
              {fmtFecha(item.metadatos.fecha)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-medium leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          {highlight(item.titulo)}
        </h3>

        {/* Summary / preview text */}
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2 mb-3">
          {highlight(item.texto.slice(0, 250))}
          {item.texto.length > 250 && "…"}
        </p>

        {/* Footer: tipo badge + descriptors + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {item.metadatos?.tipo_procedimiento && (
            <span className="border border-neutral-200 dark:border-neutral-700 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {TIPO_LABELS[item.metadatos.tipo_procedimiento]}
            </span>
          )}
          {item.descriptores && item.descriptores.slice(0, 3).map((d) => (
            <span key={d} className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-neutral-700 px-1.5 py-px">
              {DESCRIPTOR_LABELS[d] ?? d}
            </span>
          ))}
          {item.descriptores && item.descriptores.length > 3 && (
            <span className="text-[11px] text-neutral-400">+{item.descriptores.length - 3}</span>
          )}
          <span className="flex-1" />
          {/* Cite button */}
          <button
            onClick={copiarCita}
            title={citaCopied ? "¡Copiado!" : "Copiar cita"}
            className={`inline-flex items-center gap-1 border px-3 py-2 sm:px-2 sm:py-1 text-[11px] font-medium transition-all ${
              citaCopied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {citaCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
            {citaCopied ? "Copiado" : "Citar"}
          </button>
          {item.metadatos?.resolucion && (
            <Link
              href={`/grafo/#res=${item.metadatos.resolucion}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 border border-neutral-200 bg-white px-3 py-2 sm:px-2 sm:py-1 text-[11px] font-medium text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 transition-colors"
              title="Ver en red de citas"
            >
              <Share2 className="w-3 h-3" />
            </Link>
          )}
          {item.metadatos?.archivo_origen && (
            <a
              href={item.metadatos.archivo_origen}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 border border-neutral-200 bg-white px-3 py-2 sm:px-2 sm:py-1 text-[11px] font-medium text-neutral-500 hover:border-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 transition-colors"
              title="Ver PDF"
            >
              <FileText className="w-3 h-3" />
            </a>
          )}
        </div>
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
  onOpenItem?: (item: ResolutionItem) => void;
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
  onOpenItem,
}: SearchResultsProps) {
  const { indexReady } = useSearchIndex();

  const queryPatterns = React.useMemo(
    () => (highlightEnabled ? buildQueryPatterns(query) : []),
    [query, highlightEnabled],
  );
  const descriptorPatterns = React.useMemo(
    () => highlightEnabled
      ? DESCRIPTOR_PATTERNS.filter(([key]) => selectedDescriptores.includes(key)).map(([, pattern]) => pattern)
      : [],
    [selectedDescriptores, highlightEnabled],
  );

  const highlight = React.useCallback(
    (text: string) => highlightEnabled ? highlightText(text, queryPatterns, descriptorPatterns) : text,
    [highlightEnabled, queryPatterns, descriptorPatterns],
  );

  const allResults = React.useMemo(() => {
    if (!query) return [];
    if (useFlexSearch) return filteredItems;
    const lowerQuery = query.toLowerCase();
    return filteredItems.filter(
      (item) => item.titulo.toLowerCase().includes(lowerQuery) || item.texto.toLowerCase().includes(lowerQuery),
    );
  }, [query, filteredItems, useFlexSearch]);

  const totalPages = Math.max(1, Math.ceil(allResults.length / limit));
  const safePage = Math.min(page, totalPages);

  const searchResults = React.useMemo(
    () => allResults.slice((safePage - 1) * limit, safePage * limit),
    [allResults, safePage, limit],
  );

  const goToPage = (p: number) => {
    setPage?.(p);
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
  };

  const pageItems = React.useMemo(() =>
    Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
      .reduce<(number | "…")[]>((acc, p, idx, arr) => {
        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
        acc.push(p);
        return acc;
      }, []),
  [totalPages, safePage]);

  const handleOpenItem = React.useCallback((item: ResolutionItem) => {
    onOpenItem?.(item);
  }, [onOpenItem]);

  if (!indexReady) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-14 text-center">
        <div className="relative mb-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400"></div>
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">Preparando el índice de resoluciones</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Este paso ocurre una sola vez.</p>
      </div>
    );
  }

  if (!isSearching) {
    return (
      <div className="py-10 sm:py-14 text-center">
        <FileText className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-2 text-base font-semibold text-neutral-700 dark:text-neutral-300">
          Busca en las resoluciones de PRODHAB
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          Escribe una pregunta, un tema o un número de expediente como{" "}
          <span className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5">138-07-2023-DEN</span>.
        </p>
        {totalItems > 0 && (
          <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-600">
            {totalItems.toLocaleString("es-CR")} resoluciones disponibles
          </p>
        )}
      </div>
    );
  }

  if (isSearching && searchResults.length === 0) {
    return (
      <div className="py-10 sm:py-12 text-center">
        <Search className="mx-auto mb-4 h-8 w-8 text-neutral-300 dark:text-neutral-600" aria-hidden="true" />
        <h2 className="mb-1 text-base font-semibold text-neutral-700 dark:text-neutral-300">
          Sin resultados para &ldquo;{query}&rdquo;
        </h2>
        <div className="mt-4 text-left max-w-xs mx-auto space-y-2">
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Sugerencias</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Usar menos palabras o una sola palabra clave</p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Bajar el control de Precisión en el panel de filtros para ampliar resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-3">
        <h2 className="sr-only">Resultados de búsqueda</h2>
        {searchResults.map((item, index) => (
          <ResultCard
            key={item.id}
            item={item}
            index={index}
            highlight={highlight}
            onOpen={handleOpenItem}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginación de resultados" className="mt-6">
          <div className="flex items-center justify-between gap-2 sm:hidden">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
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
              className="border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            >
              Siguiente ›
            </button>
          </div>

          <div className="hidden sm:flex items-center justify-center gap-1">
            <button
              onClick={() => goToPage(safePage - 1)}
              disabled={safePage === 1}
              aria-label="Página anterior"
              className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            >
              ‹ Anterior
            </button>
            <div className="flex items-center gap-1">
              {pageItems.map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-sm text-neutral-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p as number)}
                    aria-current={p === safePage ? "page" : undefined}
                    className={`min-w-[2.25rem] border px-2.5 py-2 text-sm font-medium transition-all ${
                      p === safePage
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => goToPage(safePage + 1)}
              disabled={safePage === totalPages}
              aria-label="Página siguiente"
              className="border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:pointer-events-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
            >
              Siguiente ›
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
