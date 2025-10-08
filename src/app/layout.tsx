import { SearchProvider } from '@/context/SearchContext'
import './globals.css'

const basePath = process.env.NODE_ENV === 'production' ? '/prodhab-search' : '';

export const metadata = {
  title: 'Buscador PRODHAB',
  description: 'Buscador de jurisprudencia de protección de datos personales',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Preload the search index - browser downloads immediately */}
        <link
          rel="preload"
          href={`${basePath}/prodhab-index.json`}
          as="fetch"
          type="application/json"
          crossOrigin="anonymous"
        />
        {/* Optional: Also preload with higher priority */}
        <link
          rel="prefetch"
          href={`${basePath}/prodhab-index.json`}
        />
      </head>
      <body>
        <SearchProvider>
          {children}
        </SearchProvider>
      </body>
    </html>
  )
}