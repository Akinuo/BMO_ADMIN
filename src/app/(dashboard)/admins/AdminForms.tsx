'use client'
import { useEffect, useRef, useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { addAdmin, removeAdmin, searchAccounts, type AccountSuggestion, type ActionState } from './actions'

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
  const formRef = useRef<HTMLFormElement>(null)
  const [value, setValue] = useState('')
  const [items, setItems] = useState<AccountSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const reqId = useRef(0)

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset()
      setValue('')
      setItems([])
    }
  }, [state])

  // Look up matching accounts shortly after the admin stops typing.
  useEffect(() => {
    const q = value.trim()
    if (q.length < 2) {
      setItems([])
      return
    }
    const id = ++reqId.current
    const t = setTimeout(async () => {
      try {
        const res = await searchAccounts(q)
        if (id === reqId.current) {
          setItems(res)
          setActive(-1)
        }
      } catch {
        if (id === reqId.current) setItems([])
      }
    }, 200)
    return () => clearTimeout(t)
  }, [value])

  // Grey "next letters" shown after what has been typed, taken from the best match.
  const typed = value
  const top = items.find(i => i.email.toLowerCase().startsWith(typed.toLowerCase()))
  const ghost = top && typed.length >= 2 ? top.email.slice(typed.length) : ''

  function pick(email: string) {
    setValue(email)
    setItems([])
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault()
      setOpen(true)
      setActive(a => (a + 1) % items.length)
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault()
      setActive(a => (a <= 0 ? items.length - 1 : a - 1))
    } else if (e.key === 'Enter' && open && active >= 0 && items[active]) {
      e.preventDefault()
      pick(items[active].email)
    } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost && e.currentTarget.selectionStart === typed.length) {
      if (e.key === 'Tab' && e.shiftKey) return
      e.preventDefault()
      pick(top!.email)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <form ref={formRef} action={action}>
      <label htmlFor="admin-email" className="block text-sm font-medium text-ink">
        Email of the account to promote
      </label>
      <div className="relative mt-1">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre rounded border border-transparent px-3 text-base sm:text-sm">
          <span className="invisible">{typed}</span>
          <span className="text-muted/60">{ghost}</span>
        </div>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="instructor@example.com"
          className="field !mt-0 bg-transparent"
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && items.length > 0}
          aria-controls="admin-email-list"
          aria-autocomplete="both"
        />
        {open && items.length > 0 && (
          <ul
            id="admin-email-list"
            role="listbox"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded border border-border bg-paper py-1 shadow-md"
          >
            {items.map((it, i) => (
              <li
                key={it.email}
                role="option"
                aria-selected={i === active}
                onMouseDown={e => {
                  e.preventDefault()
                  pick(it.email)
                }}
                onMouseEnter={() => setActive(i)}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? 'bg-denim-light' : ''}`}
              >
                <span className="block truncate font-medium text-ink">{it.email}</span>
                {it.name && <span className="block truncate text-xs text-muted">{it.name}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">Start typing; press Tab to accept the grey suggestion, or pick from the list.</p>
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
