"use client";
import React, { useState } from 'react';
import { useSearchIndex } from '@/context/SearchContext';
import { SearchConfigPanel } from './SearchConfigPanel';
import { SearchResults } from './SearchResults';

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
  const [relatedLimit, setRelatedLimit] = useState(5);
  const { allItems } = useSearchIndex();

  return (
    <div>
      <SearchConfigPanel
        limit={limit}
        setLimit={setLimit}
        similarityThreshold={similarityThreshold}
        setSimilarityThreshold={setSimilarityThreshold}
        relatedLimit={relatedLimit}
        setRelatedLimit={setRelatedLimit}
        onApply={() => {}}
      />
      <div className="mb-4 relative w-full">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar..."
          className="w-full px-3 py-2 pr-10 border rounded"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 focus:outline-none"
            style={{ lineHeight: 0 }}
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
            tabIndex={0}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <SearchResults
        query={query}
        limit={limit}
        similarityThreshold={similarityThreshold}
        relatedLimit={relatedLimit}
        filteredItems={allItems}
      />
    </div>
  );
}
