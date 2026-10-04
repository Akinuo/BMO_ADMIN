import type { Metadata } from 'next'
import { PageHeader } from '@/components/ui'
import { getDashboard } from '@/lib/data'
import StudentsTable, { type Filter } from './StudentsTable'

export const metadata: Metadata = { title: 'Students' }

const FILTERS: Filter[] = ['all', 'not_started', 'in_progress', 'stalled', 'completed', 'certified']

export default async function StudentsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const { students, summary, nowMs } = await getDashboard()
  const initialFilter = FILTERS.includes(searchParams.filter as Filter) ? (searchParams.filter as Filter) : 'all'

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${summary.total.toLocaleString('en-PH')} registered · progress out of ${summary.totalSteps} steps in ${summary.totalLessons} lessons`}
      />
      <StudentsTable
        students={students}
        nowMs={nowMs}
        totalSteps={summary.totalSteps}
        totalLessons={summary.totalLessons}
        initialFilter={initialFilter}
      />
    </>
  )
}
