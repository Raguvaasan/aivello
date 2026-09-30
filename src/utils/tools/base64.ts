/**
 * Pure helpers for the Base64 Encoder / Decoder tool. UTF-8 safe: text is converted to bytes with
 * TextEncoder before encoding (raw `btoa` throws on anything outside Latin-1).
 */

/** Largest file the tool will encode (10 MB). */
export const MAX_BASE64_FILE_BYTES = 10 * 1024 * 1024;

export class Base64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Base64Error';
  }
}

const CHUNK = 0x8000;

/** Encodes raw bytes as Base64. `urlSafe` uses the RFC 4648 §5 alphabet (-, _) without padding. */
export function bytesToBase64(bytes: Uint8Array, urlSafe = false): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, Math.min(i + CHUNK, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  const b64 = btoa(binary);
  return urlSafe ? toUrlSafe(b64) : b64;
}

export function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Removes whitespace and a leading `data:*;base64,` prefix, if present. */
export function normalizeBase64Input(input: string): string {
  let s = input.trim();
  const dataUrl = parseDataUrl(s);
  if (dataUrl) s = dataUrl.base64;
  return s.replace(/\s+/g, '');
}

/**
 * Decodes standard or URL-safe Base64 (padding optional, whitespace ignored) into bytes.
 * Throws `Base64Error` with a helpful message on malformed input.
 */
export function base64ToBytes(input: string): Uint8Array<ArrayBuffer> {
  const cleaned = normalizeBase64Input(input);
  if (cleaned === '') return new Uint8Array(0);

  const standard = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const badChar = /[^A-Za-z0-9+/=]/.exec(standard);
  if (badChar) {
    throw new Base64Error(`Invalid character "${cleaned.charAt(badChar.index)}" at position ${badChar.index + 1}`);
  }
  const firstPad = standard.indexOf('=');
  if (firstPad !== -1 && /[^=]/.test(standard.slice(firstPad))) {
    throw new Base64Error('Padding "=" can only appear at the end');
  }
  const body = firstPad === -1 ? standard : standard.slice(0, firstPad);
  const padCount = standard.length - body.length;
  if (padCount > 2) {
    throw new Base64Error('Too much "=" padding');
  }
  if (body.length % 4 === 1) {
    throw new Base64Error('Invalid length: Base64 data is truncated or has an extra character');
  }
  if (padCount > 0 && (body.length + padCount) % 4 !== 0) {
    throw new Base64Error('Incorrect "=" padding');
  }

  const padded = body + '='.repeat((4 - (body.length % 4)) % 4);
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Base64Error('Not valid Base64');
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64Text(text: string, urlSafe = false): string {
  return bytesToBase64(new TextEncoder().encode(text), urlSafe);
}

/**
 * Decodes Base64 to a UTF-8 string. Throws `Base64Error` when the input is not Base64 or when
 * the decoded bytes are not valid UTF-8 (e.g. it is a binary file - use file mode instead).
 */
export function decodeBase64Text(b64: string): string {
  const bytes = base64ToBytes(b64);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Base64Error('Decoded data is not valid UTF-8 text (it may be a binary file - try File mode)');
  }
}

export interface DataUrlParts {
  mime: string;
  base64: string;
}

/** Parses `data:<mime>[;params];base64,<data>`. Returns null for anything else. */
export function parseDataUrl(input: string): DataUrlParts | null {
  const match = /^data:([^,]*?);base64,(.*)$/is.exec(input.trim());
  if (!match) return null;
  const mime = match[1].split(';')[0].trim() || 'application/octet-stream';
  return { mime, base64: match[2] };
}

export function toDataUrl(base64: string, mime: string): string {
  return `data:${mime || 'application/octet-stream'};base64,${base64}`;
}

/** Number of bytes a Base64 string decodes to (without decoding). */
export function decodedByteLength(b64: string): number {
  const s = normalizeBase64Input(b64).replace(/=+$/, '');
  return Math.floor((s.length * 3) / 4);
}

/** Best-effort file type detection from magic bytes. */
export function sniffMimeType(bytes: Uint8Array): string | null {
  const starts = (sig: number[], offset = 0): boolean =>
    bytes.length >= offset + sig.length && sig.every((b, i) => bytes[offset + i] === b);

  if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (starts([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (starts([0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
  if (starts([0x25, 0x50, 0x44, 0x46])) return 'application/pdf';
  if (starts([0x50, 0x4b, 0x03, 0x04])) return 'application/zip';
  if (starts([0x1f, 0x8b])) return 'application/gzip';
  if (starts([0x49, 0x44, 0x33]) || starts([0xff, 0xfb])) return 'audio/mpeg';
  if (starts([0x66, 0x74, 0x79, 0x70], 4)) return 'video/mp4';
  if (starts([0x3c, 0x73, 0x76, 0x67]) || starts([0x3c, 0x3f, 0x78, 0x6d, 0x6c])) return 'image/svg+xml';
  return null;
}

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/gzip': 'gz',
  'application/json': 'json',
  'audio/mpeg': 'mp3',
  'video/mp4': 'mp4',
  'text/plain': 'txt',
  'text/html': 'html',
  'text/css': 'css',
  'text/csv': 'csv',
};

export function extensionForMime(mime: string): string {
  return EXTENSIONS[mime.toLowerCase()] ?? 'bin';
}
