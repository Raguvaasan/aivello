import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  validateFile,
  getExtension,
  baseName,
  moveItem,
  hasPdfSignature,
  bytesToBlob,
  MB,
  type FileRule,
} from '../../utils/tools/fileUtils';

const pdfRule: FileRule = { mimeTypes: ['application/pdf'], extensions: ['pdf'], maxBytes: 25 * MB, label: 'PDF' };

describe('formatBytes', () => {
  it('formats sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(2.5 * MB)).toBe('2.50 MB');
    expect(formatBytes(25 * MB)).toBe('25.0 MB');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
  });
});

describe('validateFile', () => {
  it('accepts matching files', () => {
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 }, pdfRule)).toBeNull();
  });

  it('falls back to the extension when the browser gives no MIME type', () => {
    expect(validateFile({ name: 'scan.PDF', type: '', size: 1000 }, pdfRule)).toBeNull();
    expect(validateFile({ name: 'scan.txt', type: '', size: 1000 }, pdfRule)).toMatch(/not a supported PDF/);
  });

  it('rejects the wrong type even with a .pdf name', () => {
    expect(validateFile({ name: 'fake.pdf', type: 'image/png', size: 1000 }, pdfRule)).toMatch(/not a supported PDF/);
  });

  it('rejects empty and oversized files', () => {
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 0 }, pdfRule)).toMatch(/empty/);
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 25 * MB }, pdfRule)).toBeNull();
    expect(validateFile({ name: 'a.pdf', type: 'application/pdf', size: 25 * MB + 1 }, pdfRule)).toMatch(/limit is 25.0 MB/);
  });
});

describe('names', () => {
  it('extracts extensions', () => {
    expect(getExtension('photo.JPG')).toBe('jpg');
    expect(getExtension('archive.tar.gz')).toBe('gz');
    expect(getExtension('.hidden')).toBe('');
    expect(getExtension('noext')).toBe('');
  });

  it('builds safe base names', () => {
    expect(baseName('Holiday photo.final.JPG')).toBe('Holiday photo.final');
    expect(baseName('a<b>:c.pdf')).toBe('a_b_c');
    expect(baseName('.pdf')).toBe('.pdf');
    expect(baseName('   .png', 'image')).toBe('image');
  });
});

describe('moveItem', () => {
  it('moves elements without mutating the input', () => {
    const items = ['a', 'b', 'c', 'd'];
    expect(moveItem(items, 0, 1)).toEqual(['b', 'a', 'c', 'd']);
    expect(moveItem(items, 3, 2)).toEqual(['a', 'b', 'd', 'c']);
    expect(moveItem(items, 1, 3)).toEqual(['a', 'c', 'd', 'b']);
    expect(items).toEqual(['a', 'b', 'c', 'd']);
  });

  it('clamps targets and ignores invalid sources', () => {
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 1, 99)).toEqual(['a', 'b']);
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});

describe('hasPdfSignature', () => {
  const enc = (s: string) => new TextEncoder().encode(s);

  it('finds the header at the start or after leading junk', () => {
    expect(hasPdfSignature(enc('%PDF-1.7 ...'))).toBe(true);
    expect(hasPdfSignature(enc(`${' '.repeat(100)}%PDF-1.4`))).toBe(true);
  });

  it('rejects other content', () => {
    expect(hasPdfSignature(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x20]))).toBe(false);
    expect(hasPdfSignature(enc('%PDF'))).toBe(false);
    expect(hasPdfSignature(new Uint8Array())).toBe(false);
    expect(hasPdfSignature(enc(`${' '.repeat(1100)}%PDF-1.4`))).toBe(false);
  });
});

describe('bytesToBlob', () => {
  it('keeps exactly the viewed bytes', async () => {
    const whole = bytesToBlob(new Uint8Array([1, 2, 3]), 'application/pdf');
    expect(whole.size).toBe(3);
    expect(whole.type).toBe('application/pdf');

    const view = new Uint8Array(new Uint8Array([9, 1, 2, 3, 9]).buffer, 1, 3);
    const partial = bytesToBlob(view, 'application/pdf');
    expect(partial.size).toBe(3);
    expect(Array.from(new Uint8Array(await partial.arrayBuffer()))).toEqual([1, 2, 3]);
  });
});
