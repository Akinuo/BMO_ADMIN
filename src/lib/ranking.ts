// ─────────────────────────────────────────────────────────────────────────────
// Ranking
//
// Students who have completed at least one step are ranked by, in order:
//   1. Steps completed (more is better)               → overall course progress
//   2. Final-assessment score % (higher is better)    → only matters once the course is done;
//                                                       no attempt ranks below any attempt
//   3. Who reached that point first (earlier wins)    → time of their most recent completed step
//
// Students with exactly the same values on all three share a rank ("1, 2, 2, 4" style),
// so nobody is ranked above an equal. Students with zero steps are not ranked (rank = null).
// ─────────────────────────────────────────────────────────────────────────────

export type RankInput = {
  id: string
  steps: number
  /** 0–100, or null if the assessment hasn't been taken */
  assessmentPct: number | null
  /** ISO timestamp of the most recent completed step */
  lastActivity: string | null
}

export type Ranked<T> = T & { rank: number | null; tied: boolean }

const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY)

function compare(a: RankInput, b: RankInput): number {
  if (a.steps !== b.steps) return b.steps - a.steps
  const pa = a.assessmentPct ?? -1
  const pb = b.assessmentPct ?? -1
  if (pa !== pb) return pb - pa
  const ta = ms(a.lastActivity)
  const tb = ms(b.lastActivity)
  if (ta !== tb) return ta < tb ? -1 : 1
  return 0
}

/**
 * Returns the ranked students first (best → worst), then the unranked ones in their
 * original order. Does not mutate the input.
 */
export function rankStudents<T extends RankInput>(items: T[]): Ranked<T>[] {
  const ranked = items.filter(i => i.steps > 0)
  const unranked = items.filter(i => i.steps <= 0)

  // Array.prototype.sort is stable, so exact ties keep their original order.
  const sorted = [...ranked].sort(compare)

  const out: Ranked<T>[] = []
  let currentRank = 0
  sorted.forEach((item, i) => {
    const prev = sorted[i - 1]
    const sameAsPrev = prev !== undefined && compare(prev, item) === 0
    if (!sameAsPrev) currentRank = i + 1
    out.push({ ...item, rank: currentRank, tied: false })
  })

  // mark everyone who shares a rank with someone else
  const counts = new Map<number, number>()
  out.forEach(r => counts.set(r.rank as number, (counts.get(r.rank as number) ?? 0) + 1))
  out.forEach(r => { r.tied = (counts.get(r.rank as number) ?? 0) > 1 })

  return [...out, ...unranked.map(u => ({ ...u, rank: null, tied: false }))]
}
