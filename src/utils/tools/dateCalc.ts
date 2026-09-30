/**
 * Calendar-date arithmetic for the Age & Date Calculator.
 *
 * Dates are plain { year, month, day } values - never `Date` objects parsed from
 * strings. `new Date('2024-03-10')` is interpreted as UTC midnight, which lands on the
 * previous day for anyone west of Greenwich; parsing the parts by hand avoids that.
 * Day counting uses a timezone-free day number, so DST never shifts a result.
 *
 * Month arithmetic clamps to the end of the month: Jan 31 + 1 month = Feb 28 (Feb 29 in
 * leap years), and Feb 29 + 1 year = Feb 28. Differences use the same rule, so
 * `addToDate(from, difference)` always lands back on `to`.
 */

export interface SimpleDate {
  year: number;
  /** 1-12 */
  month: number;
  /** 1-31 */
  day: number;
}

export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MS_PER_DAY = 86_400_000;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function isValidDate(d: SimpleDate): boolean {
  return (
    Number.isInteger(d.year) &&
    Number.isInteger(d.month) &&
    Number.isInteger(d.day) &&
    d.year >= MIN_YEAR &&
    d.year <= MAX_YEAR &&
    d.month >= 1 &&
    d.month <= 12 &&
    d.day >= 1 &&
    d.day <= daysInMonth(d.year, d.month)
  );
}

/** Parses 'YYYY-MM-DD' (the value of an `<input type="date">`) without touching timezones. */
export function parseISODate(value: string): SimpleDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date: SimpleDate = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidDate(date) ? date : null;
}

export function formatISODate({ year, month, day }: SimpleDate): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** The current local calendar date. */
export function todayLocal(now: Date = new Date()): SimpleDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** Days since 1970-01-01 (proleptic Gregorian). Pure arithmetic - no timezone involved. */
export function toDayNumber({ year, month, day }: SimpleDate): number {
  const d = new Date(0);
  // setUTCFullYear (unlike Date.UTC) does not remap years 0-99 to 1900-1999.
  d.setUTCFullYear(year, month - 1, day);
  return Math.round(d.getTime() / MS_PER_DAY);
}

export function fromDayNumber(dayNumber: number): SimpleDate {
  const d = new Date(dayNumber * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function compareDates(a: SimpleDate, b: SimpleDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekdayIndex(d: SimpleDate): number {
  // 1970-01-01 was a Thursday (index 4).
  return (((toDayNumber(d) + 4) % 7) + 7) % 7;
}

export function weekdayName(d: SimpleDate): string {
  return WEEKDAY_NAMES[weekdayIndex(d)];
}

/** e.g. "Wednesday, 30 September 2026". */
export function formatLongDate(d: SimpleDate): string {
  return `${weekdayName(d)}, ${d.day} ${MONTH_NAMES[d.month - 1]} ${d.year}`;
}

/** Adds whole months, clamping the day to the target month's length. */
export function addMonths(d: SimpleDate, months: number): SimpleDate {
  const zeroBased = d.year * 12 + (d.month - 1) + months;
  const year = Math.floor(zeroBased / 12);
  const month = zeroBased - year * 12 + 1;
  return { year, month, day: Math.min(d.day, daysInMonth(year, month)) };
}

export function addDays(d: SimpleDate, days: number): SimpleDate {
  return fromDayNumber(toDayNumber(d) + days);
}

export type DateUnit = 'days' | 'weeks' | 'months' | 'years';

export const DATE_UNITS: readonly DateUnit[] = ['days', 'weeks', 'months', 'years'];

/**
 * Adds (or, with a negative amount, subtracts) a whole number of units.
 * Returns null when the amount is not an integer or the result leaves years 1-9999.
 */
export function addToDate(d: SimpleDate, amount: number, unit: DateUnit): SimpleDate | null {
  if (!isValidDate(d) || !Number.isInteger(amount)) return null;
  let result: SimpleDate;
  switch (unit) {
    case 'days':
      result = addDays(d, amount);
      break;
    case 'weeks':
      result = addDays(d, amount * 7);
      break;
    case 'months':
      result = addMonths(d, amount);
      break;
    case 'years':
      result = addMonths(d, amount * 12);
      break;
  }
  return isValidDate(result) ? result : null;
}

export interface DateDifference {
  years: number;
  months: number;
  days: number;
  /** Whole months between the dates (years * 12 + months). */
  totalMonths: number;
  totalDays: number;
  totalWeeks: number;
  /** Days left over after totalWeeks. */
  remainderDays: number;
  /** Calendar days * 24 (ignores DST transitions). */
  totalHours: number;
  /** True when `end` was before `start`; the magnitudes are still reported. */
  isNegative: boolean;
}

/** Calendar difference between two dates, in years/months/days and in totals. */
export function dateDifference(start: SimpleDate, end: SimpleDate): DateDifference {
  const isNegative = compareDates(end, start) < 0;
  const from = isNegative ? end : start;
  const to = isNegative ? start : end;

  let totalMonths = (to.year - from.year) * 12 + (to.month - from.month);
  if (compareDates(addMonths(from, totalMonths), to) > 0) totalMonths -= 1;
  const anchor = addMonths(from, totalMonths);
  const days = toDayNumber(to) - toDayNumber(anchor);
  const totalDays = toDayNumber(to) - toDayNumber(from);

  return {
    years: Math.floor(totalMonths / 12),
    months: totalMonths % 12,
    days,
    totalMonths,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    remainderDays: totalDays % 7,
    totalHours: totalDays * 24,
    isNegative,
  };
}

/** The birthday anniversary in a given year (Feb 29 falls back to Feb 28 in common years). */
export function birthdayInYear(birth: SimpleDate, year: number): SimpleDate {
  return addMonths(birth, (year - birth.year) * 12);
}

export interface AgeResult extends Omit<DateDifference, 'isNegative'> {
  weekdayBorn: string;
  nextBirthday: SimpleDate;
  daysUntilNextBirthday: number;
  /** The age the person turns on `nextBirthday`. */
  nextBirthdayAge: number;
  isBirthdayToday: boolean;
}

/** Exact age on `target`. Returns null when the birth date is after the target date. */
export function calculateAge(birth: SimpleDate, target: SimpleDate): AgeResult | null {
  if (!isValidDate(birth) || !isValidDate(target) || compareDates(birth, target) > 0) return null;

  const diff = dateDifference(birth, target);

  let nextBirthday = birthdayInYear(birth, target.year);
  // The birth date itself is not a birthday; someone born today turns 1 next year.
  if (compareDates(nextBirthday, target) < 0 || nextBirthday.year === birth.year) {
    nextBirthday = birthdayInYear(birth, target.year + 1);
  }
  const daysUntilNextBirthday = compareDates(nextBirthday, target);

  return {
    years: diff.years,
    months: diff.months,
    days: diff.days,
    totalMonths: diff.totalMonths,
    totalDays: diff.totalDays,
    totalWeeks: diff.totalWeeks,
    remainderDays: diff.remainderDays,
    totalHours: diff.totalHours,
    weekdayBorn: weekdayName(birth),
    nextBirthday,
    daysUntilNextBirthday,
    nextBirthdayAge: nextBirthday.year - birth.year,
    isBirthdayToday: daysUntilNextBirthday === 0,
  };
}

export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? singular : plural}`;
}
