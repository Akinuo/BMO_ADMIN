import Link from 'next/link'
import { IconArrowLeft } from '@/components/icons'

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md p-8 text-center">
      <h1 className="font-display text-xl font-bold text-denim">Student not found</h1>
      <p className="mt-2 text-sm text-muted">That student doesn&rsquo;t exist, or isn&rsquo;t counted as a student (admins and unconfirmed accounts are left out).</p>
      <Link href="/students" className="btn mt-6">
        <IconArrowLeft className="h-4 w-4" /> Back to students
      </Link>
    </div>
  )
}
