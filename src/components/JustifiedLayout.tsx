import React from 'react'

interface JustifiedLayoutProps {
  children: React.ReactNode
  className?: string
}

/**
 * JustifiedLayout wraps children in a div with justified text alignment.
 * Optionally accepts a className for further styling.
 */
export default function JustifiedLayout({ children, className = '' }: JustifiedLayoutProps) {
  return (
    <div className={`text-justify ${className}`}>
      {children}
    </div>
  )
}
