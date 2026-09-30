import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  daysInMonth,
  parseISODate,
  formatISODate,
  todayLocal,
  toDayNumber,
  fromDayNumber,
  weekdayName,
  formatLongDate,
  addMonths,
  addToDate,
  dateDifference,
  calculateAge,
  birthdayInYear,
  pluralize,
  type SimpleDate,
} from '../../utils/tools/dateCalc';

const d = (iso: string): SimpleDate => {
  const parsed = parseISODate(iso);
  if (!parsed) throw new Error(`bad test date ${iso}`);
  return parsed;
};

describe('leap years and month lengths', () => {
  it('follows the Gregorian rules', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
  });

  it('knows every month length', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => daysInMonth(2023, m))).toEqual([
      31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
    ]);
    expect(daysInMonth(2024, 2)).toBe(29);
  });
});

describe('parseISODate', () => {
  it('parses without timezone drift', () => {
    expect(parseISODate('2024-03-10')).toEqual({ year: 2024, month: 3, day: 10 });
    expect(parseISODate('0005-01-01')).toEqual({ year: 5, month: 1, day: 1 });
  });

  it('rejects impossible or malformed dates', () => {
    for (const bad of ['2023-02-29', '2024-02-30', '2024-13-01', '2024-00-10', '2024-04-31', '2024-1-1', '24-01-01', '', 'abc', '0000-01-01']) {
      expect(parseISODate(bad)).toBeNull();
    }
    expect(parseISODate('2024-02-29')).not.toBeNull();
  });

  it('round-trips through formatISODate', () => {
    expect(formatISODate(d('2024-02-29'))).toBe('2024-02-29');
    expect(formatISODate({ year: 5, month: 1, day: 9 })).toBe('0005-01-09');
  });
});

describe('todayLocal', () => {
  it('uses local calendar fields, not UTC', () => {
    const late = new Date(2026, 8, 30, 23, 59, 59); // local 30 Sep, 23:59
    expect(todayLocal(late)).toEqual({ year: 2026, month: 9, day: 30 });
    const early = new Date(2026, 0, 1, 0, 0, 1);
    expect(todayLocal(early)).toEqual({ year: 2026, month: 1, day: 1 });
  });
});

describe('day numbers and weekdays', () => {
  it('counts from the Unix epoch', () => {
    expect(toDayNumber(d('1970-01-01'))).toBe(0);
    expect(toDayNumber(d('1970-01-02'))).toBe(1);
    expect(toDayNumber(d('1969-12-31'))).toBe(-1);
  });

  it('round-trips, including years below 100', () => {
    for (const iso of ['0001-01-01', '0099-12-31', '1600-02-29', '2024-02-29', '9999-12-31']) {
      expect(formatISODate(fromDayNumber(toDayNumber(d(iso))))).toBe(iso);
    }
  });

  it('names weekdays correctly', () => {
    expect(weekdayName(d('1970-01-01'))).toBe('Thursday');
    expect(weekdayName(d('2000-01-01'))).toBe('Saturday');
    expect(weekdayName(d('2024-02-29'))).toBe('Thursday');
    expect(weekdayName(d('2026-09-30'))).toBe('Wednesday');
    expect(weekdayName(d('1969-07-20'))).toBe('Sunday');
    expect(formatLongDate(d('2026-09-30'))).toBe('Wednesday, 30 September 2026');
  });
});

