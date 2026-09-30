/**
 * Shared upload/quota limits.
 *
 * Kept in its own module (rather than in services/apiService.ts) so that importing a
 * limit does not transitively pull in config/firebase.ts. That coupling made any
 * consumer - including unit tests - require real Firebase credentials just to read
 * a number.
 */

/**
 * Maximum upload size accepted by /api/remove-bg.
 *
 * Must stay at or below the limit enforced in api/remove-bg.ts, which is itself bound
 * by Vercel's ~4.5MB serverless request body cap.
 */
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024; // 4MB

/** Default per-tool daily request allowance used by the client-side UX guard. */
export const DEFAULT_REQUESTS_PER_DAY = 100;
