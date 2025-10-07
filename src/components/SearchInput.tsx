'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useSearchIndex } from '@/context/SearchContext'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  placeholder?: string
  className?: string
}

export function SearchInput({ placeholder = 'Buscar...', className = '' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')
  const { setLastSearchQuery } = useSearchIndex()
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Update search query when URL changes
  useEffect(() => {
    setSearchQuery(searchParams?.get('q') || '')
  }, [searchParams])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (searchQuery.trim()) {
      // Create new URL search params
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.set('q', searchQuery)
      
      // If we're not already on the search page, navigate to it
      if (pathname !== '/') {
        router.push(`/?${params.toString()}`)
      } else {
        router.replace(`/?${params.toString()}`)
      }
    }
  }
  
  const handleClearSearch = () => {
    setSearchQuery('')
    setLastSearchQuery(null)
    
    // If we're on the search page, update the URL to remove the search query
    if (pathname === '/') {
      const params = new URLSearchParams(searchParams?.toString() || '')
      params.delete('q')
      router.replace(`/?${params.toString()}`)
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex gap-2 items-center w-full">
        <div className="relative flex-grow">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pr-10 text-sm transition-colors placeholder:text-gray-500 focus:border-gray-900 focus:outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-white dark:focus:border-gray-500"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 flex h-full items-center justify-center px-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            </button>
          </form>
        </div>
        {searchQuery && (
          <Button 
            onClick={handleClearSearch}
            variant="outline"
            className="whitespace-nowrap text-sm"
          >
            Limpiar Búsqueda
          </Button>
        )}
      </div>
    </div>
  )
}