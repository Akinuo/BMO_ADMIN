'use client'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { IconLock, IconPulse, IconTrophy, IconUsers, SpoolMark } from '@/components/icons'
import { safeNext } from '@/lib/safeNext'
import { getSupabaseBrowser } from '@/lib/supabase/client'
import { supabaseConfigured } from '@/lib/supabase/env'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function friendlyError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Incorrect email or password.'
  if (m.includes('email not confirmed')) return 'This email address has not been confirmed yet.'
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  if (m.includes('network') || m.includes('fetch')) return 'Connection error. Check your internet and try again.'
  return 'Something went wrong. Please try again.'
}

const OAUTH_REASONS: Record<string, string> = {
  denied: 'Google sign-in was cancelled, or that Google account is not allowed to use this app. If the Google app is in "Testing" mode, add the account as a test user.',
  provider: 'Google or Supabase reported a problem. Check the Google provider settings in Supabase (client ID, secret and redirect URLs).',
  verifier: 'Your browser lost its sign-in state. Make sure cookies are allowed for this site, then try again.',
  exchange: 'Google accepted you, but the session could not be created. Please try again.',
  nocode: 'Google did not send a sign-in code back. Please try again.',
}

function oauthMessage(reason: string | null): string {
  return `Google sign-in failed. ${(reason && OAUTH_REASONS[reason]) || 'Please try again.'}`
}

const POINTS = [
  { Icon: IconUsers, text: 'Total students and who is active this week' },
  { Icon: IconPulse, text: 'Progress for every student, lesson by lesson' },
  { Icon: IconTrophy, text: 'A leaderboard ranked by progress' },
]

export default function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get('next'))

  const [msg, setMsg] = useState(params.get('error') === 'oauth' ? oauthMessage(params.get('reason')) : '')
  const [busy, setBusy] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [showPw, setShowPw] = useState(false)

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const loading = getSupabaseBrowser()
    if (!loading) return
    setBusy(true)
    setMsg('')
    const f = new FormData(e.currentTarget)
    const supabase = await loading
    // Drop any session already in this browser first, so the account typed here is the one you end up in
    // (never a leftover login of a different account).
    await supabase.auth.signOut({ scope: 'local' })
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
    })
    if (error) {
      setBusy(false)
      setMsg(friendlyError(error.message))
      return
    }
    router.replace(next)
    router.refresh()
  }

  async function google() {
    const loading = getSupabaseBrowser()
    if (!loading) return
    setGoogleBusy(true)
    setMsg('')
    const supabase = await loading
    // (No sign-out here: finishing the Google sign-in replaces any existing session by itself.)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // Always ask Google which account to use, instead of silently reusing whichever one the browser remembers.
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) {
      setGoogleBusy(false)
      setMsg(friendlyError(error.message))
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-denim px-10 py-12 text-white lg:flex">
        <SpoolMark className="absolute -bottom-8 -right-6 h-72 w-72 -rotate-12 text-white/[0.07]" />
        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-paper">
            <Image src="/logo-mark.png" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
          </span>
          <span className="font-display text-lg font-bold">B.M.O Admin</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-3xl font-bold leading-tight">See how every student is doing.</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            A separate dashboard for instructors. It reads the same Basic Machine Operation database as the student app,
            read-only, and never changes a student&rsquo;s record.
          </p>
          <ul className="mt-8 grid gap-3">
            {POINTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon className="h-4 w-4 text-thread" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">Basic Machine Operation &middot; BTLED Home Economics</p>
      </div>

      {/* Form */}
      <div className="flex flex-col justify-center bg-paper px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-denim">
              <Image src="/logo-mark.png" alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-sm bg-paper object-contain p-px" />
            </span>
            <span className="font-display text-lg font-bold text-denim">B.M.O Admin</span>
          </div>

          <h2 className="page-title">Admin sign in</h2>
          <p className="mt-1 text-sm text-muted">For instructors with an admin account.</p>

          {!supabaseConfigured && (
            <div className="alert-info mt-4">Supabase is not configured. Add your keys to <code className="font-mono text-xs">.env.local</code>.</div>
          )}
          {params.get('signedout') && !msg && <p className="alert-ok mt-4">You have been signed out.</p>}

          <button
            type="button"
            onClick={google}
            disabled={googleBusy || !supabaseConfigured}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded border border-border bg-paper py-2.5 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-chalk disabled:cursor-not-allowed disabled:opacity-50"
          >
            {googleBusy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-ink" /> : <GoogleLogo />}
            Continue with Google
          </button>

          <div className="relative mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} onFocusCapture={() => void getSupabaseBrowser()} className="mt-5 grid gap-4">
            <label className="block text-sm font-medium text-ink">
              Email address
              <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
            </label>
            <label className="block text-sm font-medium text-ink">
              Password
              <div className="relative">
                <input
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="field pr-14"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted underline underline-offset-2 hover:text-denim"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            <button className="btn mt-1 w-full" disabled={busy || !supabaseConfigured}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>

            {msg && <p aria-live="polite" className="alert-err">{msg}</p>}
          </form>

          <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <IconLock className="mt-0.5 h-4 w-4 shrink-0" />
            Accounts are created in the student app. An existing admin must grant the admin role before an account can see anything here.
          </p>
        </div>
      </div>
    </div>
  )
}
