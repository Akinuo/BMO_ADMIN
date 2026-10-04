import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { safeNext } from '@/lib/safeNext'

// Finishes "Continue with Google": swaps the code for a session cookie, then goes to the dashboard.
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (code && url && key) {
    const res = NextResponse.redirect(`${origin}${next}`)
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: list => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return res
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
