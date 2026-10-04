'use client'
import { useEffect, useRef } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addAdmin, removeAdmin, type ActionState } from './actions'

function Submit({ label, busyLabel, className = 'btn' }: { label: string; busyLabel: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? busyLabel : label}
    </button>
  )
}

function Notice({ state }: { state: ActionState }) {
  if (!state) return null
  return (
    <p role={state.ok ? 'status' : 'alert'} className={`${state.ok ? 'alert-ok' : 'alert-err'} mt-3`}>
      {state.message}
    </p>
  )
}

export function AddAdminForm() {
  const [state, action] = useFormState(addAdmin, null)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.ok) ref.current?.reset()
  }, [state])

  return (
    <form ref={ref} action={action}>
      <label className="block text-sm font-medium text-ink">
        Email of the account to promote
        <input name="email" type="email" required autoComplete="off" placeholder="instructor@example.com" className="field" />
      </label>
      <div className="mt-3">
        <Submit label="Add admin" busyLabel="Adding…" />
      </div>
      <Notice state={state} />
    </form>
  )
}

export function RemoveAdminButton({ userId, email }: { userId: string; email: string | null }) {
  const [state, action] = useFormState(removeAdmin, null)
  return (
    <form
      action={action}
      onSubmit={e => {
        if (!confirm(`Remove admin access for ${email ?? 'this account'}? They will become a normal student account.`)) e.preventDefault()
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <Submit label="Remove" busyLabel="Removing…" className="btn-ghost" />
      {state && !state.ok && <p role="alert" className="mt-1 text-xs text-red">{state.message}</p>}
    </form>
  )
}
