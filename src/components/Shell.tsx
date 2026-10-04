'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { IconLogout, IconOverview, IconShield, IconTrophy, IconUsers, SpoolMark } from './icons'

const NAV = [
  { href: '/', label: 'Overview', Icon: IconOverview },
  { href: '/students', label: 'Students', Icon: IconUsers },
  { href: '/leaderboard', label: 'Leaderboard', Icon: IconTrophy },
  { href: '/admins', label: 'Admins', Icon: IconShield },
]

function isActive(path: string, href: string) {
  return href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
}

function SignOut({ compact = false }: { compact?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        className={
          compact
            ? 'flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white'
            : 'flex w-full items-center gap-2.5 rounded px-3 py-2 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white'
        }
        aria-label="Sign out"
        title="Sign out"
      >
        <IconLogout className="h-5 w-5" />
        {!compact && 'Sign out'}
      </button>
    </form>
  )
}

export default function Shell({ name, email, children }: { name: string; email: string | null; children: ReactNode }) {
  const path = usePathname()

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col overflow-hidden bg-denim text-white lg:flex">
        <SpoolMark className="absolute -bottom-8 -right-6 h-56 w-56 -rotate-12 text-white/[0.06]" />
        <Link href="/" className="relative flex items-center gap-3 px-5 pb-4 pt-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper">
            <Image src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold">B.M.O Admin</span>
            <span className="block text-xs text-white/60">Student progress</span>
          </span>
        </Link>
        <div className="stitch-rule mx-5" />

        <nav className="relative mt-4 grid gap-1 px-3" aria-label="Main">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(path, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white text-denim shadow-sm' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="relative mt-auto border-t border-white/10 p-3">
          <div className="mb-2 px-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && <p className="truncate text-xs text-white/60">{email}</p>}
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 bg-denim text-white shadow-nav lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-paper">
              <Image src="/logo-mark.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            </span>
            <span className="font-display text-base font-bold">B.M.O Admin</span>
          </Link>
          <SignOut compact />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Main">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(path, href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-white text-denim' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main id="main" className="lg:pl-60">
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  )
}