describe('addMonths / addToDate', () => {
  it('clamps month-end dates', () => {
    expect(addMonths(d('2023-01-31'), 1)).toEqual(d('2023-02-28'));
    expect(addMonths(d('2024-01-31'), 1)).toEqual(d('2024-02-29'));
    expect(addMonths(d('2024-03-31'), 1)).toEqual(d('2024-04-30'));
    expect(addMonths(d('2024-03-31'), -1)).toEqual(d('2024-02-29'));
    expect(addMonths(d('2024-05-31'), -3)).toEqual(d('2024-02-29'));
  });

  it('crosses year boundaries both ways', () => {
    expect(addMonths(d('2024-11-15'), 3)).toEqual(d('2025-02-15'));
    expect(addMonths(d('2024-02-15'), -3)).toEqual(d('2023-11-15'));
    expect(addMonths(d('2024-01-15'), -13)).toEqual(d('2022-12-15'));
  });

  it('handles Feb 29 plus/minus years', () => {
    expect(addToDate(d('2024-02-29'), 1, 'years')).toEqual(d('2025-02-28'));
    expect(addToDate(d('2024-02-29'), 4, 'years')).toEqual(d('2028-02-29'));
    expect(addToDate(d('2024-02-29'), -1, 'years')).toEqual(d('2023-02-28'));
  });

  it('adds and subtracts days and weeks across leap days', () => {
    expect(addToDate(d('2024-02-28'), 1, 'days')).toEqual(d('2024-02-29'));
    expect(addToDate(d('2023-02-28'), 1, 'days')).toEqual(d('2023-03-01'));
    expect(addToDate(d('2024-03-01'), -1, 'days')).toEqual(d('2024-02-29'));
    expect(addToDate(d('2024-12-25'), 2, 'weeks')).toEqual(d('2025-01-08'));
    expect(addToDate(d('2024-01-01'), 366, 'days')).toEqual(d('2025-01-01'));
    expect(addToDate(d('2024-06-15'), 0, 'months')).toEqual(d('2024-06-15'));
  });

  it('rejects fractional amounts and out-of-range results', () => {
    expect(addToDate(d('2024-01-01'), 1.5, 'days')).toBeNull();
    expect(addToDate(d('9999-12-31'), 1, 'days')).toBeNull();
    expect(addToDate(d('0001-01-01'), -1, 'months')).toBeNull();
  });
});

describe('dateDifference', () => {
  it('computes simple differences', () => {
    const diff = dateDifference(d('2020-01-15'), d('2024-03-20'));
    expect([diff.years, diff.months, diff.days]).toEqual([4, 2, 5]);
    expect(diff.totalMonths).toBe(50);
    expect(diff.isNegative).toBe(false);
  });

  it('is zero for the same day', () => {
    const diff = dateDifference(d('2024-05-05'), d('2024-05-05'));
    expect([diff.years, diff.months, diff.days, diff.totalDays, diff.totalHours]).toEqual([0, 0, 0, 0, 0]);
  });

  it('counts totals across leap years', () => {
    expect(dateDifference(d('2024-01-01'), d('2025-01-01')).totalDays).toBe(366);
    expect(dateDifference(d('2023-01-01'), d('2024-01-01')).totalDays).toBe(365);
    const diff = dateDifference(d('2024-01-01'), d('2024-03-01'));
    expect(diff.totalDays).toBe(60);
    expect(diff.totalWeeks).toBe(8);
    expect(diff.remainderDays).toBe(4);
    expect(diff.totalHours).toBe(1440);
  });

  it('borrows correctly at month ends', () => {
    const a = dateDifference(d('2023-01-31'), d('2023-03-01'));
    expect([a.years, a.months, a.days]).toEqual([0, 1, 1]);
    const b = dateDifference(d('2023-01-31'), d('2023-02-28'));
    expect([b.years, b.months, b.days]).toEqual([0, 1, 0]);
    const c = dateDifference(d('2023-01-31'), d('2023-02-27'));
    expect([c.years, c.months, c.days]).toEqual([0, 0, 27]);
    const e = dateDifference(d('2024-03-31'), d('2024-04-30'));
    expect([e.years, e.months, e.days]).toEqual([0, 1, 0]);
  });

  it('reports reversed ranges as negative with positive magnitudes', () => {
    const diff = dateDifference(d('2024-03-20'), d('2020-01-15'));
    expect(diff.isNegative).toBe(true);
    expect([diff.years, diff.months, diff.days]).toEqual([4, 2, 5]);
  });

  it('always round-trips through addToDate', () => {
    const pairs = [
      ['2023-01-31', '2023-03-01'],
      ['2020-02-29', '2023-02-28'],
      ['2020-02-29', '2024-03-01'],
      ['1999-12-31', '2000-02-29'],
      ['2024-08-31', '2024-09-30'],
      ['1985-07-04', '2026-09-30'],
    ];
    for (const [from, to] of pairs) {
      const diff = dateDifference(d(from), d(to));
      const viaMonths = addToDate(d(from), diff.totalMonths, 'months')!;
      expect(formatISODate(addToDate(viaMonths, diff.days, 'days')!)).toBe(to);
    }
  });
});

