import Footer from '@/components/Footer'
import { Suspense } from 'react'
import SearchClient from '@/components/SearchClient'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <h1 className="mb-3 text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100 md:text-3xl text-center leading-normal" style={{ lineHeight: '1.5' }}>
            BUSCADOR SOBRE JURISPRUDENCIA DE PROTECCIÓN DE DATOS PERSONALES
          </h1>
        </div>
        {/* Client-side search UI */}
        <Suspense fallback={<div className="text-center py-12">Cargando buscador...</div>}>
          <SearchClient />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}