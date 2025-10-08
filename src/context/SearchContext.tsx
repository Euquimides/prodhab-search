'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import * as FlexSearch from 'flexsearch'

interface SearchIndexContextType {
  index: FlexSearch.Index | null
  searchData: any[] | null
  isLoading: boolean
  lastSearchQuery: string | null
  setLastSearchQuery: (query: string | null) => void
}

const SearchIndexContext = createContext<SearchIndexContextType>({
  index: null,
  searchData: null,
  isLoading: true,
  lastSearchQuery: null,
  setLastSearchQuery: () => {}
})

const basePath = process.env.NODE_ENV === 'production' ? '/prodhab-search' : '';
const CACHE_NAME = 'prodhab-search-v1';
const INDEX_URL = `${basePath}/prodhab-index.json`;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function useSearchIndex() {
  return useContext(SearchIndexContext)
}

interface SearchProviderProps {
  children: React.ReactNode
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [index, setIndex] = useState<FlexSearch.Index | null>(null)
  const [searchData, setSearchData] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null)

  useEffect(() => {
    const preloadWithCache = async () => {
      console.log('[SearchContext] Starting smart preload...')
      const startTime = performance.now()

      try {
        let rawSearchData;
        let cacheHit = false;

        // Try to get from Cache API first
        if ('caches' in window) {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(INDEX_URL);

          if (cachedResponse) {
            const cacheDate = cachedResponse.headers.get('X-Cache-Date');
            const isCacheValid = cacheDate && 
              (Date.now() - new Date(cacheDate).getTime()) < CACHE_DURATION;

            if (isCacheValid) {
              console.log('[SearchContext] ✓ Using cached index');
              rawSearchData = await cachedResponse.json();
              cacheHit = true;
            } else {
              console.log('[SearchContext] Cache expired, fetching fresh data');
            }
          }
        }

        // If not in cache or cache expired, fetch from network
        if (!rawSearchData) {
          console.log('[SearchContext] Fetching from network...');
          
          // Start the fetch early (preload)
          const fetchPromise = fetch(INDEX_URL);
          
          // Show a minimal UI while loading
          const response = await fetchPromise;
          rawSearchData = await response.json();

          // Cache the response
          if ('caches' in window) {
            const cache = await caches.open(CACHE_NAME);
            
            // Create a new response with cache date header
            const responseToCache = new Response(JSON.stringify(rawSearchData), {
              headers: {
                'Content-Type': 'application/json',
                'X-Cache-Date': new Date().toISOString()
              }
            });
            
            await cache.put(INDEX_URL, responseToCache);
            console.log('[SearchContext] ✓ Cached for future use');
          }
        }

        // Build the index
        console.log('[SearchContext] Building FlexSearch index...');
        const searchIndex = new FlexSearch.Index({
          tokenize: 'forward',
          resolution: 9,
          cache: 100,
          encode: (str: string) => {
            return str
              .toLowerCase()
              .replace(/[áàäâã]/g, 'a')
              .replace(/[éèëê]/g, 'e')
              .replace(/[íìïî]/g, 'i')
              .replace(/[óòöôõ]/g, 'o')
              .replace(/[úùüû]/g, 'u')
              .replace(/ñ/g, 'n')
              .split(/[^a-z0-9]+/)
          }
        })

        // Build index with progress indication
        const totalItems = rawSearchData.length;
        const batchSize = 100;
        
        for (let i = 0; i < totalItems; i += batchSize) {
          const batch = rawSearchData.slice(i, Math.min(i + batchSize, totalItems));
          batch.forEach((item: any, batchIdx: number) => {
            searchIndex.add(i + batchIdx, item.content || '');
          });
          
          // Allow UI to update
          if (i % 500 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        const endTime = performance.now();
        console.log(`[SearchContext] ✓ Ready in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`[SearchContext] Indexed ${rawSearchData.length} items`);
        console.log(`[SearchContext] Cache: ${cacheHit ? 'HIT' : 'MISS'}`);

        setIndex(searchIndex)
        setSearchData(rawSearchData)
        setIsLoading(false)

      } catch (error) {
        console.error('[SearchContext] Failed to preload:', error)
        setIsLoading(false)
      }
    }

    preloadWithCache()
  }, [])

  return (
    <SearchIndexContext.Provider
      value={{ index, searchData, isLoading, lastSearchQuery, setLastSearchQuery }}
    >
      {children}
    </SearchIndexContext.Provider>
  )
}