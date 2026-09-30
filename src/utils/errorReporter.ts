/**
 * Centralised error reporting.
 *
 * Production errors are sent to Google Analytics as `exception` events (gtag is
 * already on every page), so failures show up in GA > Events without adding a paid
 * error-tracking SDK. To move to Sentry later, replace `send` below - every caller
 * (logger.error, ErrorBoundary, global handlers) already funnels through here.
 */

const MAX_REPORTS_PER_SESSION = 20;
const MAX_DESCRIPTION_LENGTH = 150;

let reportCount = 0;
const seen = new Set<string>();

export const describeError = (error: unknown): string => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/** Errors thrown when a lazily-loaded chunk no longer exists after a deploy. */
export const isChunkLoadError = (error: unknown): boolean =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed/i.test(
    describeError(error)
  );

const RELOAD_GUARD_KEY = 'aivello_chunk_reload';

/**
 * Reloads the page once to pick up a new deploy's chunks. Returns false (and does
 * nothing) if a reload was already attempted in the last minute, so a genuinely
 * broken chunk cannot cause a reload loop.
 */
export const reloadForNewVersion = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
};

const send = (description: string, fatal: boolean) => {
  window.gtag?.('event', 'exception', { description, fatal });
};

export const reportError = (error: unknown, context?: string, fatal = false): void => {
  if (!import.meta.env.PROD || typeof window === 'undefined') return;
  if (reportCount >= MAX_REPORTS_PER_SESSION) return;

  const description = `${context ? `[${context}] ` : ''}${describeError(error)}`.slice(0, MAX_DESCRIPTION_LENGTH);
  if (seen.has(description)) return;
  seen.add(description);
  reportCount += 1;

  try {
    send(description, fatal);
  } catch {
    // Reporting must never throw.
  }
};

/** Registers window-level handlers once, from src/index.tsx. */
export const installGlobalErrorHandlers = (): void => {
  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, 'window.onerror');
  });
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'unhandledrejection');
  });
  // Vite fires this when a preloaded dependency of a lazy chunk fails to load,
  // which after a deploy means the user is running a stale index.html.
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadForNewVersion()) event.preventDefault();
  });
};

/** Test-only: resets the per-session counters. */
export const __resetErrorReporterForTests = () => {
  reportCount = 0;
  seen.clear();
};
