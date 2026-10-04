// Tunables for the dashboard. Change here, redeploy, done.

/** Dates and "days" are shown in this time zone (also passed to the SQL activity function). */
export const TIMEZONE = 'Asia/Manila'

/** A student counts as "active" if they completed a step within this many days. */
export const ACTIVE_DAYS = 7

/** An unfinished student with no progress for this many days is flagged "Stalled". */
export const STALLED_DAYS = 14

/** Days shown in the activity chart on the overview page. */
export const ACTIVITY_DAYS = 30

/** The Overview always loads this many days once and slices it for the 7 / 30 / 90-day views, so switching range reuses the cache. */
export const ACTIVITY_MAX_DAYS = 90

/** The "still loading" message appears if a page takes longer than this (milliseconds). Keep in sync with .slow-loader in globals.css. */
export const SLOW_LOAD_MS = 2000

/** Rows shown on the leaderboard page before pointing to the full Students table. */
export const LEADERBOARD_LIMIT = 50

/** Rows per page in the Students table. */
export const PAGE_SIZE = 25

/**
 * How long the server reuses the student numbers between page views (seconds). Every admin shares
 * the same cached copy, so the database runs the heavy queries at most once per window.
 * The Refresh button always bypasses it. Set to 0 to turn caching off.
 */
export const DATA_CACHE_SECONDS = 30

/**
 * After the fresh window above, the server keeps serving the previous numbers instantly for this
 * much longer (in seconds) while it refreshes them in the background. Past it, a page view waits
 * for fresh data. The Overview shows when the numbers were last loaded.
 */
export const DATA_STALE_SECONDS = 300

export const DAY_MS = 24 * 60 * 60 * 1000
