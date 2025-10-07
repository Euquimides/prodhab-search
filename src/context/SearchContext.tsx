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

// Use the environment variable
const basePath = process.env.NODE_ENV === 'production' ? '/prodhab-search' : '';

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
    const preloadSearchIndex = async () => {
      console.log('Preloading search index...')
      try {
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

        // Updated to ensure basePath is included for production
        console.log(`Fetching index from: ${basePath}/prodhab-index.json`);
        const response = await fetch(`${basePath}/prodhab-index.json`)
        const rawSearchData = await response.json()
        console.log(`Loaded ${rawSearchData.length} search items`)

        rawSearchData.forEach((item: any, idx: number) => {
          searchIndex.add(idx, item.content || '')
        })

        setIndex(searchIndex)
        setSearchData(rawSearchData)
        setIsLoading(false)
        console.log('Search index preloaded and ready')
      } catch (error) {
        console.error('Failed to preload search index:', error)
        setIsLoading(false)
      }
    }

    preloadSearchIndex()
  }, [])

  return (
    <SearchIndexContext.Provider
      value={{ index, searchData, isLoading, lastSearchQuery, setLastSearchQuery }}
    >
      {children}
    </SearchIndexContext.Provider>
  )
}