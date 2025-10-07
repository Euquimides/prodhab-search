'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import JustifiedLayout from '@/components/JustifiedLayout'
import Link from 'next/link'
import Footer from '@/components/Footer'

export default function VerTextoCompletoPage() {
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [expediente, setExpediente] = useState('')
  const [resolucion, setResolucion] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    setMarkdown(localStorage.getItem('fullMarkdown') || '')
    setTitle(localStorage.getItem('fullTitle') || '')
    setExpediente(localStorage.getItem('fullExpediente') || '')
    setResolucion(localStorage.getItem('fullResolucion') || '')
    setDate(localStorage.getItem('fullDate') || '')
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        {/* Metadata */}
        <div className="mb-12 space-y-2 border-b border-neutral-200 pb-8 dark:border-neutral-800">
          {expediente && expediente !== 'UNKNOWN' && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-normal">Expediente:</span>{' '}
              <span className="text-neutral-900 dark:text-neutral-100">{expediente}</span>
            </div>
          )}
          {resolucion && resolucion !== 'UNKNOWN' && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-normal">Resolución:</span>{' '}
              <span className="text-neutral-900 dark:text-neutral-100">{resolucion}</span>
            </div>
          )}
          {date && (
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="font-normal">Fecha:</span>{' '}
              <span className="text-neutral-900 dark:text-neutral-100">{date}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <JustifiedLayout>
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-6 text-justify text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {children}
                  </p>
                ),
                h1: ({ children }) => (
                  <h1 className="mb-8 mt-12 text-center text-2xl font-light tracking-tight text-neutral-900 dark:text-neutral-100">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-6 mt-10 text-center text-xl font-light text-neutral-900 dark:text-neutral-100">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-4 mt-8 text-center text-lg font-normal text-neutral-800 dark:text-neutral-200">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="mb-6 ml-6 list-disc space-y-2 text-neutral-700 dark:text-neutral-300">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-6 ml-6 list-decimal space-y-2 text-neutral-700 dark:text-neutral-300">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-justify text-base leading-relaxed">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-medium text-neutral-900 dark:text-neutral-100">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-neutral-600 dark:text-neutral-400">{children}</em>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-6 border-l-2 border-neutral-300 pl-6 italic text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">
                    {children}
                  </blockquote>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm font-mono text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                    {children}
                  </code>
                ),
                hr: () => <hr className="my-10 border-neutral-200 dark:border-neutral-800" />
              }}
            >
              {markdown}
            </ReactMarkdown>
          </JustifiedLayout>
        </div>

        {/* Back Link */}
        <div className="mt-16 border-t border-neutral-200 pt-8 text-center dark:border-neutral-800">
          <Link 
            href="/" 
            className="text-sm text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            ← Volver a la búsqueda
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}