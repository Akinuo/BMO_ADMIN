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

  const { data: { user } } = await supabase.auth.getUser()

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

  if (user && pathname === '/login') return redirectTo(new URL('/', req.url))

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|logo-mark.png|robots.txt).*)'],
}
