import { DATA_CACHE_SECONDS, DATA_STALE_SECONDS } from './config'

type Entry = { at: number; value: Promise<unknown>; refreshing?: boolean; retryAfter?: number }

// Kept on globalThis so pages and server actions share one store even if the bundler
// gives them separate copies of this module.
const g = globalThis as typeof globalThis & { __bmoDataCache?: Map<string, Entry> }
const store = (g.__bmoDataCache ??= new Map<string, Entry>())

type Options = { freshMs?: number; staleMs?: number }

/**
 * Reuses a recent (or still in-flight) result on this server instance, so a burst of page views
 * runs each database query once instead of once per view.
 *
 *  - younger than `freshMs`: returned as is.
 *  - older, but younger than `staleMs`: the previous result is returned INSTANTLY and a fresh one
 *    is loaded in the background for the next view (stale-while-revalidate).
 *  - older than that, or never loaded: waits for a fresh load.
 *
 * Failures are never kept. Only call this AFTER requireAdmin() has passed: the cache does no
 * permission check, and the background refresh runs with the calling admin's session.
 */
export function ttlCache<T>(key: string, load: () => Promise<T>, opts: Options = {}): Promise<T> {
  const fresh = opts.freshMs ?? DATA_CACHE_SECONDS * 1000
  const stale = Math.max(fresh, opts.staleMs ?? DATA_STALE_SECONDS * 1000)
  const now = Date.now()
  const hit = store.get(key)

  if (fresh > 0 && hit) {
    const age = now - hit.at
    if (age < fresh) return hit.value as Promise<T>
    if (age < stale) {
      if (!hit.refreshing && now >= (hit.retryAfter ?? 0)) {
        hit.refreshing = true
        load().then(
          value => { if (store.get(key) === hit) store.set(key, { at: Date.now(), value: Promise.resolve(value) }) },
          // keep serving the previous numbers; try again in a few seconds
          () => { hit.refreshing = false; hit.retryAfter = Date.now() + 10_000 },
        )
      }
      return hit.value as Promise<T>
    }
  }

  const entry: Entry = { at: now, value: load() }
  store.set(key, entry)
  entry.value.catch(() => { if (store.get(key) === entry) store.delete(key) })
  return entry.value as Promise<T>
}

/** Forget everything, so the next page view reads fresh numbers. */
export function clearDataCache() {
  store.clear()
}
