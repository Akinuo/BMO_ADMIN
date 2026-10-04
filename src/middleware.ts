import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { buildCsp } from '@/lib/csp'

// Everything except these needs a signed-in account. (Whether that account is an *admin* is
// checked on the server in requireAdmin(), and again inside every SQL function.)
const PUBLIC = ['/login', '/auth/', '/setup']
const isPublic = (p: string) => PUBLIC.some(x => (x.endsWith('/') ? p.startsWith(x) : p === x))

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = req.nextUrl

  // A fresh one-time nonce per request: only scripts Next.js itself emits carry it, so an
  // injected <script> can't run. Next reads it from the request's CSP header.
  const nonce = btoa(crypto.randomUUID())
  const csp = buildCsp(nonce)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('content-security-policy', csp)

  const next = () => {
    const r = NextResponse.next({ request: { headers: requestHeaders } })
    r.headers.set('Content-Security-Policy', csp)
    return r
  }

  if (!url || !key) {
    if (pathname === '/setup') return next()
    const r = NextResponse.rewrite(new URL('/setup', req.url), { request: { headers: requestHeaders } })
    r.headers.set('Content-Security-Policy', csp)
    return r
  }

  // A sign-in code that lands on any page other than the callback (Supabase falls back to the site
  // root when the redirect URL isn't on its allow-list) is handed to the callback, so the sign-in
  // finishes and the code leaves the address bar. The callback itself is excluded: no redirect loop.
  const code = req.nextUrl.searchParams.get('code')
  if (req.method === 'GET' && code && pathname !== '/auth/callback') {
    const cb = new URL('/auth/callback', req.url)
    cb.searchParams.set('code', code)
    if (pathname !== '/') cb.searchParams.set('next', pathname)
    return NextResponse.redirect(cb)
  }

  // The sign-in / sign-out routes manage the session cookies themselves. Running the session refresh
  // here as well can strip the PKCE code-verifier cookie out of the callback request when the browser
  // still holds an old, expired session, and then the Google sign-in fails with "code verifier" errors.
  if (pathname.startsWith('/auth/')) return next()

  // Keeps the session cookie fresh while the admin browses.
  let res = next()
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value))
        requestHeaders.set('cookie', req.headers.get('cookie') ?? '')
        res = next()
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      },
    },
  })

  // getClaims() verifies the token locally (and still refreshes an expired session), so this no longer
  // costs a round trip to Supabase Auth on every request, page view and prefetch.
  const { data: auth } = await supabase.auth.getClaims()
  const user = auth?.claims?.sub ? auth.claims : null

  const redirectTo = (target: URL) => {
    const r = NextResponse.redirect(target)
    res.cookies.getAll().forEach(c => r.cookies.set(c))
    return r
  }

  if (!user && !isPublic(pathname)) {
    const login = new URL('/login', req.url)
    if (pathname !== '/') login.searchParams.set('next', pathname + req.nextUrl.search)
    return redirectTo(login)
  }


  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|logo-mark.png|robots.txt).*)'],
}
