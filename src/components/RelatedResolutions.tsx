import React, { useState } from "react";
import { Calendar, FileText } from "lucide-react";
import {
  getSimilarityLabel,
  getSimilarityColor,
} from "@/utils/semanticSimilarity";

interface RelatedResolution {
  id: string;
  titulo?: string;
  expediente?: string;
  resolucion?: string;
  date?: string;
  similarity: number;
  texto?: string;
  archivo_origen?: string;
}

interface RelatedResolutionsProps {
  items: RelatedResolution[];
  minSimilarity?: number;
  maxItems?: number;
  showVisualization?: boolean;
  highlight?: (text: string) => React.ReactNode;
}

export function RelatedResolutions({
  items,
  minSimilarity = 0.5,
  maxItems = 5,
  showVisualization = true,
  highlight,
}: RelatedResolutionsProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState<{ [id: string]: boolean }>(
    {},
  );

  if (!items || items.length === 0) return null;

  // Filtra por similitud mínima
  const filteredItems = items.filter(
    (item) => item.similarity >= minSimilarity,
  );

  // Expande todos los textos relacionados
  const handleExpandAll = () => {
    const allIds = Object.fromEntries(
      filteredItems.map((item) => [item.id, true]),
    );
    setExpandedText(allIds);
  };
  // Colapsa todos los textos relacionados
  const handleCollapseAll = () => {
    const allIds = Object.fromEntries(
      filteredItems.map((item) => [item.id, false]),
    );
    setExpandedText(allIds);
  };

  if (filteredItems.length === 0) return null;

  // Muestra solo maxItems inicialmente
  const displayItems = expanded
    ? filteredItems
    : filteredItems.slice(0, maxItems);
  const hasMore = filteredItems.length > maxItems;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Resoluciones relacionadas
            <span className="ml-1.5 text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({filteredItems.length})
            </span>
          </h3>
          {showVisualization && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5  bg-blue-500" aria-hidden="true" />
                Alta
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5  bg-blue-400/60" aria-hidden="true" />
                Media
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5  bg-neutral-400" aria-hidden="true" />
                Baja
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExpandAll}
            aria-label="Expandir texto de todas las resoluciones relacionadas"
            className="py-2 -my-2 px-1 -mx-1 text-xs text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Expandir textos
          </button>
          <button
            onClick={handleCollapseAll}
            aria-label="Contraer texto de todas las resoluciones relacionadas"
            className="py-2 -my-2 px-1 -mx-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            Contraer
          </button>
        </div>
      </div>

      <ul className="space-y-2">
        {displayItems.map((item) => {
          const colors = getSimilarityColor(item.similarity);
          const label = getSimilarityLabel(item.similarity);
          const isTextExpanded = expandedText[item.id] || false;
          return (
            <li
              key={item.id}
              className={`border p-3 transition-colors ${colors.bg} ${colors.border}`}
            >
              <div className="flex flex-col gap-2">
                {/* Metadatos y botón descarga */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.expediente && (
                        <span className=" bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                          Expediente: {item.expediente}
                        </span>
                      )}
                      {item.resolucion && (
                        <span className=" bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          Resolución: {item.resolucion}
                        </span>
                      )}
                      {item.date && (
                        <span className=" bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" aria-hidden="true" />
                          {item.date}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón de descarga mínimo */}
                  {item.archivo_origen && (
                    <a
                      href={item.archivo_origen}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver PDF${item.resolucion ? ": " + item.resolucion : item.expediente ? " " + item.expediente : ""}`}
                      className="inline-flex items-center gap-1.5  border border-neutral-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-medium text-neutral-700 transition-all duration-200 hover:bg-neutral-50 hover:border-neutral-400 active:scale-95 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:border-neutral-600"
                      title="Ver PDF"
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Ver PDF</span>
                    </a>
                  )}
                </div>

                {/* Indicador de similitud */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1"
                    role="progressbar"
                    aria-valuenow={Math.round(item.similarity * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Similitud: ${label} (${Math.round(item.similarity * 100)}%)`}
                  >
                    <div className="h-1.5 w-full overflow-hidden  bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className={`h-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                          item.similarity >= 0.7
                            ? "bg-blue-500"
                            : item.similarity >= 0.6
                              ? "bg-blue-400/70"
                              : item.similarity >= 0.4
                                ? "bg-neutral-400"
                                : "bg-neutral-300"
                        }`}
                        style={{ width: `${item.similarity * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${colors.text}`} aria-hidden="true">
                    {label} ({(item.similarity * 100).toFixed(0)}%)
                  </span>
                </div>

                {/* Vista previa del texto con Ver Más/Ver Menos */}
                {item.texto && (
                  <div className="mt-2 text-neutral-700 dark:text-neutral-300">
                    <p
                      id={`rel-text-${item.id}`}
                      className={`text-sm leading-relaxed break-words ${!isTextExpanded ? "line-clamp-3" : ""}`}
                    >
                      {highlight ? highlight(item.texto) : item.texto}
                    </p>
                    {item.texto.length > 300 && (
                      <button
                        onClick={() =>
                          setExpandedText((prev) => ({
                            ...prev,
                            [item.id]: !isTextExpanded,
                          }))
                        }
                        aria-expanded={isTextExpanded}
                        aria-controls={`rel-text-${item.id}`}
                        className="mt-1 py-2 -my-2 px-1 -mx-1 inline-flex text-sm font-medium text-blue-600 hover:underline dark:text-blue-400 transition-colors"
                      >
                        {isTextExpanded ? "Ver menos" : "Ver más"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        >
          {expanded
            ? "Mostrar menos"
            : `Mostrar ${filteredItems.length - maxItems} más`}
        </button>
      )}
    </div>
  );
}
