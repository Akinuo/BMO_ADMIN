// Content-Security-Policy, built per request so scripts can be locked to a one-time nonce
// (no 'unsafe-inline' for scripts). Used by src/middleware.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseOrigins: string[] = []
try {
  if (supabaseUrl) {
    const u = new URL(supabaseUrl)
    supabaseOrigins = [u.origin, `wss://${u.host}`]
  }
} catch {}

const isDev = process.env.NODE_ENV !== 'production'

export function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // React inline style attributes need this; scripts do not
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigins.join(' ')}`.trim(),
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ['upgrade-insecure-requests']),
  ].join('; ')
}
