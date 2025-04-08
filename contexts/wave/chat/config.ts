/**
 * Default number of latest drops to fetch when activating/prefetching a wave.
 */
export const DEFAULT_PREFETCH_LIMIT = 90;

/**
 * Default number of older drops to fetch per request when scrolling up for history.
 */
export const DEFAULT_HISTORY_FETCH_LIMIT = 30;

/**
 * Default time (in milliseconds) after which cached wave data is considered
 * "stale" and might trigger a refresh on activation. 5 minutes.
 */
export const DEFAULT_STALE_TIME_MS = 5 * 60 * 1000;

/**
 * Default interval (in milliseconds) for the background API sync process
 * to run for the currently *active* wave. 1 minute.
 */
export const DEFAULT_SYNC_INTERVAL_MS = 1 * 60 * 1000;

/**
 * Default concurrency limit for simultaneous `activateWave` API calls.
 * Prevents overwhelming the backend during prefetching bursts.
 */
export const DEFAULT_CONCURRENCY_LIMIT = 3;

/**
 * Default time threshold (in milliseconds) to consider a wave "recent"
 * based on its last drop timestamp, for background prefetching. 24 hours.
 */
export const DEFAULT_RECENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

// Add any other default configuration constants here as needed.
// For example, if implementing max cache size:
// export const DEFAULT_MAX_CACHED_WAVES = 100;
