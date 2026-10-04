// Supabase origin for CSP connect-src (REST + realtime websocket).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseOrigins = []
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl)
    supabaseOrigins = [u.origin, `wss://${u.host}`]
  }
} catch {}

const isDev = process.env.NODE_ENV !== 'production'

// Next.js 14 injects inline bootstrap scripts, so script-src needs 'unsafe-inline'
// unless nonces are wired through middleware. Everything else is locked to same-origin
// plus the Supabase project this dashboard reads from.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigins.join(' ')}`.trim(),
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ')

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  compress: true,
  experimental: { optimizePackageImports: ['@supabase/supabase-js'] },
  async headers() {
    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
      // This site lists student emails — keep it out of search engines.
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    ]
    return [
      { source: '/:path*', headers: securityHeaders },
      // Pages and data are never cached (they contain student emails)...
      // ...but hashed build assets (JS/CSS/fonts) and images are public and safe to cache hard.
      { source: '/((?!_next/static|_next/image|logo-mark.png|icon.png).*)', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
      { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/:file(logo-mark.png|icon.png)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
    ]
  },
}
export default config
