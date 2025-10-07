'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchIndex } from '@/context/SearchContext'

interface SearchResultsProps {
  query: string
  limit?: number
}

interface SearchItem {
  id?: string
  title: string
  slug: string
  content: string  // Display content (readable_content)
  rawContent: string // Raw content for processing (no formatting)
  raw_content?: string // Markdown formatted content
  excerpt?: string
  date?: string
  description?: string
  expediente?: string
  resolucion?: string
  body?: {
    raw: string
    code: string
  }
}

const basePath = process.env.NODE_ENV === 'production' ? '/prodhab-search' : '';

export function SearchResults({ query, limit = 25 }: SearchResultsProps) {
  const [results, setResults] = useState<SearchItem[]>([])
  const { index, searchData, isLoading: indexLoading } = useSearchIndex()
  const [isLoading, setIsLoading] = useState(true)

  // Effect to handle initial search when component mounts with a query
  useEffect(() => {
    if (index && searchData && query && !indexLoading) {
      console.log('Performing initial search with preloaded index for:', query);
      const startTime = performance.now();
      
      // Use the preloaded index to perform the search
      const searchResults = index.search(query, limit); // Use the provided limit
      
      const endTime = performance.now();
      console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Search results:', searchResults);
      
      // Process search results
      if (searchResults.length > 0) {
        // Normalize the search data to our expected format
        // Always use readable_content for display
        const normalizedData: SearchItem[] = searchData.map((item: any) => ({
          id: item.id || '',
          title: item.title || 'Untitled',
          slug: item.slug || '',
          content: typeof item.readable_content === 'string' ? item.readable_content.replace(/\[object Object\]/g, '') : JSON.stringify(item.readable_content).replace(/\[object Object\]/g, ''),
          rawContent: typeof item.content === 'string' ? item.content.replace(/\[object Object\]/g, '') : JSON.stringify(item.content).replace(/\[object Object\]/g, ''),
          raw_content: item.raw_content || '', // Include raw_content field for markdown rendering
          date: item.date || '',
          description: item.description || '',
          expediente: item.expediente || 'UNKNOWN',
          resolucion: item.resolucion || 'UNKNOWN',
          body: item.body || null
        }));
        
        // Map search results to actual items
        const foundItems = searchResults.map((idx: string | number) => normalizedData[Number(idx)]);
        console.log('Found items:', foundItems.length);
        setResults(foundItems);
      } else {
        setResults([]);
      }
      
      setIsLoading(false);
    } else if (!indexLoading) {
      setIsLoading(false);
    }
  }, [index, searchData, indexLoading, query, limit])

  // Effect to handle query changes and update search results
  useEffect(() => {
    // When query changes, perform search if index is loaded
    if (index && searchData && query) {
      setIsLoading(true);
      console.log('Searching for:', query);
      const startTime = performance.now();
      
      // Split query into terms for better matching
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
      
      // Get main search results
      const searchResults = index.search(query, limit); // Use the provided limit
      
      // Use only the main search results since fuzzy search is causing type errors
      // We'll improve the main search with our custom highlighting and ranking
      const combinedResults = searchResults;
      
      const endTime = performance.now();
      console.log(`Search completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log('Search results:', combinedResults.length);
      
      // Use the preloaded search data instead of fetching it again
        // Normalize the search data to our expected format
        // Always use readable_content for display, but we're indexing with raw content
        const normalizedData: SearchItem[] = searchData.map((item: any) => ({
          id: item.id || '',
          title: item.title || 'Untitled',
          slug: item.slug || '',
          content: typeof item.readable_content === 'string' ? item.readable_content.replace(/\[object Object\]/g, '') : JSON.stringify(item.readable_content).replace(/\[object Object\]/g, ''), // Display content always uses readable_content when available
          rawContent: typeof item.content === 'string' ? item.content.replace(/\[object Object\]/g, '') : JSON.stringify(item.content).replace(/\[object Object\]/g, ''), // Keep raw content for reference
          raw_content: item.raw_content || '', // Include raw_content field for markdown rendering
          date: item.date || '',
          description: item.description || '',
          expediente: item.expediente || 'UNKNOWN',
          resolucion: item.resolucion || 'UNKNOWN',
          body: item.body || null
        }));      if (combinedResults.length > 0) {
        // Calculate relevance scores for sorting results
        const scoredItems = combinedResults.map((idx: string | number) => {
          const itemData = normalizedData[Number(idx)];
          let score = 0;
          
          // Score based on field matches (title gets higher weight)
          const content = itemData.content?.toLowerCase() || '';
          const title = itemData.title?.toLowerCase() || '';
          
          queryTerms.forEach(term => {
            // Title matches are worth more
            if (title.includes(term)) score += 10;
            
            // Content matches
            if (content.includes(term)) {
              score += 5;
              // Bonus for exact phrase match in content
              if (content.includes(query.toLowerCase())) score += 15;
            }
            
            // Recent documents bonus (if date exists)
            if (itemData.date) {
              try {
                const itemDate = new Date(itemData.date);
                const currentDate = new Date();
                const monthsDiff = (currentDate.getFullYear() - itemDate.getFullYear()) * 12 + 
                                   currentDate.getMonth() - itemDate.getMonth();
                // Documents less than 6 months old get a boost
                if (monthsDiff < 6) score += 3;
              } catch (e) {
                // Skip date scoring if date is invalid
              }
            }
          });
          
          return { idx, score, itemData };
        });
        
        // Sort by score (highest first)
        scoredItems.sort((a, b) => b.score - a.score);
        
        const foundItems = scoredItems.map(({ itemData }) => {
          // Use the itemData from the scored results
          const item = itemData;
          
          // Create a highlighted excerpt from the content
          let excerpt = '';
          
          // Use description if available, otherwise use content directly
          if (item.description && typeof item.description === 'string') {
            excerpt = item.description;
          } else {
            // Always use readable content for display
            const contentText = typeof item.content === 'string' ? item.content : 
                               (item.content ? JSON.stringify(item.content) : '');
                               
            // But use raw content for finding the position (since that's what was indexed)
            const rawText = item.rawContent || '';
            const queryPositionRaw = rawText.toLowerCase().indexOf(query.toLowerCase());
            // Find the position in the readable content
            const queryPosition = contentText.toLowerCase().indexOf(query.toLowerCase());
            
            // If we found a match in either content type
            if (queryPosition !== -1 || queryPositionRaw !== -1) {
              let start, end;
              
              if (queryPosition !== -1) {
                // Prefer using the position from readable content if found
                start = Math.max(0, queryPosition - 100);
                end = Math.min(contentText.length, queryPosition + 100);
              } else if (queryPositionRaw !== -1 && contentText.length > 0) {
                // If we only found it in raw content, make an estimation for readable content position
                // This is an approximation since the formatting will be different
                const positionRatio = queryPositionRaw / rawText.length;
                const estimatedPos = Math.floor(positionRatio * contentText.length);
                start = Math.max(0, estimatedPos - 100);
                end = Math.min(contentText.length, estimatedPos + 100);
              } else {
                // Fallback to beginning of content
                start = 0;
                end = Math.min(contentText.length, 200);
              }
              
              // Extract the excerpt
              excerpt = contentText.slice(start, end);
              
              // Add ellipses if we're not at the beginning/end
              if (start > 0) excerpt = '...' + excerpt;
              if (end < contentText.length) excerpt = excerpt + '...';
              
              // Highlight the search term with a yellow background using HTML
              const queryRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
              excerpt = excerpt.replace(queryRegex, '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>');
            } else {
              // If no direct match is found in the text, just take the first part
              excerpt = contentText.slice(0, 200) + '...';
            }
          }
          
          return { 
            ...item, 
            excerpt 
          };
        });
        
        setResults(foundItems);
      } else {
        setResults([]);
      }
      
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [query, index, searchData, limit])

  if (isLoading || indexLoading) {
    return (
      <div className="my-8 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent dark:border-gray-200 dark:border-t-transparent"></div>
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
          {indexLoading ? 'Cargando índice de búsqueda...' : 'Buscando...'}
        </span>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="my-16 text-center">
        <h2 className="mb-4 text-xl font-semibold">No se encontraron resultados</h2>
        <p className="text-gray-600 dark:text-gray-400">
          No se encontraron resultados para &quot;{query}&quot;.
        </p>
      </div>
    )
  }

  return (
    <div className="my-8 space-y-8">
      {query && results.length > 0 && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Se encontraron {results.length} resultados para &quot;{query}&quot;
          </p>
        </div>
      )}
      
      {results.map((result, idx) => (
        <article key={idx} className="rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-md dark:border-gray-700 dark:hover:shadow-lg dark:hover:shadow-black/30">
          <div className="mb-4 flex flex-wrap gap-2">
            {result.expediente && result.expediente !== 'UNKNOWN' && (
              <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Expediente: {result.expediente}
              </span>
            )}
            {result.resolucion && result.resolucion !== 'UNKNOWN' && (
              <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-300">
                Resolución: {result.resolucion}
              </span>
            )}
          </div>
          
          {result.excerpt && (
            <div className="prose-sm prose mb-4 text-gray-600 dark:text-gray-300">
              <div dangerouslySetInnerHTML={{ __html: result.excerpt.replace(/\[object Object\]/g, '') }} />
            </div>
          )}
          
          {result.date && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {result.date}
            </div>
          )}
          
          <div className="mt-4">
            {result.expediente ? (
              <button
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-800 dark:hover:bg-blue-700"
                onClick={() => {
                  // Check if raw_content is already available in the search result
                  if (result.raw_content) {
                    localStorage.setItem('fullMarkdown', result.raw_content);
                    localStorage.setItem('fullTitle', result.title || '')
                    localStorage.setItem('fullExpediente', result.expediente || '')
                    localStorage.setItem('fullResolucion', result.resolucion || '')
                    localStorage.setItem('fullDate', result.date || '')
                    window.location.href = `${basePath}/jurisprudencia/ver`
                  } else {
                    // Fallback: fetch raw_content from the index file
                    fetch(`${basePath}/prodhab-index.json`)
                      .then(response => response.json())
                      .then(data => {
                        const item = data.find((item: { id: string | undefined }) => item.id === result.id);
                        if (item && item.raw_content) {
                          localStorage.setItem('fullMarkdown', item.raw_content);
                        } else {
                          localStorage.setItem('fullMarkdown', result.rawContent || '');
                        }
                        localStorage.setItem('fullTitle', result.title || '')
                        localStorage.setItem('fullExpediente', result.expediente || '')
                        localStorage.setItem('fullResolucion', result.resolucion || '')
                        localStorage.setItem('fullDate', result.date || '')
                        window.location.href = `${basePath}/jurisprudencia/ver`
                      })
                      .catch(error => {
                        console.error('Error fetching raw_content:', error);
                        localStorage.setItem('fullMarkdown', result.rawContent || '')
                        localStorage.setItem('fullTitle', result.title || '')
                        localStorage.setItem('fullExpediente', result.expediente || '')
                        localStorage.setItem('fullResolucion', result.resolucion || '')
                        localStorage.setItem('fullDate', result.date || '')
                        window.location.href = `${basePath}/jurisprudencia/ver`
                      });
                  }
                }}
              >
                Ver Texto Completo
              </button>
            ) : (
              <Link 
                href={`/posts/${result.slug}`}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-800 dark:hover:bg-blue-700"
              >
                Ver Artículo Completo
              </Link>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}