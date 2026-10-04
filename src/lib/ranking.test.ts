import test from 'node:test'
import assert from 'node:assert/strict'
import { rankStudents, type RankInput } from './ranking'

const s = (id: string, steps: number, pct: number | null = null, last: string | null = '2026-09-01T00:00:00Z'): RankInput => ({
  id, steps, assessmentPct: pct, lastActivity: steps > 0 ? last : null,
})
const ids = (xs: { id: string }[]) => xs.map(x => x.id).join(',')

test('more steps ranks higher', () => {
  const r = rankStudents([s('a', 10), s('b', 30), s('c', 20)])
  assert.equal(ids(r), 'b,c,a')
  assert.deepEqual(r.map(x => x.rank), [1, 2, 3])
})

test('equal steps: higher assessment score wins, and any score beats no attempt', () => {
  const r = rankStudents([s('none', 40, null), s('low', 40, 70), s('high', 40, 95)])
  assert.equal(ids(r), 'high,low,none')
})

test('equal steps and score: whoever reached it first wins', () => {
  const r = rankStudents([
    s('late', 12, null, '2026-09-10T00:00:00Z'),
    s('early', 12, null, '2026-09-02T00:00:00Z'),
  ])
  assert.equal(ids(r), 'early,late')
  assert.deepEqual(r.map(x => x.rank), [1, 2])
})

test('exact ties share a rank and the next rank is skipped', () => {
  const r = rankStudents([s('a', 20), s('b', 20), s('c', 20), s('d', 5)])
  assert.deepEqual(r.map(x => x.rank), [1, 1, 1, 4])
  assert.deepEqual(r.map(x => x.tied), [true, true, true, false])
})

test('students with no steps are unranked and listed last in original order', () => {
  const r = rankStudents([s('zero1', 0), s('a', 3), s('zero2', 0), s('b', 9)])
  assert.equal(ids(r), 'b,a,zero1,zero2')
  assert.deepEqual(r.map(x => x.rank), [1, 2, null, null])
  assert.deepEqual(r.map(x => x.tied), [false, false, false, false])
})

test('a 0% assessment still outranks no attempt', () => {
  const r = rankStudents([s('none', 40, null), s('zero', 40, 0)])
  assert.equal(ids(r), 'zero,none')
})

test('does not mutate its input and handles empty input', () => {
  const input = [s('a', 1), s('b', 2)]
  const copy = JSON.stringify(input)
  rankStudents(input)
  assert.equal(JSON.stringify(input), copy)
  assert.deepEqual(rankStudents([]), [])
})
