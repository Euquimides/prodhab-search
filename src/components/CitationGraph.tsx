"use client";

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import {
  useSearchIndex,
  ResolutionItem,
  RESULTADO_LABELS,
  RESULTADO_COLORS,
} from "@/context/SearchContext";
import { useDebounce, useIsDark } from "@/utils/hooks";
import { Search, X, ChevronRight, ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";

const NODE_DEFAULT_COLOR = "#6b7280";
const EDGE_COLOR = "rgba(37, 99, 235, 0.3)";
const EDGE_HIGHLIGHT_COLOR = "rgba(99, 102, 241, 0.85)";

// Colores dependientes del tema para el canvas WebGL (no reacciona a CSS)
const CANVAS_BG = { dark: "#0a0a0a", light: "#fafbfc" };
const DIM_NODE = { dark: "rgba(64, 64, 64, 0.35)", light: "rgba(212, 212, 212, 0.55)" };
const DIM_LINK = { dark: "rgba(38, 38, 38, 0.18)", light: "rgba(212, 212, 212, 0.45)" };

interface GraphNode {
  id: string;
  resolucion: string;
  expediente: string;
  resultado: string;
  anio: number | null;
  color: string;
  citationCount: number;
  archivo_origen?: string;
  denunciado?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

// Construye nodos y aristas a partir de las resoluciones cargadas
function buildGraphData(items: ResolutionItem[]) {
  const resByNum = new Map<string, ResolutionItem>();
  items.forEach((item) => {
    const num = item.metadatos?.resolucion;
    if (num) resByNum.set(num, item);
  });

  const citedCount = new Map<string, number>();
  items.forEach((item) => {
    item.metadatos?.resoluciones_citadas?.forEach((cited) => {
      citedCount.set(cited, (citedCount.get(cited) || 0) + 1);
    });
  });

  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  // Solo incluir resoluciones que citan o son citadas
  items.forEach((item) => {
    const num = item.metadatos?.resolucion;
    if (!num) return;
    item.metadatos?.resoluciones_citadas?.forEach((cited) => {
      if (resByNum.has(cited)) {
        links.push({ source: num, target: cited });
        nodeIds.add(num);
        nodeIds.add(cited);
      }
    });
  });

  const nodes: GraphNode[] = [];
  nodeIds.forEach((num) => {
    const item = resByNum.get(num);
    if (!item) return;
    const resultado = item.metadatos?.resultado ?? "otro";
    nodes.push({
      id: num,
      resolucion: num,
      expediente: item.metadatos?.expediente ?? "",
      resultado,
      anio: item.metadatos?.anio ?? null,
      color: RESULTADO_COLORS[resultado as keyof typeof RESULTADO_COLORS] ?? NODE_DEFAULT_COLOR,
      citationCount: citedCount.get(num) ?? 0,
      archivo_origen: item.metadatos?.archivo_origen,
      denunciado: item.metadatos?.denunciado,
    });
  });

  return { nodes, links };
}

// Calcula los vecinos de un nodo (puro)
function computeNeighbors(links: GraphLink[], nodeId: string) {
  const nodes = new Set<string>([nodeId]);
  const linkSet = new Set<string>();
  links.forEach((link) => {
    const src = typeof link.source === "object" ? (link.source as any).id : link.source;
    const tgt = typeof link.target === "object" ? (link.target as any).id : link.target;
    if (src === nodeId || tgt === nodeId) {
      nodes.add(src);
      nodes.add(tgt);
      linkSet.add(`${src}__${tgt}`);
    }
  });
  return { nodes, links: linkSet };
}

export default function CitationGraph() {
  const { allItems, indexReady, queryIndex } = useSearchIndex();
  const isDark = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const [panelOpen, setPanelOpen] = useState(true);
  const [orbiting, setOrbiting] = useState(false);
  const orbitAngleRef = useRef(0);

  // Tamaño del contenedor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => {
    if (!indexReady || allItems.length === 0) return { nodes: [], links: [] };
    return buildGraphData(allItems);
  }, [allItems, indexReady]);

  // Búsqueda reutilizando el índice FlexSearch del contexto.
  // Mapea los items encontrados a los nodos del grafo (por número de resolución).
  const searchMatches = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return new Set<string>();
    const nodeIds = new Set(graphData.nodes.map((n) => n.id));
    const matches = new Set<string>();
    for (const item of queryIndex(q, 300)) {
      const res = item.metadatos?.resolucion;
      if (res && nodeIds.has(res)) matches.add(res);
    }
    return matches;
  }, [debouncedQuery, queryIndex, graphData.nodes]);

  const isSearchActive = debouncedQuery.trim().length > 0;

  // Lista de nodos coincidentes para el panel lateral
  const matchedNodes = useMemo(() => {
    if (searchMatches.size === 0) return [];
    return graphData.nodes
      .filter((n) => searchMatches.has(n.id))
      .sort((a, b) => b.citationCount - a.citationCount);
  }, [searchMatches, graphData.nodes]);

  useEffect(() => {
    if (matchedNodes.length > 0) setPanelOpen(true);
  }, [matchedNodes.length]);

  // Nodo objetivo desde hash param (#res=572-2024). Se enfoca cuando el motor
  // de fuerzas se detiene (onEngineStop), no con un timeout fijo, para que la
  // transición de cámara empiece justo cuando las posiciones ya están asentadas.
  const pendingFocusRef = useRef<string | null>(null);
  useEffect(() => {
    pendingFocusRef.current = new URLSearchParams(window.location.hash.slice(1)).get("res");
  }, []);

  // Órbita de cámara: rotación lenta cuando está inactiva.
  // Se pausa al arrastrar/zoom y resincroniza el ángulo desde la posición
  // actual de la cámara para retomar sin salto brusco.
  useEffect(() => {
    if (!orbiting || !graphRef.current) return;
    const controls = graphRef.current.controls();
    const camera = graphRef.current.camera();
    if (!controls || !camera) return;

    let interacting = false;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const syncFromCamera = () => {
      orbitAngleRef.current = Math.atan2(camera.position.x, camera.position.z);
    };
    const onStart = () => {
      interacting = true;
      if (idleTimer) clearTimeout(idleTimer);
    };
    const onEnd = () => {
      idleTimer = setTimeout(() => {
        syncFromCamera();
        interacting = false;
      }, 2500);
    };
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    syncFromCamera();
    const interval = setInterval(() => {
      if (selectedNode || interacting) return;
      const { x, z } = camera.position;
      const distance = Math.hypot(x, z);
      orbitAngleRef.current += Math.PI / 1800;
      graphRef.current?.cameraPosition({
        x: distance * Math.sin(orbitAngleRef.current),
        z: distance * Math.cos(orbitAngleRef.current),
      });
    }, 30);

    return () => {
      clearInterval(interval);
      if (idleTimer) clearTimeout(idleTimer);
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
    };
  }, [orbiting, selectedNode]);

  const focusNode = useCallback(
    (node: GraphNode) => {
      setSelectedNode(node);
      const nb = computeNeighbors(graphData.links, node.id);
      setHighlightNodes(nb.nodes);
      setHighlightLinks(nb.links);
      const live = graphData.nodes.find((n) => n.id === node.id) as any;
      if (graphRef.current && live) {
        graphRef.current.cameraPosition(
          { x: live.x ?? 0, y: live.y ?? 0, z: (live.z ?? 0) + 80 },
          { x: live.x ?? 0, y: live.y ?? 0, z: live.z ?? 0 },
          1000,
        );
      }
    },
    [graphData.links, graphData.nodes],
  );

  // Desplaza la cámara suavemente para encuadrar un subgrafo (nodo + vecinos).
  // Calcula el centroide y la dispersión para alejarse lo justo y que todo quepa.
  const frameSubgraph = useCallback((nodeIds: Set<string>) => {
    const pts = graphData.nodes.filter((n) => nodeIds.has(n.id)) as any[];
    if (pts.length === 0 || !graphRef.current) return;
    const cx = pts.reduce((s, n) => s + (n.x ?? 0), 0) / pts.length;
    const cy = pts.reduce((s, n) => s + (n.y ?? 0), 0) / pts.length;
    const cz = pts.reduce((s, n) => s + (n.z ?? 0), 0) / pts.length;
    const radius = Math.max(40, ...pts.map((n) => Math.hypot((n.x ?? 0) - cx, (n.y ?? 0) - cy, (n.z ?? 0) - cz)));
    const dist = radius * 2.4 + 80;
    graphRef.current.cameraPosition(
      { x: cx, y: cy, z: cz + dist },
      { x: cx, y: cy, z: cz },
      1500,
    );
  }, [graphData.nodes]);

  const handleEngineStop = useCallback(() => {
    setOrbiting(true);
    const target = pendingFocusRef.current;
    if (!target) return;
    const node = graphData.nodes.find((n) => n.id === target);
    if (node) {
      setSelectedNode(node);
      const nb = computeNeighbors(graphData.links, node.id);
      setHighlightNodes(nb.nodes);
      setHighlightLinks(nb.links);
      frameSubgraph(nb.nodes);
    }
    pendingFocusRef.current = null;
  }, [graphData.nodes, graphData.links, frameSubgraph]);

  // Ctrl+K enfoca la búsqueda; Escape la limpia
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && query) setQuery("");
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [query]);

  const handleNodeHover = useCallback(
    (node: any) => {
      if (selectedNode || isSearchActive) return; // No alterar highlights si hay selección o búsqueda
      if (!node) {
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
        return;
      }
      const nb = computeNeighbors(graphData.links, node.id);
      setHighlightNodes(nb.nodes);
      setHighlightLinks(nb.links);
    },
    [graphData.links, selectedNode, isSearchActive],
  );

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    if (!isSearchActive) {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [isSearchActive]);

  // --- Colores dependientes de tema + estado ---
  const dimNode = isDark ? DIM_NODE.dark : DIM_NODE.light;
  const dimLink = isDark ? DIM_LINK.dark : DIM_LINK.light;

  const getNodeColor = useCallback(
    (node: any) => {
      if (isSearchActive) return searchMatches.has(node.id) ? node.color : dimNode;
      if (highlightNodes.size > 0) return highlightNodes.has(node.id) ? node.color : dimNode;
      return node.color;
    },
    [isSearchActive, searchMatches, highlightNodes, dimNode],
  );

  const getLinkColor = useCallback(
    (link: any) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      if (isSearchActive) {
        return searchMatches.has(src) && searchMatches.has(tgt) ? EDGE_HIGHLIGHT_COLOR : dimLink;
      }
      if (highlightLinks.size > 0) {
        return highlightLinks.has(`${src}__${tgt}`) ? EDGE_HIGHLIGHT_COLOR : dimLink;
      }
      return EDGE_COLOR;
    },
    [isSearchActive, searchMatches, highlightLinks, dimLink],
  );

  const getLinkWidth = useCallback(
    (link: any) => {
      const src = typeof link.source === "object" ? link.source.id : link.source;
      const tgt = typeof link.target === "object" ? link.target.id : link.target;
      if (isSearchActive) return searchMatches.has(src) && searchMatches.has(tgt) ? 1.2 : 0.2;
      if (highlightLinks.size > 0) return highlightLinks.has(`${src}__${tgt}`) ? 1.5 : 0.3;
      return 0.5;
    },
    [isSearchActive, searchMatches, highlightLinks],
  );

  if (!indexReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto mb-4 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600 dark:border-neutral-700 dark:border-t-blue-400" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando resoluciones…</p>
        </div>
      </div>
    );
  }

  // Clases compartidas para los paneles flotantes (siguen el tema de la app)
  const panelBase =
    "border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ForceGraph3D
        ref={graphRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        backgroundColor={isDark ? CANVAS_BG.dark : CANVAS_BG.light}
        nodeRelSize={3}
        nodeVal={(node: any) => Math.max(1, (node.citationCount ?? 0) + 1)}
        nodeColor={getNodeColor}
        nodeLabel={(node: any) =>
          `${node.resolucion}${node.expediente ? ` · ${node.expediente}` : ""}${node.denunciado ? ` · ${node.denunciado}` : ""}${node.citationCount > 0 ? ` (citada ${node.citationCount}×)` : ""}`
        }
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={3}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={getLinkColor}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.004}
        linkDirectionalParticleWidth={0.8}
        linkDirectionalParticleColor={getLinkColor}
        onNodeHover={handleNodeHover}
        onNodeClick={focusNode}
        onBackgroundClick={handleBackgroundClick}
        onEngineStop={handleEngineStop}
        enableNodeDrag={true}
        cooldownTicks={150}
        warmupTicks={50}
      />

      {/* --- Barra de búsqueda superpuesta --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el grafo… (Ctrl+K)"
            aria-label="Buscar resoluciones en el grafo"
            className="w-full pl-10 pr-10 py-2.5 border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setSelectedNode(null); setHighlightNodes(new Set()); setHighlightLinks(new Set()); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {isSearchActive && (
          <p className="mt-1.5 font-mono text-[11px] tracking-wide text-neutral-500 dark:text-neutral-400 text-center">
            {searchMatches.size === 0
              ? "Sin coincidencias"
              : `${searchMatches.size} resolución${searchMatches.size !== 1 ? "es" : ""} encontrada${searchMatches.size !== 1 ? "s" : ""}`}
          </p>
        )}
      </div>

      {/* --- Panel de resultados: bottom sheet en mobile, lateral en desktop --- */}
      {isSearchActive && matchedNodes.length > 0 && (
        <div className={`absolute z-10 transition-all duration-300 bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:top-16 sm:right-0 ${panelOpen ? "h-[40vh] sm:h-[calc(100%-5rem)] sm:w-80" : "h-0 sm:w-0"}`}>
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`absolute z-20 transition-colors ${panelBase} text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 -top-8 right-4 border border-b-0 px-3 py-1.5 sm:top-4 sm:right-auto sm:-left-8 sm:border sm:border-r-0 sm:px-1.5 sm:py-3`}
            aria-label={panelOpen ? "Cerrar panel" : "Abrir panel"}
          >
            {panelOpen ? <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" /> : <ChevronLeft className="h-4 w-4 -rotate-90 sm:rotate-0" />}
          </button>

          {panelOpen && (
            <div className="h-full overflow-y-auto border-t sm:border-t-0 sm:border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="px-3 py-3 border-b border-neutral-200 dark:border-neutral-800 sticky top-0 bg-white dark:bg-neutral-900">
                <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  {matchedNodes.length} resultado{matchedNodes.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800/50">
                {matchedNodes.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => focusNode(node)}
                    className={`w-full text-left px-3 py-3 border-l border-l-blue-600 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${selectedNode?.id === node.id ? "bg-neutral-100 dark:bg-neutral-800/70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{node.resolucion}</p>
                        {node.expediente && (
                          <p className="font-mono text-[11px] tracking-wide text-neutral-500 mt-0.5 truncate">Exp. {node.expediente}</p>
                        )}
                        {node.denunciado && (
                          <p className="text-xs text-neutral-500 truncate">{node.denunciado}</p>
                        )}
                      </div>
                      <span
                        className="mt-1 flex-shrink-0 inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: node.color }}
                        title={RESULTADO_LABELS[node.resultado as keyof typeof RESULTADO_LABELS] ?? node.resultado}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] tracking-wide text-neutral-500">
                      <span>{RESULTADO_LABELS[node.resultado as keyof typeof RESULTADO_LABELS] ?? node.resultado}</span>
                      {node.citationCount > 0 && (
                        <><span className="text-neutral-300 dark:text-neutral-700">·</span><span>Citada {node.citationCount}×</span></>
                      )}
                      {node.anio && (
                        <><span className="text-neutral-300 dark:text-neutral-700">·</span><span>{node.anio}</span></>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Panel de info del nodo seleccionado --- */}
      {selectedNode && (
        <div className={`absolute left-2 right-2 bottom-2 sm:left-4 sm:right-auto sm:bottom-auto sm:top-14 z-10 px-4 py-3 text-sm sm:max-w-xs ${panelBase}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{selectedNode.resolucion}</p>
            <button
              onClick={() => { setSelectedNode(null); if (!isSearchActive) { setHighlightNodes(new Set()); setHighlightLinks(new Set()); } }}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors text-xs leading-none mt-0.5"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {selectedNode.expediente && (
            <p className="font-mono text-[11px] tracking-wide text-neutral-500 dark:text-neutral-400 mt-0.5">Exp. {selectedNode.expediente}</p>
          )}
          {selectedNode.denunciado && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{selectedNode.denunciado}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: selectedNode.color }} />
            <span className="font-mono text-[11px] tracking-wide text-neutral-600 dark:text-neutral-300">
              {RESULTADO_LABELS[selectedNode.resultado as keyof typeof RESULTADO_LABELS] ?? selectedNode.resultado}
            </span>
          </div>
          {selectedNode.citationCount > 0 && (
            <p className="font-mono text-[11px] tracking-wide text-neutral-500 mt-1">
              Citada {selectedNode.citationCount} {selectedNode.citationCount === 1 ? "vez" : "veces"}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/#abrir=${selectedNode.resolucion}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileText className="h-3 w-3" />
              Ver en PrivataSearch
            </Link>
            {selectedNode.archivo_origen && (
              <a
                href={selectedNode.archivo_origen}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:underline"
              >
                <FileText className="h-3 w-3" />
                Ver PDF
              </a>
            )}
          </div>
        </div>
      )}

      {/* Leyenda — hidden on mobile, too dense for small screens */}
      <div className={`absolute bottom-4 left-4 hidden sm:block px-4 py-3 text-xs max-w-[calc(100%-2rem)] ${panelBase}`}>
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-700 dark:text-neutral-300 mb-2">Resultado</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(RESULTADO_COLORS).map(([key, color]) => (
            <span key={key} className="flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-neutral-500 dark:text-neutral-400">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
              {RESULTADO_LABELS[key as keyof typeof RESULTADO_LABELS] ?? key}
            </span>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] tracking-wide text-neutral-400 dark:text-neutral-500">Tamaño = veces citada · Flechas = dirección de cita</p>
      </div>

      {/* Estadísticas del grafo — hidden on mobile */}
      <div className={`absolute top-4 left-4 hidden sm:block px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 ${panelBase}`}>
        {graphData.nodes.length} resoluciones · {graphData.links.length} citas
      </div>
    </div>
  );
}
