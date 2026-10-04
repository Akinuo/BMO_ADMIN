import './globals.css'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import type { Metadata, Viewport } from 'next'

// Every page is rendered per request so Next.js can stamp the CSP nonce on its scripts.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'B.M.O Admin', template: '%s — B.M.O Admin' },
  description: 'Admin dashboard for tracking student progress in Basic Machine Operation (B.M.O).',
  robots: { index: false, follow: false, nocache: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#22336B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-chalk font-sans text-ink">{children}</body>
    </html>
  )
}
