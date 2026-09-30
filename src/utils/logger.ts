/**
 * Logger utility.
 *
 * Development: everything goes to the console.
 * Production: console output is suppressed, and `error` is forwarded to the central
 * error reporter so failures are visible without leaking details to users.
 */
import { reportError } from './errorReporter';

const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

export const logger = {
  log: (...args: LogArgs) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: LogArgs) => {
    if (isDev) console.warn(...args);
  },
  error: (message: string, error?: unknown, ...rest: LogArgs) => {
    if (isDev) console.error(message, error, ...rest);
    reportError(error ?? message, message);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args);
  },
};
