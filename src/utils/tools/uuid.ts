/**
 * Pure helpers for the UUID Generator tool (RFC 9562).
 */

export type UuidVersionOption = 'v4' | 'v7';

export interface UuidFormatOptions {
  uppercase: boolean;
  hyphens: boolean;
  braces: boolean;
}

export const DEFAULT_FORMAT: UuidFormatOptions = { uppercase: false, hyphens: true, braces: false };

export const MIN_BULK = 1;
export const MAX_BULK = 1000;

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export type RandomBytesFn = (length: number) => Uint8Array;

export const cryptoRandomBytes: RandomBytesFn = (length) => {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
};

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

/** Formats 16 bytes as the canonical lowercase 8-4-4-4-12 string. */
export function bytesToUuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) throw new Error('A UUID is exactly 16 bytes');
  let s = '';
  for (let i = 0; i < 16; i++) {
    s += HEX[bytes[i]];
    if (i === 3 || i === 5 || i === 7 || i === 9) s += '-';
  }
  return s;
}

/** Version 4 (random) UUID from `getRandomValues`, with the version and variant bits set. */
export function uuidV4FromRandom(random: RandomBytesFn = cryptoRandomBytes): string {
  const bytes = random(16).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(bytes);
}

/** Version 4 UUID, using `crypto.randomUUID()` where available. */
export function uuidV4(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return uuidV4FromRandom();
}

/**
 * Builds a version 7 UUID: 48-bit big-endian Unix milliseconds, version 0111, 12 bits `rand_a`,
 * variant 10, 62 random bits.
 */
export function buildUuidV7(unixMs: number, randA: number, random: RandomBytesFn = cryptoRandomBytes): string {
  if (!Number.isFinite(unixMs) || unixMs < 0 || unixMs > 0xffffffffffff) {
    throw new RangeError('UUIDv7 timestamp must fit in 48 bits');
  }
  const bytes = random(16).slice(0, 16);
  // Split into high 16 and low 32 bits: bitwise ops only work on 32-bit integers.
  const ms = Math.floor(unixMs);
  const high = Math.floor(ms / 0x100000000);
  const low = ms >>> 0;
  bytes[0] = (high >>> 8) & 0xff;
  bytes[1] = high & 0xff;
  bytes[2] = (low >>> 24) & 0xff;
  bytes[3] = (low >>> 16) & 0xff;
  bytes[4] = (low >>> 8) & 0xff;
  bytes[5] = low & 0xff;
  bytes[6] = 0x70 | ((randA >>> 8) & 0x0f); // version 7 + top 4 bits of rand_a
  bytes[7] = randA & 0xff;
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  return bytesToUuid(bytes);
}

/**
 * Returns a UUIDv7 generator that is strictly monotonic within one session (RFC 9562 §6.2,
 * method 1): `rand_a` is a 12-bit counter seeded randomly each millisecond, and if it
 * overflows - or the clock goes backwards - the timestamp is advanced by one millisecond.
 */
export function createUuidV7Generator(
  now: () => number = Date.now,
  random: RandomBytesFn = cryptoRandomBytes
): () => string {
  let lastMs = -1;
  let counter = 0;
  return () => {
    let ms = Math.floor(now());
    if (ms > lastMs) {
      const seed = random(2);
      counter = ((seed[0] << 8) | seed[1]) & 0x7ff; // leave headroom in the 12-bit counter
      lastMs = ms;
    } else {
      counter++;
      if (counter > 0xfff) {
        lastMs++;
        counter = 0;
      }
      ms = lastMs;
    }
    return buildUuidV7(ms, counter, random);
  };
}

const defaultV7 = createUuidV7Generator();

export function uuidV7(): string {
  return defaultV7();
}

export function formatUuid(uuid: string, options: UuidFormatOptions): string {
  let s = uuid.toLowerCase();
  if (!options.hyphens) s = s.replace(/-/g, '');
  if (options.uppercase) s = s.toUpperCase();
  if (options.braces) s = `{${s}}`;
  return s;
}

export function clampCount(count: number): number {
  if (!Number.isFinite(count)) return MIN_BULK;
  return Math.min(MAX_BULK, Math.max(MIN_BULK, Math.floor(count)));
}

export function generateUuids(
  count: number,
  version: UuidVersionOption,
  options: UuidFormatOptions = DEFAULT_FORMAT,
  v7Generator: () => string = uuidV7
): string[] {
  const n = clampCount(count);
  const out: string[] = new Array<string>(n);
  for (let i = 0; i < n; i++) {
    out[i] = formatUuid(version === 'v7' ? v7Generator() : uuidV4(), options);
  }
  return out;
}