describe('calculateAge', () => {
  it('computes exact age and totals', () => {
    const age = calculateAge(d('1990-05-15'), d('2026-09-30'))!;
    expect([age.years, age.months, age.days]).toEqual([36, 4, 15]);
    expect(age.weekdayBorn).toBe('Tuesday');
    expect(age.totalDays).toBe(toDayNumber(d('2026-09-30')) - toDayNumber(d('1990-05-15')));
    expect(age.totalHours).toBe(age.totalDays * 24);
    expect(age.nextBirthday).toEqual(d('2027-05-15'));
    expect(age.nextBirthdayAge).toBe(37);
    expect(age.daysUntilNextBirthday).toBe(227);
    expect(age.isBirthdayToday).toBe(false);
  });

  it('detects a birthday today', () => {
    const age = calculateAge(d('2000-09-30'), d('2026-09-30'))!;
    expect([age.years, age.months, age.days]).toEqual([26, 0, 0]);
    expect(age.isBirthdayToday).toBe(true);
    expect(age.daysUntilNextBirthday).toBe(0);
    expect(age.nextBirthdayAge).toBe(26);
  });

  it('keeps the previous age on the day before a birthday', () => {
    const age = calculateAge(d('2000-10-01'), d('2026-09-30'))!;
    expect([age.years, age.months, age.days]).toEqual([25, 11, 29]);
    expect(age.daysUntilNextBirthday).toBe(1);
  });

  it('handles leap-day birthdays in common years (celebrated Feb 28)', () => {
    expect(birthdayInYear(d('2000-02-29'), 2023)).toEqual(d('2023-02-28'));
    expect(birthdayInYear(d('2000-02-29'), 2024)).toEqual(d('2024-02-29'));

    const before = calculateAge(d('2000-02-29'), d('2023-02-27'))!;
    expect(before.years).toBe(22);
    expect(before.daysUntilNextBirthday).toBe(1);

    const on = calculateAge(d('2000-02-29'), d('2023-02-28'))!;
    expect(on.years).toBe(23);
    expect(on.isBirthdayToday).toBe(true);

    const leap = calculateAge(d('2000-02-29'), d('2023-03-01'))!;
    expect(leap.nextBirthday).toEqual(d('2024-02-29'));
    expect(leap.daysUntilNextBirthday).toBe(365);
  });

  it('born today is 0 with the first birthday a year away', () => {
    const age = calculateAge(d('2026-09-30'), d('2026-09-30'))!;
    expect([age.years, age.months, age.days, age.totalDays]).toEqual([0, 0, 0, 0]);
    expect(age.nextBirthday).toEqual(d('2027-09-30'));
    expect(age.nextBirthdayAge).toBe(1);
    expect(age.isBirthdayToday).toBe(false);
  });

  it('returns null for a birth date in the future', () => {
    expect(calculateAge(d('2030-01-01'), d('2026-09-30'))).toBeNull();
  });
});

describe('pluralize', () => {
  it('formats counts', () => {
    expect(pluralize(1, 'day')).toBe('1 day');
    expect(pluralize(0, 'day')).toBe('0 days');
    expect(pluralize(12345, 'hour')).toBe('12,345 hours');
  });
});
