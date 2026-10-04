import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Setup needed' }

// Shown (via middleware) when the Supabase environment variables are missing.
export default function SetupPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <h1 className="font-display text-2xl font-bold text-denim">Almost there — connect your database</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This dashboard reads the same Supabase project as the student app. Add these two values (from Supabase &rarr; Project Settings &rarr; API),
          then restart the server{' '}
          <span className="text-muted">(on Vercel: Project Settings &rarr; Environment Variables, then redeploy)</span>:
        </p>
        <pre className="mt-4 overflow-x-auto rounded bg-chalk p-3 font-mono text-xs leading-relaxed text-ink">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key`}
        </pre>
        <p className="mt-4 text-sm text-muted">
          Use the <b className="text-ink">anon / publishable</b> key only. The service-role key is not needed and must never be used here.
        </p>
      </div>
    </div>
  )
}
