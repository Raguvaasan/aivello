/**
 * Pure helpers for the Timestamp Converter tool.
 */

export type TimestampUnit = 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds';
export type TimestampUnitOption = 'auto' | TimestampUnit;

export const UNIT_LABELS: Record<TimestampUnit, string> = {
  seconds: 'Seconds',
  milliseconds: 'Milliseconds',
  microseconds: 'Microseconds',
  nanoseconds: 'Nanoseconds',
};

const UNIT_TO_MS: Record<TimestampUnit, number> = {
  seconds: 1000,
  milliseconds: 1,
  microseconds: 1 / 1000,
  nanoseconds: 1 / 1000000,
};

/** ECMAScript Date range: ±8.64e15 ms (±100,000,000 days) around the epoch. */
export const MAX_DATE_MS = 8.64e15;

const DAY_MS = 24 * 3600 * 1000;

/**
 * Guesses the unit of a Unix timestamp from its magnitude:
 *  |v| < 1e11 -> seconds (up to the year 5138), < 1e14 -> milliseconds (up to 5138),
 *  < 1e17 -> microseconds, otherwise nanoseconds.
 */
export function detectTimestampUnit(value: number): TimestampUnit {
  const abs = Math.abs(value);
  if (abs < 1e11) return 'seconds';
  if (abs < 1e14) return 'milliseconds';
  if (abs < 1e17) return 'microseconds';
  return 'nanoseconds';
}

export type ParsedTimestamp =
  | { ok: true; ms: number; unit: TimestampUnit; detected: boolean }
  | { ok: false; error: string };

/** Parses a numeric timestamp (optionally with fraction, `_`, `,` or spaces as digit separators). */
export function parseTimestamp(input: string, unit: TimestampUnitOption = 'auto'): ParsedTimestamp {
  const cleaned = input.trim().replace(/[\s_,]/g, '');
  if (cleaned === '') return { ok: false, error: 'Enter a Unix timestamp' };
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) {
    return { ok: false, error: 'A timestamp must be a number, e.g. 1700000000 or 1700000000000' };
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return { ok: false, error: 'Number is out of range' };
  const resolved = unit === 'auto' ? detectTimestampUnit(value) : unit;
  const ms = value * UNIT_TO_MS[resolved];
  if (Math.abs(ms) > MAX_DATE_MS) {
    return { ok: false, error: 'That timestamp is outside the range JavaScript dates support (±275,760 years)' };
  }
  return { ok: true, ms, unit: resolved, detected: unit === 'auto' };
}

/** Returns `ms` expressed in each unit as integer strings. */
export function toAllUnits(ms: number): Record<TimestampUnit, string> {
  const micros = Math.round(ms * 1000);
  return {
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(Math.floor(ms)),
    microseconds: String(micros),
    nanoseconds: micros === 0 ? '0' : `${micros}000`,
  };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function getLocalTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const FALLBACK_TIME_ZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

/** All IANA time zones the browser knows (via Intl.supportedValuesOf), always including UTC. */
export function getSupportedTimeZones(): string[] {
  let zones: string[] = [];
  try {
    if (typeof Intl.supportedValuesOf === 'function') zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = [];
  }
  if (zones.length === 0) zones = FALLBACK_TIME_ZONES.filter(isValidTimeZone);
  const set = new Set(zones);
  set.add('UTC');
  const local = getLocalTimeZone();
  if (isValidTimeZone(local)) set.add(local);
  return Array.from(set).sort((a, b) => (a === 'UTC' ? -1 : b === 'UTC' ? 1 : a.localeCompare(b)));
}

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const partsFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getPartsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = partsFormatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      era: 'short',
    });
    partsFormatterCache.set(timeZone, f);
  }
  return f;
}

/** Wall-clock fields of instant `ms` in `timeZone`. */
export function getZonedParts(ms: number, timeZone: string): ZonedParts {
  const parts = getPartsFormatter(timeZone).formatToParts(new Date(ms));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const p = parts.find((x) => x.type === type);
    return p ? Number(p.value) : 0;
  };
  const era = parts.find((x) => x.type === 'era');
  let year = get('year');
  if (era && /^b/i.test(era.value)) year = 1 - year; // 1 BC is astronomical year 0
  return {
    year,
    month: get('month'),
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
    second: get('second'),
  };
}

function utcFromParts(p: ZonedParts): number {
  const d = new Date(0);
  d.setUTCFullYear(p.year, p.month - 1, p.day);
  d.setUTCHours(p.hour, p.minute, p.second, 0);
  return d.getTime();
}

/** Offset of `timeZone` from UTC at instant `ms`, in minutes (e.g. +330 for Asia/Kolkata). */
export function getTimeZoneOffsetMinutes(ms: number, timeZone: string): number {
  const wholeSeconds = Math.floor(ms / 1000) * 1000;
  return Math.round((utcFromParts(getZonedParts(wholeSeconds, timeZone)) - wholeSeconds) / 60000);
}

export function formatOffset(minutes: number, separator = ':'): string {
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, '0');
  const m = String(abs % 60).padStart(2, '0');
  return `${sign}${h}${separator}${m}`;
}

const pad = (n: number, width = 2): string => String(Math.abs(n)).padStart(width, '0');

function formatYear(year: number): string {
  if (year >= 0 && year <= 9999) return pad(year, 4);
  return (year < 0 ? '-' : '+') + pad(year, 6);
}

