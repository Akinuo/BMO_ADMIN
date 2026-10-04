// Tunables for the dashboard. Change here, redeploy, done.

/** Dates and "days" are shown in this time zone (also passed to the SQL activity function). */
export const TIMEZONE = 'Asia/Manila'

/** A student counts as "active" if they completed a step within this many days. */
export const ACTIVE_DAYS = 7

/** An unfinished student with no progress for this many days is flagged "Stalled". */
export const STALLED_DAYS = 14

/** Days shown in the activity chart on the overview page. */
export const ACTIVITY_DAYS = 30

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

export const DAY_MS = 24 * 60 * 60 * 1000
