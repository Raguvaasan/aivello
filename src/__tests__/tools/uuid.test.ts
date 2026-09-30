import { describe, it, expect } from 'vitest';
import {
  MAX_BULK,
  NIL_UUID,
  buildUuidV7,
  bytesToUuid,
  clampCount,
  createUuidV7Generator,
  formatUuid,
  generateUuids,
  inspectUuid,
  uuidV4,
  uuidV4FromRandom,
  uuidV7,
} from '../../utils/tools/uuid';

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const versionNibble = (u: string): string => u.charAt(14);
const variantNibble = (u: string): number => parseInt(u.charAt(19), 16);
const isRfcVariant = (u: string): boolean => (variantNibble(u) & 0xc) === 0x8; // 10xx

describe('uuid', () => {
  describe('v4', () => {
    it('generates canonical v4 UUIDs', () => {
      for (let i = 0; i < 200; i++) {
        const u = uuidV4();
        expect(u).toMatch(CANONICAL);
        expect(versionNibble(u)).toBe('4');
        expect(isRfcVariant(u)).toBe(true);
      }
    });

    it('sets version and variant bits in the getRandomValues fallback', () => {
      const allOnes = (n: number): Uint8Array => new Uint8Array(n).fill(0xff);
      const allZeros = (n: number): Uint8Array => new Uint8Array(n);
      expect(uuidV4FromRandom(allOnes)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
      expect(uuidV4FromRandom(allZeros)).toBe('00000000-0000-4000-8000-000000000000');
      const u = uuidV4FromRandom();
      expect(versionNibble(u)).toBe('4');
      expect(isRfcVariant(u)).toBe(true);
    });

    it('is unique across many draws', () => {
      const set = new Set(generateUuids(1000, 'v4'));
      expect(set.size).toBe(1000);
    });
  });

  describe('v7', () => {
    it('has version 7 and variant 10xx', () => {
      for (let i = 0; i < 200; i++) {
        const u = uuidV7();
        expect(u).toMatch(CANONICAL);
        expect(versionNibble(u)).toBe('7');
        expect(isRfcVariant(u)).toBe(true);
      }
    });

    it('encodes the 48-bit unix millisecond timestamp big-endian', () => {
      const ms = 0x0189_1234_5678; // arbitrary 48-bit value
      const u = buildUuidV7(ms, 0xabc, (n) => new Uint8Array(n));
      expect(u).toBe('01891234-5678-7abc-8000-000000000000');
      expect(parseInt(u.replace(/-/g, '').slice(0, 12), 16)).toBe(ms);
    });

    it('matches the RFC 9562 example timestamp layout', () => {
      // RFC 9562 appendix A.6: 2022-02-22T19:22:22Z -> 017F22E279B0
      const ms = Date.UTC(2022, 1, 22, 19, 22, 22);
      const u = buildUuidV7(ms, 0xcc3, (n) => new Uint8Array(n).fill(0x18));
      expect(u.slice(0, 13).toUpperCase()).toBe('017F22E2-79B0');
      expect(u.charAt(14)).toBe('7');
    });

    it('rejects timestamps outside 48 bits', () => {
      expect(() => buildUuidV7(-1, 0)).toThrow(RangeError);
      expect(() => buildUuidV7(2 ** 48, 0)).toThrow(RangeError);
    });

    it('embeds a timestamp close to now', () => {
      const before = Date.now();
      const u = uuidV7();
      const after = Date.now();
      const ts = inspectUuid(u).timestamp?.getTime() ?? 0;
      expect(ts).toBeGreaterThanOrEqual(before);
      expect(ts).toBeLessThanOrEqual(after + 1);
    });

    it('is strictly monotonic within one generator, even in the same millisecond', () => {
      const gen = createUuidV7Generator(() => 1700000000000);
      const list = Array.from({ length: 5000 }, () => gen());
      const sorted = [...list].sort();
      expect(sorted).toEqual(list);
      expect(new Set(list).size).toBe(list.length);
      // Counter overflow borrows from the next millisecond rather than going backwards.
      const lastTs = inspectUuid(list[list.length - 1]).timestamp?.getTime() ?? 0;
      expect(lastTs).toBeGreaterThanOrEqual(1700000000000);
    });

    it('stays monotonic if the clock goes backwards', () => {
      const times = [1000, 2000, 1500, 1500, 3000];
      let i = 0;
      const gen = createUuidV7Generator(() => times[Math.min(i++, times.length - 1)]);
      const list = times.map(() => gen());
      expect([...list].sort()).toEqual(list);
    });

    it('bulk v7 output is sorted in generation order', () => {
      const list = generateUuids(1000, 'v7');
      expect([...list].sort()).toEqual(list);
    });
  });

  describe('formatting', () => {
    const u = '0189a1b2-c3d4-7e5f-8a6b-7c8d9e0f1a2b';
    it('applies uppercase / no hyphens / braces', () => {
      expect(formatUuid(u, { uppercase: true, hyphens: true, braces: false })).toBe(u.toUpperCase());
      expect(formatUuid(u, { uppercase: false, hyphens: false, braces: false })).toBe(u.replace(/-/g, ''));
      expect(formatUuid(u, { uppercase: false, hyphens: true, braces: true })).toBe(`{${u}}`);
      expect(formatUuid(u, { uppercase: true, hyphens: false, braces: true })).toBe(`{${u.replace(/-/g, '').toUpperCase()}}`);
    });

    it('clamps bulk counts to 1..1000', () => {
      expect(clampCount(0)).toBe(1);
      expect(clampCount(-5)).toBe(1);
      expect(clampCount(5000)).toBe(MAX_BULK);
      expect(clampCount(12.7)).toBe(12);
      expect(clampCount(Number.NaN)).toBe(1);
      expect(generateUuids(5000, 'v4')).toHaveLength(1000);
      expect(generateUuids(3, 'v7', { uppercase: true, hyphens: false, braces: true })[0]).toMatch(/^\{[0-9A-F]{32}\}$/);
    });

    it('converts bytes to canonical form', () => {
      expect(bytesToUuid(new Uint8Array(16))).toBe(NIL_UUID);
      expect(() => bytesToUuid(new Uint8Array(15))).toThrow();
    });
  });

  describe('inspectUuid', () => {
    it('detects v4 and v7', () => {
      expect(inspectUuid(uuidV4())).toMatchObject({ valid: true, version: 4, variant: 'RFC 9562 / RFC 4122' });
      expect(inspectUuid(uuidV7())).toMatchObject({ valid: true, version: 7 });
    });

    it('accepts uppercase, braces, no hyphens and urn prefix', () => {
      const u = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'; // RFC 9562 v7 example
      const expected = { valid: true, canonical: u, version: 7 };
      expect(inspectUuid(u.toUpperCase())).toMatchObject(expected);
      expect(inspectUuid(`{${u}}`)).toMatchObject(expected);
      expect(inspectUuid(u.replace(/-/g, ''))).toMatchObject(expected);
      expect(inspectUuid(`urn:uuid:${u}`)).toMatchObject(expected);
      expect(inspectUuid(u).timestamp?.toISOString()).toBe('2022-02-22T19:22:22.000Z');
    });

    it('decodes v1 and v6 timestamps (RFC 9562 examples)', () => {
      // Both examples encode 2022-02-22 19:22:22 UTC (Gregorian 100 ns ticks).
      const v1 = inspectUuid('C232AB00-9414-11EC-B3C8-9F6BDECED846');
      expect(v1.version).toBe(1);
      expect(v1.timestamp?.toISOString()).toBe('2022-02-22T19:22:22.000Z');
      const v6 = inspectUuid('1EC9414C-232A-6B00-B3C8-9F6BDECED846');
      expect(v6.version).toBe(6);
      expect(v6.timestamp?.toISOString()).toBe('2022-02-22T19:22:22.000Z');
    });

    it('detects other versions and nil/max', () => {
      expect(inspectUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8').version).toBe(1);
      expect(inspectUuid('a3bb189e-8bf9-3888-9912-ace4e6543002').version).toBe(3);
      expect(inspectUuid('74738ff5-5367-5958-9aee-98fffdcd1876').version).toBe(5);
      expect(inspectUuid('320c3d4d-cc00-875b-8ec9-32d5f69181c0').version).toBe(8);
      expect(inspectUuid(NIL_UUID)).toMatchObject({ valid: true, description: 'Nil UUID (all zeros)' });
      expect(inspectUuid('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toMatchObject({ valid: true, description: 'Max UUID (all ones)' });
    });

    it('reports non-RFC variants', () => {
      const r = inspectUuid('00000000-0000-4000-c000-000000000001');
      expect(r.valid).toBe(true);
      expect(r.variant).toBe('Microsoft (reserved)');
      expect(r.description).toMatch(/Non-standard variant/);
    });

    it('rejects malformed input', () => {
      expect(inspectUuid('').valid).toBe(false);
      expect(inspectUuid('not-a-uuid').valid).toBe(false);
      expect(inspectUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398').valid).toBe(false);
      expect(inspectUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398g').valid).toBe(false);
      expect(inspectUuid('017f22e279b0-7cc3-98c4-dc0c0c07398f').valid).toBe(false);
    });
  });
});
