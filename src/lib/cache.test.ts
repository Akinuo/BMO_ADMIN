import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearDataCache, ttlCache } from './cache'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
let n = 0
const key = () => `t${++n}`

test('a fresh result is reused instead of loading again', async () => {
  clearDataCache()
  const k = key()
  let calls = 0
  const load = async () => ++calls
  const opts = { freshMs: 200, staleMs: 400 }
  assert.equal(await ttlCache(k, load, opts), 1)
  assert.equal(await ttlCache(k, load, opts), 1)
  assert.equal(calls, 1)
})

test('simultaneous callers share one in-flight load', async () => {
  clearDataCache()
  const k = key()
  let calls = 0
  const load = async () => { calls++; await sleep(20); return 'x' }
  const opts = { freshMs: 200, staleMs: 400 }
  const out = await Promise.all([ttlCache(k, load, opts), ttlCache(k, load, opts), ttlCache(k, load, opts)])
  assert.deepEqual(out, ['x', 'x', 'x'])
  assert.equal(calls, 1)
})

test('a failed load is not kept', async () => {
  clearDataCache()
  const k = key()
  const opts = { freshMs: 200, staleMs: 400 }
  await assert.rejects(ttlCache(k, async () => { throw new Error('boom') }, opts))
  await sleep(5)
  assert.equal(await ttlCache(k, async () => 'ok', opts), 'ok')
})

test('stale data is returned instantly while a fresh copy loads in the background', async () => {
  clearDataCache()
  const k = key()
  const opts = { freshMs: 20, staleMs: 500 }
  assert.equal(await ttlCache(k, async () => 'old', opts), 'old')
  await sleep(40) // now stale
  const t0 = Date.now()
  const slow = async () => { await sleep(60); return 'new' }
  assert.equal(await ttlCache(k, slow, opts), 'old') // no waiting
  assert.ok(Date.now() - t0 < 40, 'should not wait for the refresh')
  await sleep(100)
  assert.equal(await ttlCache(k, async () => 'newer', opts), 'new') // refreshed copy is fresh now
})

test('a failed background refresh keeps serving the previous data', async () => {
  clearDataCache()
  const k = key()
  const opts = { freshMs: 20, staleMs: 500 }
  await ttlCache(k, async () => 'old', opts)
  await sleep(40)
  assert.equal(await ttlCache(k, async () => { throw new Error('down') }, opts), 'old')
  await sleep(10)
  assert.equal(await ttlCache(k, async () => 'unused', opts), 'old')
})

test('past the stale window the caller waits for fresh data', async () => {
  clearDataCache()
  const k = key()
  const opts = { freshMs: 10, staleMs: 30 }
  await ttlCache(k, async () => 'old', opts)
  await sleep(60)
  assert.equal(await ttlCache(k, async () => 'fresh', opts), 'fresh')
})

test('clearDataCache forces a reload', async () => {
  clearDataCache()
  const k = key()
  let calls = 0
  const load = async () => ++calls
  const opts = { freshMs: 500, staleMs: 900 }
  await ttlCache(k, load, opts)
  clearDataCache()
  assert.equal(await ttlCache(k, load, opts), 2)
})
