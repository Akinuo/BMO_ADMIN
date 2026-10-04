import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { safeNext } from '@/lib/safeNext'

// Finishes "Continue with Google": swaps the code for a session cookie, then goes to the dashboard.
// When it fails, the real reason goes to the server log, and the login page gets a short, fixed reason code
// (never raw text from the URL) so it can tell you what to check.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))
  const fail = (reason: 'denied' | 'provider' | 'nocode' | 'verifier' | 'exchange') =>
    NextResponse.redirect(`${origin}/login?error=oauth&reason=${reason}`)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Google or Supabase sent the visitor back with an error instead of a code.
  const providerError = searchParams.get('error')
  if (providerError) {
    console.error('[auth/callback] provider returned an error:', providerError, searchParams.get('error_code'), searchParams.get('error_description'))
    return fail(providerError === 'access_denied' ? 'denied' : 'provider')
  }
  if (!code) {
    console.error('[auth/callback] no code in the callback URL')
    return fail('nocode')
  }
  if (!url || !key) return fail('exchange')

  const res = NextResponse.redirect(`${origin}${next}`)
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  })
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (!error) return res

  console.error('[auth/callback] exchangeCodeForSession failed:', error.message, error.code ?? '')
  return fail(/verifier/i.test(error.message) ? 'verifier' : 'exchange')
}
