/**
 * Pure helpers for the Hash Generator tool, built on the Web Crypto API (`crypto.subtle`).
 * MD5 is intentionally absent: SubtleCrypto does not implement it.
 */

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGORITHMS: readonly HashAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

/** Hex digest length (characters) for each algorithm. */
export const HASH_HEX_LENGTH: Record<HashAlgorithm, number> = {
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-384': 96,
  'SHA-512': 128,
};

/** Largest file the tool will hash (100 MB). */
export const MAX_HASH_FILE_BYTES = 100 * 1024 * 1024;

export type HashResults = Record<HashAlgorithm, string>;

export function isSubtleCryptoAvailable(): boolean {
  return typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.subtle !== 'undefined';
}

function getSubtle(): SubtleCrypto {
  if (!isSubtleCryptoAvailable()) {
    throw new Error('Web Crypto is unavailable. Hashing needs a secure (HTTPS) page in a modern browser.');
  }
  return globalThis.crypto.subtle;
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

export function bufferToHex(buffer: ArrayBuffer | Uint8Array, uppercase = false): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += HEX[bytes[i]];
  return uppercase ? out.toUpperCase() : out;
}

export function textToBytes(text: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(text);
}

export async function digestHex(
  algorithm: HashAlgorithm,
  data: ArrayBuffer | Uint8Array<ArrayBuffer>
): Promise<string> {
  const digest = await getSubtle().digest(algorithm, data);
  return bufferToHex(digest);
}

export async function hashText(algorithm: HashAlgorithm, text: string): Promise<string> {
  return digestHex(algorithm, textToBytes(text));
}

/** Computes every supported digest of `data` in parallel. Hex output is lowercase. */
export async function hashAll(data: ArrayBuffer | Uint8Array<ArrayBuffer>): Promise<HashResults> {
  const digests = await Promise.all(HASH_ALGORITHMS.map((alg) => digestHex(alg, data)));
  return {
    'SHA-1': digests[0],
    'SHA-256': digests[1],
    'SHA-384': digests[2],
    'SHA-512': digests[3],
  };
}

/** HMAC-SHA256 of `message` with a UTF-8 `key`. Returns lowercase hex. */
export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const subtle = getSubtle();
  // A zero-length HMAC key is rejected by importKey, but HMAC defines it as a block of zeros.
  const keyBytes = key.length > 0 ? textToBytes(key) : new Uint8Array(64);
  const cryptoKey = await subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await subtle.sign('HMAC', cryptoKey, textToBytes(message));
  return bufferToHex(signature);
}

/** Lowercases and strips whitespace, a `0x` prefix and `:`/`-` separators from a pasted hash. */
export function normalizeHash(input: string): string {
  return input
    .trim()
    .replace(/^0x/i, '')
    .replace(/[\s:-]/g, '')
    .toLowerCase();
}

export function isHexString(input: string): boolean {
  return /^[0-9a-f]+$/i.test(input);
}

/** Guesses the algorithm of a hex digest from its length. */
export function guessAlgorithmFromLength(hex: string): HashAlgorithm | 'MD5' | null {
  const len = normalizeHash(hex).length;
  if (len === 32) return 'MD5';
  const found = HASH_ALGORITHMS.find((alg) => HASH_HEX_LENGTH[alg] === len);
  return found ?? null;
}

export type HashComparison =
  | { status: 'empty' }
  | { status: 'invalid'; message: string }
  | { status: 'match'; algorithm: HashAlgorithm }
  | { status: 'mismatch'; guessed: HashAlgorithm | 'MD5' | null };

/** Constant-time-ish string equality (avoids early exit; not security critical here). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Compares a pasted expected hash against computed results (case-insensitive). */
export function compareWithExpected(expected: string, results: Partial<HashResults>): HashComparison {
  const normalized = normalizeHash(expected);
  if (normalized === '') return { status: 'empty' };
  if (!isHexString(normalized)) {
    return { status: 'invalid', message: 'Expected hash must be hexadecimal (0-9, a-f)' };
  }
  for (const alg of HASH_ALGORITHMS) {
    const value = results[alg];
    if (value && safeEqual(value.toLowerCase(), normalized)) {
      return { status: 'match', algorithm: alg };
    }
  }
  return { status: 'mismatch', guessed: guessAlgorithmFromLength(normalized) };
}

/**
 * Reads a File into memory, reporting progress (0..1). Resolves with the ArrayBuffer.
 * The returned `abort` cancels the read and rejects with an AbortError.
 */
export function readFileWithProgress(
  file: Blob,
  onProgress: (fraction: number) => void
): { promise: Promise<ArrayBuffer>; abort: () => void } {
  const reader = new FileReader();
  const promise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    reader.onload = () => {
      onProgress(1);
      if (reader.result instanceof ArrayBuffer) resolve(reader.result);
      else reject(new Error('Could not read the file'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.onabort = () => reject(new DOMException('File read cancelled', 'AbortError'));
    reader.readAsArrayBuffer(file);
  });
  return {
    promise,
    abort: () => {
      if (reader.readyState === FileReader.LOADING) reader.abort();
    },
  };
}
