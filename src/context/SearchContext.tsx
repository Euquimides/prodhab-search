"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import FlexSearch from "flexsearch";

export interface ResolutionItem {
  id: string;
  titulo: string;
  texto: string;
  metadatos: {
    expediente?: string;
    resolucion?: string;
    fecha?: string;
    archivo_origen?: string;
  };
  vector?: number[];
}

interface SearchContextType {
  indexReady: boolean;
  searchResults: ResolutionItem[];
  lastSearchQuery: string | null;
  setLastSearchQuery: (q: string | null) => void;
  search: (query: string, limit?: number) => void;
  allItems: ResolutionItem[];
  error: string | null;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function useSearchIndex() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("SearchContext not found");
  return ctx;
}

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [indexReady, setIndexReady] = useState(false);
  const [searchResults, setSearchResults] = useState<ResolutionItem[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<ResolutionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const indexRef = useRef<any>(null);
  // O(1) id→item lookup; evita iterar sobre todos los items para resolver resultados de búsqueda
  const itemMapRef = useRef<Map<string, ResolutionItem>>(new Map());

  // Cargar datos e inicializar índice FlexSearch
  useEffect(() => {
    async function loadData() {
      if (indexRef.current) return;
      try {
        const res = await fetch("/indice-resoluciones-prodhab.json");
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        const json = await res.json();
        const items: ResolutionItem[] = Array.isArray(json.datos)
          ? json.datos.filter((d: any) => d && d.id && d.titulo && d.texto)
          : [];

        if (items.length === 0) {
          throw new Error("No se encontraron resoluciones en el índice");
        }

        itemMapRef.current = new Map(items.map((item) => [item.id, item]));
        setAllItems(items);
        // Construir índice de documentos FlexSearch
        const idx = new FlexSearch.Document({
          tokenize: "forward",
          cache: true,
          document: {
            id: "id",
            index: ["titulo", "texto"],
          },
        });
        items.forEach((item) =>
          idx.add({
            id: item.id,
            titulo: item.titulo,
            texto: item.texto,
          }),
        );
        indexRef.current = idx;
        setError(null);
        setIndexReady(true);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Error desconocido al cargar datos";
        setError(message);
        setIndexReady(true);
        console.error("Error loading search index:", err);
      }
    }
    loadData();
  }, []);

  // Función de búsqueda
  const search = useCallback(
    (query: string, limit: number = 10) => {
      if (!indexRef.current || !query) {
        setSearchResults([]);
        return;
      }
      // FlexSearch Document devuelve un array de resultados por cada campo indexado.
      const raw: { result: string[] }[] = indexRef.current.search(query, { limit });
      const seen = new Set<string>();
      const found: ResolutionItem[] = [];
      for (const field of raw) {
        for (const id of field.result) {
          if (!seen.has(id)) {
            seen.add(id);
            const item = itemMapRef.current.get(id);
            if (item) found.push(item);
          }
        }
      }
      setSearchResults(found);
    },
    [],
  );

  return (
    <SearchContext.Provider
      value={{
        indexReady,
        searchResults,
        lastSearchQuery,
        setLastSearchQuery,
        search,
        allItems,
        error,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
