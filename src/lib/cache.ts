import { DATA_CACHE_SECONDS } from './config'

type Entry = { at: number; value: Promise<unknown> }

// Kept on globalThis so pages and server actions share one store even if the bundler
// gives them separate copies of this module.
const g = globalThis as typeof globalThis & { __bmoDataCache?: Map<string, Entry> }
const store = (g.__bmoDataCache ??= new Map<string, Entry>())

/**
 * Reuses a recent (or still in-flight) result on this server instance, so a burst of page views
 * runs each database query once instead of once per view.
 *
 * Only call this for data every admin may see, and only hand the result to a caller that has
 * passed requireAdmin(): the cache itself does no permission check.
 */
export function ttlCache<T>(key: string, load: () => Promise<T>): Promise<T> {
  const ttl = DATA_CACHE_SECONDS * 1000
  const hit = store.get(key)
  if (ttl > 0 && hit && Date.now() - hit.at < ttl) return hit.value as Promise<T>

  const entry: Entry = { at: Date.now(), value: load() }
  store.set(key, entry)
  // Never keep a failure around (e.g. a non-admin's "not authorized").
  entry.value.catch(() => { if (store.get(key) === entry) store.delete(key) })
  return entry.value as Promise<T>
}

/** Forget everything, so the next page view reads fresh numbers. */
export function clearDataCache() {
  store.clear()
}
