import type { Metadata } from 'next'
import { Avatar, EmptyState, PageHeader } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { getAdmins } from '@/lib/data'
import { timeAgo } from '@/lib/format'
import { AddAdminForm, RemoveAdminButton } from './AdminForms'

export const metadata: Metadata = { title: 'Admins' }

export default async function AdminsPage() {
  const [me, { admins, setupNeeded, error }] = await Promise.all([requireAdmin(), getAdmins()])
  const nowMs = Date.now()

  return (
    <>
      <PageHeader title="Admins" subtitle="Accounts that can sign in to this dashboard and see student data." />

      {setupNeeded && (
        <section className="alert-info" role="status">
          <p className="font-semibold">One-time setup needed</p>
          <p className="mt-1">
            Open the Supabase SQL Editor, paste the contents of <code>supabase/admin_management.sql</code> from the repo, run it,
            then refresh this page. Nothing else in the dashboard is affected.
          </p>
        </section>
      )}
      {error && <p role="alert" className="alert-err">{error}</p>}

      {!setupNeeded && !error && (
      <section className="card p-5" aria-label="Add an admin">
        <h2 className="card-title">Add a new admin</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          The person must already have an account with a confirmed email (sign up in the student app or with Google first).
          Only give this to instructors — admins can see student emails.
        </p>
        <div className="max-w-md">
          <AddAdminForm />
        </div>
      </section>
      )}

      {!setupNeeded && !error && (
      <section className="card mt-6 overflow-hidden" aria-label="Current admins">
        {admins.length === 0 ? (
          <EmptyState title="No admins found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th className="hidden sm:table-cell">Last sign-in</th>
                  <th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {admins.map(a => {
                  const name = a.display_name || a.email?.split('@')[0] || 'Admin'
                  const isMe = a.user_id === me.id
                  return (
                    <tr key={a.user_id}>
                      <td>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={name} />
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">
                              {name} {isMe && <span className="chip-denim ml-1">You</span>}
                            </span>
                            {a.email && <span className="block truncate text-xs text-muted">{a.email}</span>}
                          </span>
                        </div>
                      </td>
                      <td className="hidden whitespace-nowrap text-muted sm:table-cell">{timeAgo(a.last_sign_in_at, nowMs)}</td>
                      <td className="text-right">{!isMe && <RemoveAdminButton userId={a.user_id} email={a.email} />}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </>
  )
}
