import { describe, it, expect } from 'vitest';
import {
  describeTimestamp,
  detectTimestampUnit,
  epochToZonedInputValue,
  formatOffset,
  formatRelative,
  getRelativeParts,
  getSupportedTimeZones,
  getTimeZoneOffsetMinutes,
  isValidTimeZone,
  parseTimestamp,
  toAllUnits,
  toIsoInTimeZone,
  toRfc2822,
  zonedDateTimeToEpoch,
} from '../../utils/tools/timestamp';

const MS = 1700000000000; // 2023-11-14T22:13:20.000Z

describe('timestamp', () => {
  describe('unit detection', () => {
    it('tells seconds from milliseconds by magnitude', () => {
      expect(detectTimestampUnit(1700000000)).toBe('seconds');
      expect(detectTimestampUnit(MS)).toBe('milliseconds');
      expect(detectTimestampUnit(0)).toBe('seconds');
      expect(detectTimestampUnit(-1700000000)).toBe('seconds');
      expect(detectTimestampUnit(-MS)).toBe('milliseconds');
      expect(detectTimestampUnit(99999999999)).toBe('seconds'); // year 5138
      expect(detectTimestampUnit(1e11)).toBe('milliseconds');
      expect(detectTimestampUnit(1700000000000000)).toBe('microseconds');
      expect(detectTimestampUnit(1700000000000000000)).toBe('nanoseconds');
    });

    it('parses seconds and milliseconds to the same instant', () => {
      const s = parseTimestamp('1700000000');
      const ms = parseTimestamp('1700000000000');
      expect(s).toEqual({ ok: true, ms: MS, unit: 'seconds', detected: true });
      expect(ms).toEqual({ ok: true, ms: MS, unit: 'milliseconds', detected: true });
    });

    it('parses micro/nanoseconds, fractions and separators', () => {
      expect(parseTimestamp('1700000000000000')).toMatchObject({ ok: true, ms: MS, unit: 'microseconds' });
      expect(parseTimestamp('1700000000000000000')).toMatchObject({ ok: true, ms: MS, unit: 'nanoseconds' });
      expect(parseTimestamp('1700000000.5')).toMatchObject({ ok: true, ms: MS + 500 });
      expect(parseTimestamp(' 1,700,000,000 ')).toMatchObject({ ok: true, ms: MS });
      expect(parseTimestamp('1_700_000_000')).toMatchObject({ ok: true, ms: MS });
      expect(parseTimestamp('-86400')).toMatchObject({ ok: true, ms: -86400000 });
    });

    it('honours an explicit unit', () => {
      expect(parseTimestamp('1700000000', 'milliseconds')).toEqual({
        ok: true,
        ms: 1700000000,
        unit: 'milliseconds',
        detected: false,
      });
      expect(parseTimestamp('9000000000000', 'seconds').ok).toBe(false); // 9e15 ms: out of Date range
      expect(parseTimestamp('1700000000000', 'seconds')).toMatchObject({ ok: true, ms: 1.7e15 });
    });

    it('rejects garbage', () => {
      expect(parseTimestamp('').ok).toBe(false);
      expect(parseTimestamp('abc').ok).toBe(false);
      expect(parseTimestamp('12:30').ok).toBe(false);
      expect(parseTimestamp('1e400').ok).toBe(false);
    });

    it('lists the value in all units', () => {
      expect(toAllUnits(MS + 123)).toEqual({
        seconds: '1700000000',
        milliseconds: '1700000000123',
        microseconds: '1700000000123000',
        nanoseconds: '1700000000123000000',
      });
      expect(toAllUnits(0)).toEqual({ seconds: '0', milliseconds: '0', microseconds: '0', nanoseconds: '0' });
      expect(toAllUnits(-1500).seconds).toBe('-2');
    });
  });

  describe('formatting', () => {
    it('formats ISO 8601 in UTC and other zones', () => {
      expect(toIsoInTimeZone(MS, 'UTC')).toBe('2023-11-14T22:13:20.000Z');
      expect(toIsoInTimeZone(MS + 45, 'Asia/Kolkata')).toBe('2023-11-15T03:43:20.045+05:30');
      expect(toIsoInTimeZone(MS, 'America/New_York')).toBe('2023-11-14T17:13:20.000-05:00');
      expect(toIsoInTimeZone(-1, 'UTC')).toBe('1969-12-31T23:59:59.999Z');
    });

    it('formats RFC 2822', () => {
      expect(toRfc2822(MS)).toBe('Tue, 14 Nov 2023 22:13:20 +0000');
      expect(toRfc2822(MS, 'Asia/Kolkata')).toBe('Wed, 15 Nov 2023 03:43:20 +0530');
      expect(toRfc2822(MS, 'America/Los_Angeles')).toBe('Tue, 14 Nov 2023 14:13:20 -0800');
    });

    it('computes zone offsets including DST', () => {
      expect(getTimeZoneOffsetMinutes(MS, 'UTC')).toBe(0);
      expect(getTimeZoneOffsetMinutes(MS, 'Asia/Kolkata')).toBe(330);
      expect(getTimeZoneOffsetMinutes(Date.UTC(2024, 0, 15), 'America/New_York')).toBe(-300);
      expect(getTimeZoneOffsetMinutes(Date.UTC(2024, 6, 15), 'America/New_York')).toBe(-240);
      expect(getTimeZoneOffsetMinutes(Date.UTC(2024, 6, 15), 'Asia/Kathmandu')).toBe(345);
      expect(formatOffset(-570)).toBe('-09:30');
      expect(formatOffset(345, '')).toBe('+0545');
    });

    it('describes a timestamp', () => {
      const d = describeTimestamp(MS, 'UTC', MS + 3 * 86400000, 'en-US');
      expect(d.iso).toBe('2023-11-14T22:13:20.000Z');
      expect(d.rfc2822Utc).toBe('Tue, 14 Nov 2023 22:13:20 +0000');
      expect(d.relative).toBe('3 days ago');
      expect(d.offset).toBe('UTC+00:00');
      expect(d.human).toMatch(/Tuesday, November 14, 2023/);
    });
  });

  describe('relative time', () => {
    it('chooses sensible units', () => {
      expect(formatRelative(MS - 3 * 86400000, MS, 'en')).toBe('3 days ago');
      expect(formatRelative(MS + 2 * 3600000, MS, 'en')).toBe('in 2 hours');
      expect(formatRelative(MS, MS, 'en')).toBe('now');
      expect(formatRelative(MS - 86400000, MS, 'en')).toBe('yesterday');
      expect(formatRelative(MS - 45000, MS, 'en')).toBe('45 seconds ago');
      expect(formatRelative(MS - 14 * 86400000, MS, 'en')).toBe('2 weeks ago');
      expect(formatRelative(MS - 3 * 365 * 86400000, MS, 'en')).toBe('3 years ago');
      expect(getRelativeParts(MS + 90 * 60000, MS)).toEqual({ value: 2, unit: 'hour' });
    });
  });

  describe('date-time picker conversion', () => {
    it('round-trips wall-clock time in a zone', () => {
      expect(zonedDateTimeToEpoch('2023-11-14T22:13:20', 'UTC')).toBe(MS);
      expect(zonedDateTimeToEpoch('2023-11-15T03:43:20', 'Asia/Kolkata')).toBe(MS);
      expect(zonedDateTimeToEpoch('2023-11-14T17:13', 'America/New_York')).toBe(MS - 20000);
      expect(zonedDateTimeToEpoch('2023-11-14T22:13:20.5', 'UTC')).toBe(MS + 500);
      expect(epochToZonedInputValue(MS, 'Asia/Kolkata')).toBe('2023-11-15T03:43:20');
      expect(epochToZonedInputValue(MS, 'UTC')).toBe('2023-11-14T22:13:20');
    });

    it('handles DST transitions', () => {
      // Spring forward: 02:30 does not exist in New York on 2024-03-10 -> shifted to 03:30 EDT.
      expect(new Date(zonedDateTimeToEpoch('2024-03-10T02:30', 'America/New_York') ?? 0).toISOString()).toBe(
        '2024-03-10T07:30:00.000Z'
      );
      // Fall back: 01:30 happens twice -> the earlier (EDT) instant.
      expect(new Date(zonedDateTimeToEpoch('2024-11-03T01:30', 'America/New_York') ?? 0).toISOString()).toBe(
        '2024-11-03T05:30:00.000Z'
      );
      expect(new Date(zonedDateTimeToEpoch('2024-10-27T02:30', 'Europe/Berlin') ?? 0).toISOString()).toBe(
        '2024-10-27T00:30:00.000Z'
      );
    });

    it('rejects malformed or impossible values', () => {
      expect(zonedDateTimeToEpoch('', 'UTC')).toBeNull();
      expect(zonedDateTimeToEpoch('2024-13-01T00:00', 'UTC')).toBeNull();
      expect(zonedDateTimeToEpoch('2023-02-29T00:00', 'UTC')).toBeNull();
      expect(zonedDateTimeToEpoch('2024-02-29T00:00', 'UTC')).toBe(Date.UTC(2024, 1, 29));
      expect(zonedDateTimeToEpoch('2024-01-01 00:00', 'UTC')).toBeNull();
    });
  });

  describe('time zones', () => {
    it('lists supported zones with UTC first', () => {
      const zones = getSupportedTimeZones();
      expect(zones[0]).toBe('UTC');
      expect(zones.length).toBeGreaterThan(10);
      expect(zones).toContain('Asia/Tokyo');
      expect(new Set(zones).size).toBe(zones.length);
    });

    it('validates zone names', () => {
      expect(isValidTimeZone('Europe/Paris')).toBe(true);
      expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    });
  });
});