/** ISO 8601 with the numeric offset of `timeZone`, e.g. 2024-03-10T08:30:00.000+05:30. */
export function toIsoInTimeZone(ms: number, timeZone: string): string {
  const p = getZonedParts(ms, timeZone);
  const offset = getTimeZoneOffsetMinutes(ms, timeZone);
  const millis = pad(((Math.floor(ms) % 1000) + 1000) % 1000, 3);
  const suffix = offset === 0 ? 'Z' : formatOffset(offset);
  return `${formatYear(p.year)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}.${millis}${suffix}`;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** RFC 2822 date in `timeZone`, e.g. "Sun, 10 Mar 2024 08:30:00 +0530". */
export function toRfc2822(ms: number, timeZone = 'UTC'): string {
  const p = getZonedParts(ms, timeZone);
  const offset = getTimeZoneOffsetMinutes(ms, timeZone);
  const weekday = DAY_NAMES[new Date(utcFromParts(p)).getUTCDay()];
  return `${weekday}, ${pad(p.day)} ${MONTH_NAMES[p.month - 1]} ${p.year} ${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)} ${formatOffset(offset, '')}`;
}

/** Long, human readable date in `timeZone` using the visitor's locale. */
export function formatHuman(ms: number, timeZone: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(ms));
}

const RELATIVE_STEPS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 365.2425 * 24 * 3600 * 1000 },
  { unit: 'month', ms: (365.2425 / 12) * 24 * 3600 * 1000 },
  { unit: 'week', ms: 7 * 24 * 3600 * 1000 },
  { unit: 'day', ms: 24 * 3600 * 1000 },
  { unit: 'hour', ms: 3600 * 1000 },
  { unit: 'minute', ms: 60 * 1000 },
  { unit: 'second', ms: 1000 },
];

/** Picks the largest sensible unit for the gap between `ms` and `nowMs`. */
export function getRelativeParts(ms: number, nowMs: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
  const diff = ms - nowMs;
  const abs = Math.abs(diff);
  for (const step of RELATIVE_STEPS) {
    if (abs >= step.ms || step.unit === 'second') {
      return { value: Math.round(diff / step.ms), unit: step.unit };
    }
  }
  return { value: 0, unit: 'second' };
}

/** "3 days ago", "in 2 hours", "now" (via Intl.RelativeTimeFormat). */
export function formatRelative(ms: number, nowMs: number, locale?: string): string {
  const { value, unit } = getRelativeParts(ms, nowMs);
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(value, unit);
  } catch {
    if (value === 0) return 'now';
    const abs = Math.abs(value);
    const label = `${abs} ${unit}${abs === 1 ? '' : 's'}`;
    return value < 0 ? `${label} ago` : `in ${label}`;
  }
}

/**
 * Interprets a `datetime-local` style value ("YYYY-MM-DDTHH:mm" or with ":ss") as wall-clock
 * time in `timeZone` and returns the epoch milliseconds, or null if the value is malformed.
 * For times that occur twice (DST fall-back) the earlier instant is returned; times skipped by a
 * DST jump are shifted forward by the size of the gap.
 */
export function zonedDateTimeToEpoch(value: string, timeZone: string): number | null {
  const m = /^(-?\d{4,6})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value.trim());
  if (!m) return null;
  const parts: ZonedParts = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4]),
    minute: Number(m[5]),
    second: m[6] ? Number(m[6]) : 0,
  };
  const millis = m[7] ? Number(m[7].padEnd(3, '0')) : 0;
  if (parts.month < 1 || parts.month > 12 || parts.day < 1 || parts.day > 31 || parts.hour > 23 || parts.minute > 59 || parts.second > 59) {
    return null;
  }
  const monthEnd = new Date(0);
  monthEnd.setUTCFullYear(parts.year, parts.month, 0);
  if (parts.day > monthEnd.getUTCDate()) return null;
  const guess = utcFromParts(parts);
  if (!Number.isFinite(guess) || Math.abs(guess) > MAX_DATE_MS - 2 * DAY_MS) return null;
  // Try every offset in effect around that wall-clock time and keep the instants that really
  // show that wall-clock time in the zone.
  const offsetBefore = getTimeZoneOffsetMinutes(guess - DAY_MS, timeZone);
  const offsets = new Set([offsetBefore, getTimeZoneOffsetMinutes(guess, timeZone), getTimeZoneOffsetMinutes(guess + DAY_MS, timeZone)]);
  let best: number | null = null;
  for (const offset of Array.from(offsets)) {
    const t = guess - offset * 60000;
    if (utcFromParts(getZonedParts(t, timeZone)) === guess && (best === null || t < best)) best = t;
  }
  // Inside a DST gap no instant matches: shift forward by the gap (use the offset before it).
  const instant = best ?? guess - offsetBefore * 60000;
  return instant + millis;
}

/** Formats instant `ms` as a `datetime-local` value ("YYYY-MM-DDTHH:mm:ss") in `timeZone`. */
export function epochToZonedInputValue(ms: number, timeZone: string): string {
  const p = getZonedParts(ms, timeZone);
  if (p.year < 0 || p.year > 9999) return '';
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

export interface TimestampDetails {
  ms: number;
  units: Record<TimestampUnit, string>;
  iso: string;
  isoZoned: string;
  rfc2822: string;
  rfc2822Utc: string;
  human: string;
  humanUtc: string;
  relative: string;
  offset: string;
}

export function describeTimestamp(ms: number, timeZone: string, nowMs: number, locale?: string): TimestampDetails {
  return {
    ms,
    units: toAllUnits(ms),
    iso: new Date(ms).toISOString(),
    isoZoned: toIsoInTimeZone(ms, timeZone),
    rfc2822: toRfc2822(ms, timeZone),
    rfc2822Utc: toRfc2822(ms, 'UTC'),
    human: formatHuman(ms, timeZone, locale),
    humanUtc: formatHuman(ms, 'UTC', locale),
    relative: formatRelative(ms, nowMs, locale),
    offset: `UTC${formatOffset(getTimeZoneOffsetMinutes(ms, timeZone))}`,
  };
}
