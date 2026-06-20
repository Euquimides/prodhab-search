"use client";
import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { X, ClipboardCopy, Check, Calendar, Building2, User, Share2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ResolutionItem, RESULTADO_LABELS, TIPO_LABELS, ResultadoType, DESCRIPTOR_LABELS } from "@/context/SearchContext";
import { findMostSimilar } from "@/utils/semanticSimilarity";
import { highlightText, buildQueryPatterns } from "@/utils/highlightText";
import { formatCitaCR, fmtFecha, parseResolutionText, splitIntoParagraphs } from "@/utils/formatters";

const RESULTADO_COLORS: Record<string, string> = {
  con_lugar: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700",
  parcialmente_con_lugar: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700",
  sin_lugar: "border-red-400 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700",
  archivado: "border-neutral-400 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-600",
  rechazo_de_plano: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700",
  otro: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700",
};

interface ReaderOverlayProps {
  item: ResolutionItem;
  query: string;
  allItems: ResolutionItem[];
  similarityThreshold: number;
  relatedLimit: number;
  highlightEnabled: boolean;
  selectedDescriptores: string[];
  onClose: () => void;
  onOpenItem: (item: ResolutionItem) => void;
}

export function ReaderOverlay({
  item,
  query,
  allItems,
  similarityThreshold,
  relatedLimit,
  highlightEnabled,
  selectedDescriptores,
  onClose,
  onOpenItem,
}: ReaderOverlayProps) {
  const [citaCopied, setCitaCopied] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    const main = document.getElementById("main-content");
    if (main) main.setAttribute("inert", "");
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
      if (main) main.removeAttribute("inert");
    };
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [item.id]);

  const copiarCita = useCallback(() => {
    navigator.clipboard.writeText(formatCitaCR(item)).then(() => {
      setCitaCopied(true);
      setTimeout(() => setCitaCopied(false), 2000);
    }).catch(() => {});
  }, [item]);

  const queryPatterns = React.useMemo(
    () => (highlightEnabled ? buildQueryPatterns(query) : []),
    [query, highlightEnabled],
  );

  const highlight = useCallback(
    (text: string) => highlightEnabled ? highlightText(text, queryPatterns, []) : text,
    [highlightEnabled, queryPatterns],
  );

  const related = React.useMemo(() => {
    if (!item.vector) return [];
    return findMostSimilar(
      item.vector,
      allItems.filter((i) => i.id !== item.id),
      relatedLimit,
      similarityThreshold,
      similarityThreshold,
    );
  }, [item, allItems, relatedLimit, similarityThreshold]);

  const parsedSections = React.useMemo(() => parseResolutionText(item.texto, item.secciones), [item.texto, item.secciones]);

  const resultado = item.metadatos?.resultado;
  const badgeColor = resultado ? (RESULTADO_COLORS[resultado] ?? RESULTADO_COLORS.otro) : RESULTADO_COLORS.otro;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end animate-overlay"
      style={{ background: "rgba(23, 23, 40, 0.4)", backdropFilter: "blur(2px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="w-[min(720px,94vw)] h-full overflow-y-auto bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800 animate-slide-in-right"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Barra superior */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
          <button
            onClick={onClose}
            className="w-9 h-9 grid place-items-center border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:text-blue-600 hover:border-blue-400 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="flex-1 font-mono text-xs text-neutral-400 dark:text-neutral-500 truncate">
            {item.metadatos?.resolucion ?? item.metadatos?.expediente ?? ""}
          </span>
          <button
            onClick={copiarCita}
            title={citaCopied ? "¡Copiado!" : "Copiar cita"}
            className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              citaCopied
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border-neutral-200/80 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {citaCopied ? <Check className="w-3 h-3" /> : <ClipboardCopy className="w-3 h-3" />}
            {citaCopied ? "Copiado" : "Citar"}
          </button>
          {item.metadatos?.resolucion && (
            <Link
              href={`/grafo/#res=${item.metadatos.resolucion}`}
              className="inline-flex items-center gap-1.5 border border-neutral-200/80 bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-blue-400 hover:text-blue-600 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:text-blue-400 transition-colors"
              title="Ver esta resolución en la red de citas"
            >
              <Share2 className="w-3 h-3" />
              Red de citas
            </Link>
          )}
          {item.metadatos?.archivo_origen && (
            <a
              href={item.metadatos.archivo_origen}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-neutral-200/80 bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-300 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-400 transition-colors"
              title="Ver PDF"
            >
              <ExternalLink className="w-3 h-3" />
              Ver PDF
            </a>
          )}
        </div>

        {/* Contenido */}
        <div className="max-w-[760px] mx-auto px-6 sm:px-10 py-8 pb-20">
          {/* Insignias */}
          <div className="flex flex-wrap items-center gap-2">
            {resultado && (
              <span className={`inline-flex items-center border rounded-md px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ${badgeColor}`}>
                {RESULTADO_LABELS[resultado]}
              </span>
            )}
            {item.metadatos?.tipo_procedimiento && (
              <span className="inline-flex items-center border border-neutral-200/80 dark:border-neutral-700/80 rounded-md px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {TIPO_LABELS[item.metadatos.tipo_procedimiento]}
              </span>
            )}
          </div>

          {/* Título */}
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight mt-4 mb-5 leading-snug text-neutral-900 dark:text-neutral-100">
            {highlight(item.titulo)}
          </h1>

          {/* Cuadrícula de metadatos */}
          <div className="grid grid-cols-2 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl mb-6 bg-neutral-200/80 dark:bg-neutral-700/80 overflow-hidden" style={{ gap: "1px" }}>
            <div className="bg-white dark:bg-neutral-900 p-3 min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">N.° de resolución</div>
              <div className="text-sm font-mono text-neutral-900 dark:text-neutral-100 break-words">{item.metadatos?.resolucion ?? "—"}</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Expediente</div>
              <div className="text-sm font-mono text-neutral-900 dark:text-neutral-100 break-words">{item.metadatos?.expediente ?? "—"}</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Fecha</div>
              <div className="text-sm font-mono text-neutral-900 dark:text-neutral-100">{item.metadatos?.fecha ? fmtFecha(item.metadatos.fecha) : "—"}</div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">Denunciado(a)</div>
              <div className="text-sm text-neutral-900 dark:text-neutral-100 break-words">{item.metadatos?.denunciado ?? "—"}</div>
            </div>
          </div>

          {/* Firmante */}
          {item.metadatos?.firmante && (
            <p className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500 mb-6">
              <User className="w-3 h-3" />
              {item.metadatos.firmante}
            </p>
          )}

          {/* Secciones legales procesadas */}
          {parsedSections.map((sec, i) => (
            <div key={i} className="mb-8">
              <div className="flex items-center gap-3 mb-3 whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  {sec.label}
                </span>
                <span className="flex-1 h-px bg-neutral-200/60 dark:bg-neutral-800/60" />
              </div>
              {sec.label === "Encabezado" ? (
                <p className="text-base leading-relaxed text-blue-950 dark:text-blue-100 bg-blue-50/40 dark:bg-blue-950/20 rounded-lg px-4 py-3 font-light max-w-[65ch]">
                  {highlight(sec.text)}
                </p>
              ) : (
                <div className="text-base leading-relaxed text-neutral-800 dark:text-neutral-200 max-w-[65ch]">
                  {splitIntoParagraphs(sec.text).map((p, j) => (
                    <p key={j} className="mb-3">{highlight(p)}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Sección: Temas */}
          {item.descriptores && item.descriptores.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3 whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Temas jurídicos
                </span>
                <span className="flex-1 h-px bg-neutral-200/60 dark:bg-neutral-800/60" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.descriptores.map((d) => (
                  <span key={d} className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/80 rounded-md px-2 py-0.5 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-default">
                    {DESCRIPTOR_LABELS[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Resoluciones citadas */}
          {item.metadatos?.resoluciones_citadas && item.metadatos.resoluciones_citadas.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3 whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Resoluciones citadas
                </span>
                <span className="flex-1 h-px bg-neutral-200/60 dark:bg-neutral-800/60" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.metadatos.resoluciones_citadas.map((r) => (
                  <span key={r} className="font-mono text-[11px] bg-neutral-100/80 dark:bg-neutral-800 rounded-md text-neutral-600 dark:text-neutral-400 px-2 py-0.5">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sección: Relacionadas */}
          {related.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-3 whitespace-nowrap">
                <span className="text-[11px] font-medium uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Resoluciones relacionadas
                </span>
                <span className="flex-1 h-px bg-neutral-200/60 dark:bg-neutral-800/60" />
              </div>
              <div className="space-y-2">
                {related.map((r) => (
                  <div
                    key={r.item.id}
                    className="p-3 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl bg-white dark:bg-neutral-900 cursor-pointer hover:border-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    role="button"
                    tabIndex={0}
                    aria-label={`Abrir resolución: ${r.item.titulo}`}
                    onClick={() => onOpenItem(r.item)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpenItem(r.item); } }}
                  >
                    <span className="font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
                      {r.item.metadatos?.resolucion ?? r.item.metadatos?.expediente ?? ""}
                    </span>
                    <div className="text-sm font-semibold mt-1 text-neutral-900 dark:text-neutral-100">
                      {r.item.titulo}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {r.item.metadatos?.resultado && (
                        <span className={`inline-flex items-center border rounded-md px-1.5 py-px text-[11px] font-medium uppercase ${RESULTADO_COLORS[r.item.metadatos.resultado] ?? RESULTADO_COLORS.otro}`}>
                          {RESULTADO_LABELS[r.item.metadatos.resultado]}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-neutral-400">
                        {Math.round(r.similarity * 100)}% similitud
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