export type UuidVariant = 'NCS (reserved)' | 'RFC 9562 / RFC 4122' | 'Microsoft (reserved)' | 'Future (reserved)';

export interface UuidInspection {
  valid: boolean;
  /** Canonical lowercase hyphenated form, when valid. */
  canonical: string | null;
  version: number | null;
  variant: UuidVariant | null;
  /** Human description, e.g. "Version 7 (Unix time-ordered)". */
  description: string;
  /** Embedded creation time for v1, v6 and v7 UUIDs. */
  timestamp: Date | null;
  error: string | null;
}

const VERSION_NAMES: Record<number, string> = {
  1: 'Version 1 (Gregorian time + node)',
  2: 'Version 2 (DCE Security)',
  3: 'Version 3 (MD5 name-based)',
  4: 'Version 4 (random)',
  5: 'Version 5 (SHA-1 name-based)',
  6: 'Version 6 (reordered Gregorian time)',
  7: 'Version 7 (Unix time-ordered)',
  8: 'Version 8 (custom / vendor-specific)',
};

/** 100-ns intervals between 1582-10-15 (Gregorian epoch) and 1970-01-01. */
const GREGORIAN_OFFSET_MS = 12219292800000;

function variantOf(nibble: number): UuidVariant {
  if ((nibble & 0x8) === 0) return 'NCS (reserved)';
  if ((nibble & 0xc) === 0x8) return 'RFC 9562 / RFC 4122';
  if ((nibble & 0xe) === 0xc) return 'Microsoft (reserved)';
  return 'Future (reserved)';
}

const invalid = (error: string): UuidInspection => ({
  valid: false,
  canonical: null,
  version: null,
  variant: null,
  description: '',
  timestamp: null,
  error,
});

/**
 * Validates a pasted UUID and reports its version, variant and embedded time. Accepts upper or
 * lower case, optional hyphens, `{braces}` and a `urn:uuid:` prefix.
 */
export function inspectUuid(input: string): UuidInspection {
  let s = input.trim();
  if (s === '') return invalid('Paste a UUID to validate it');
  s = s.replace(/^urn:uuid:/i, '');
  if (s.startsWith('{') && s.endsWith('}')) s = s.slice(1, -1);

  let hex: string;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    hex = s.replace(/-/g, '');
  } else if (/^[0-9a-f]{32}$/i.test(s)) {
    hex = s;
  } else {
    return invalid('Not a valid UUID: expected 32 hexadecimal digits, optionally as 8-4-4-4-12');
  }
  hex = hex.toLowerCase();
  const canonical = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

  if (canonical === NIL_UUID) {
    return { valid: true, canonical, version: 0, variant: null, description: 'Nil UUID (all zeros)', timestamp: null, error: null };
  }
  if (canonical === MAX_UUID) {
    return { valid: true, canonical, version: 15, variant: null, description: 'Max UUID (all ones)', timestamp: null, error: null };
  }

  const version = parseInt(hex.charAt(12), 16);
  const variant = variantOf(parseInt(hex.charAt(16), 16));
  const isRfc = variant === 'RFC 9562 / RFC 4122';
  const description = isRfc
    ? VERSION_NAMES[version] ?? `Unknown version ${version}`
    : `Non-standard variant (${variant})`;

  let timestamp: Date | null = null;
  if (isRfc) {
    if (version === 7) {
      timestamp = new Date(parseInt(hex.slice(0, 12), 16));
    } else if (version === 1 || version === 6) {
      // 60-bit count of 100 ns intervals since 1582-10-15.
      const timeHex =
        version === 1
          ? hex.slice(13, 16) + hex.slice(8, 12) + hex.slice(0, 8) // time_hi + time_mid + time_low
          : hex.slice(0, 12) + hex.slice(13, 16); // time_high + time_mid + time_low (v6)
      const ticks = parseInt(timeHex, 16);
      // 60-bit values exceed double precision slightly; round to the nearest millisecond.
      timestamp = new Date(Math.round(ticks / 10000 - GREGORIAN_OFFSET_MS));
    }
    if (timestamp && Number.isNaN(timestamp.getTime())) timestamp = null;
  }

  return { valid: true, canonical, version, variant, description, timestamp, error: null };
}
