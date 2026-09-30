import { describe, it, expect } from 'vitest';
import {
  Base64Error,
  base64ToBytes,
  bytesToBase64,
  decodeBase64Text,
  decodedByteLength,
  encodeBase64Text,
  extensionForMime,
  normalizeBase64Input,
  parseDataUrl,
  sniffMimeType,
  toDataUrl,
  toUrlSafe,
} from '../../utils/tools/base64';

describe('base64', () => {
  it('encodes ASCII like btoa', () => {
    expect(encodeBase64Text('hello')).toBe('aGVsbG8=');
    expect(encodeBase64Text('')).toBe('');
    expect(encodeBase64Text('Man')).toBe('TWFu');
  });

  it('round-trips unicode "héllo 👋" (UTF-8 safe)', () => {
    const encoded = encodeBase64Text('héllo 👋');
    expect(encoded).toBe('aMOpbGxvIPCfkYs=');
    expect(encoded).toBe(Buffer.from('héllo 👋', 'utf8').toString('base64'));
    expect(decodeBase64Text(encoded)).toBe('héllo 👋');
  });

  it('round-trips a variety of strings', () => {
    for (const s of ['a', 'ab', 'abc', 'abcd', '日本語テキスト', '🎉🎉🎉', 'line1\nline2\r\n\t', '\u0000ÿ']) {
      expect(decodeBase64Text(encodeBase64Text(s))).toBe(s);
      expect(decodeBase64Text(encodeBase64Text(s, true))).toBe(s);
    }
  });

  it('produces URL-safe output without padding', () => {
    // bytes fb ff fe -> "+//+" standard
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe]);
    expect(bytesToBase64(bytes)).toBe('+//+');
    expect(bytesToBase64(bytes, true)).toBe('-__-');
    expect(toUrlSafe('ab+/cd==')).toBe('ab-_cd');
    expect(encodeBase64Text('?>', true)).toBe('Pz4');
  });

  it('decodes URL-safe input and missing padding', () => {
    expect(Array.from(base64ToBytes('-__-'))).toEqual([0xfb, 0xff, 0xfe]);
    expect(decodeBase64Text('aGVsbG8')).toBe('hello');
    expect(decodeBase64Text('aGVsbA')).toBe('hell');
  });

  it('ignores whitespace and line breaks', () => {
    expect(decodeBase64Text(' aGVs\nbG8=\r\n ')).toBe('hello');
  });

  it('accepts a data URL', () => {
    expect(decodeBase64Text('data:text/plain;charset=utf-8;base64,aGVsbG8=')).toBe('hello');
  });

  it('rejects invalid characters', () => {
    expect(() => base64ToBytes('abc$')).toThrow(Base64Error);
    expect(() => base64ToBytes('abc$')).toThrow(/Invalid character "\$"/);
  });

  it('rejects bad padding and length', () => {
    expect(() => base64ToBytes('a')).toThrow(/Invalid length/);
    expect(() => base64ToBytes('ab=c')).toThrow(/Padding/);
    expect(() => base64ToBytes('abc==')).toThrow(/padding/i);
    expect(() => base64ToBytes('ab===')).toThrow(/padding/i);
  });

  it('rejects decoded bytes that are not UTF-8 text', () => {
    expect(() => decodeBase64Text(bytesToBase64(new Uint8Array([0xff, 0xfe, 0x00])))).toThrow(/not valid UTF-8/);
  });

  it('handles empty input', () => {
    expect(base64ToBytes('').length).toBe(0);
    expect(decodeBase64Text('   ')).toBe('');
  });

  it('encodes large binary input in chunks', () => {
    const bytes = new Uint8Array(300000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) % 256;
    const b64 = bytesToBase64(bytes);
    expect(b64).toBe(Buffer.from(bytes).toString('base64'));
    expect(Array.from(base64ToBytes(b64).subarray(0, 64))).toEqual(Array.from(bytes.subarray(0, 64)));
    expect(base64ToBytes(b64).length).toBe(bytes.length);
    expect(decodedByteLength(b64)).toBe(bytes.length);
  });

  it('parses and builds data URLs', () => {
    expect(parseDataUrl('data:image/png;base64,iVBORw0KGgo=')).toEqual({ mime: 'image/png', base64: 'iVBORw0KGgo=' });
    expect(parseDataUrl('data:;base64,AAAA')).toEqual({ mime: 'application/octet-stream', base64: 'AAAA' });
    expect(parseDataUrl('data:text/plain,hello')).toBeNull();
    expect(parseDataUrl('aGVsbG8=')).toBeNull();
    expect(toDataUrl('AAAA', 'image/gif')).toBe('data:image/gif;base64,AAAA');
    expect(toDataUrl('AAAA', '')).toBe('data:application/octet-stream;base64,AAAA');
    expect(normalizeBase64Input('data:image/png;base64,AA AA')).toBe('AAAA');
  });

  it('sniffs common file types', () => {
    expect(sniffMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('image/png');
    expect(sniffMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMimeType(new TextEncoder().encode('%PDF-1.7'))).toBe('application/pdf');
    expect(sniffMimeType(new TextEncoder().encode('GIF89a'))).toBe('image/gif');
    expect(sniffMimeType(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('application/x-unknown')).toBe('bin');
  });
});
