'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchInput } from '@/components/SearchInput'
import { SearchResults } from '@/components/SearchResults'
import { useSearchIndex } from '@/context/SearchContext'

export default function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams?.get('q') || ''
  const limitParam = searchParams?.get('limit')
  const [resultsLimit, setResultsLimit] = useState(limitParam ? parseInt(limitParam) : 10)
  const { setLastSearchQuery } = useSearchIndex()

  useEffect(() => {
    const newLimit = limitParam ? parseInt(limitParam) : 10
    setResultsLimit(newLimit)
  }, [limitParam])

  useEffect(() => {
    if (query) {
      setLastSearchQuery(query)
    }
  }, [query, setLastSearchQuery])

  return (
    <>
      {/* Search Input */}
      <div className="mb-8">
        <SearchInput 
          placeholder="Buscar por términos..."
          className="w-full"
        />
      </div>
      {/* Results Limit Selector */}
      {query && (
        <div className="mb-8 flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          <label htmlFor="results-limit" className="font-normal">
            Resultados:
          </label>
          <select
            id="results-limit"
            className="appearance-none border-b border-neutral-300 bg-transparent py-1 pr-8 font-normal outline-none transition-colors hover:border-neutral-900 focus:border-neutral-900 dark:border-neutral-700 dark:hover:border-neutral-100 dark:focus:border-neutral-100"
            value={resultsLimit}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value)
              setResultsLimit(newLimit)
              const params = new URLSearchParams(searchParams?.toString() || '')
              params.set('limit', newLimit.toString())
              if (query) {
                params.set('q', query)
              }
              router.push(`/?${params.toString()}`)
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </div>
      )}
      {/* Results or Empty State */}
      {query ? (
        <SearchResults query={query} limit={resultsLimit} />
      ) : (
        <div className="mt-24 text-center">
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-500">
            Este es un buscador textual de resoluciones de la PRODHAB para simplificar el acceso
            y brindar conocimiento sobre protección de datos personales. Ingrese en el buscador términos como "consentimiento", "datos sensibles", "derecho al olvido", "transferencia de datos", etc.
          </p>
        </div>
      )}
    </>
  )
}