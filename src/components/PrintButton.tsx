'use client'
import { useEffect } from 'react'

/** Opens the browser print dialog (choose "Save as PDF" there). Expands every <details> first, even for Ctrl+P. */
export default function PrintButton({ label = 'Print' }: { label?: string }) {
  useEffect(() => {
    const open = () => document.querySelectorAll('details').forEach(d => { d.open = true })
    window.addEventListener('beforeprint', open)
    return () => window.removeEventListener('beforeprint', open)
  }, [])
  return (
    <button type="button" className="btn-outline print:hidden" onClick={() => window.print()}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M7 14h10v7H7z" />
      </svg>
      {label}
    </button>
  )
}
