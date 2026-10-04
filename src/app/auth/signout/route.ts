import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// POST only, so a stray link or image can't sign an admin out.
export async function POST(req: NextRequest) {
  const { origin } = req.nextUrl
  const res = NextResponse.redirect(`${origin}/login?signedout=1`, { status: 303 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: list => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    })
    await supabase.auth.signOut()
  }
  return res
}
