import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_test'

// An old session whose refresh token no longer works, plus the PKCE verifier of the Google sign-in in progress.
const b64url = (s: string) => Buffer.from(s).toString('base64url')
const oldSession = {
  access_token: 'x.y.z', token_type: 'bearer', refresh_token: 'old', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) - 7200,
  user: { id: '00000000-0000-0000-0000-000000000009', aud: 'authenticated', email: 'old@x.com', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
}
const COOKIE = [
  `sb-x-auth-token=base64-${b64url(JSON.stringify(oldSession))}`,
  `sb-x-auth-token-code-verifier=base64-${b64url(JSON.stringify('the-verifier'))}`,
].join('; ')

const realFetch = globalThis.fetch
const realError = console.error
function stubRefreshFailure() {
  console.error = () => {} // auth-js logs the failed refresh; keep the test output clean
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid Refresh Token: Already Used' }), {
      status: 400, headers: { 'content-type': 'application/json' },
    })) as typeof fetch
}
const restore = () => { globalThis.fetch = realFetch; console.error = realError }

const requestCookieSeenByRoute = (path: string) => middleware(new NextRequest(`https://admin.example.com${path}`, { headers: { cookie: COOKIE } }))
  .then(res => res.headers.get('x-middleware-request-cookie') ?? '')

test('the auth callback keeps its code-verifier cookie even when an old session is in the browser', async () => {
  stubRefreshFailure()
  try {
    const cookie = await requestCookieSeenByRoute('/auth/callback?code=abc&next=%2F')
    assert.match(cookie, /sb-x-auth-token-code-verifier=base64-/)
  } finally { restore() }
})

test('control: a normal page request does clear the dead session (so the test above proves the skip)', async () => {
  stubRefreshFailure()
  try {
    const cookie = await requestCookieSeenByRoute('/students')
    assert.doesNotMatch(cookie, /sb-x-auth-token=base64-/)
  } finally { restore() }
})
