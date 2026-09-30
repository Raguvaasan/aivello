import { describe, it, expect } from 'vitest';
import {
  MAX_PDF_SIZE,
  classifyPdfError,
  countWords,
  hasPdfSignature,
  isPdfCandidate,
  normalizeExtractedText,
  outputBaseName,
  stripInvalidXmlChars,
  textItemsToPageText,
} from '../../tools/lib/pdfToWordText';

const bytes = (text: string) => new TextEncoder().encode(text);

describe('file checks', () => {
  it('accepts PDFs by MIME type, or by extension when the type is missing', () => {
    expect(isPdfCandidate({ name: 'a.pdf', type: 'application/pdf' })).toBe(true);
    expect(isPdfCandidate({ name: 'A.PDF', type: '' })).toBe(true);
    expect(isPdfCandidate({ name: 'a.docx', type: '' })).toBe(false);
    expect(isPdfCandidate({ name: 'a.pdf', type: 'image/png' })).toBe(false);
  });

  it('looks for the %PDF- signature near the start of the file', () => {
    expect(hasPdfSignature(bytes('%PDF-1.7\n...'))).toBe(true);
    expect(hasPdfSignature(bytes('junk\n%PDF-1.4'))).toBe(true);
    expect(hasPdfSignature(bytes('<html>'))).toBe(false);
    expect(hasPdfSignature(new Uint8Array(0))).toBe(false);
  });

  it('caps uploads at 20MB', () => {
    expect(MAX_PDF_SIZE).toBe(20 * 1024 * 1024);
  });
});

describe('text assembly', () => {
  it('joins items and breaks lines on hasEOL, skipping marked content', () => {
    const items = [
      { str: 'Hello', hasEOL: false },
      { str: ' ', hasEOL: false },
      { str: 'world', hasEOL: true },
      { type: 'beginMarkedContent', id: 'x' },
      { str: '  Second   line ', hasEOL: true },
    ];
    expect(textItemsToPageText(items)).toBe('Hello world\nSecond line');
  });

  it('collapses runs of blank lines and trims', () => {
    expect(normalizeExtractedText('\n\na\n\n\n\nb\n\n')).toBe('a\n\nb');
  });

  it('removes characters that would corrupt the .docx XML', () => {
    const bad = `a${String.fromCharCode(0)}b${String.fromCharCode(0x0b)}c${String.fromCharCode(0xd800)}d`;
    expect(stripInvalidXmlChars(bad)).toBe('abcd');
    const emoji = String.fromCodePoint(0x1f600);
    expect(stripInvalidXmlChars(emoji)).toBe(emoji);
  });

  it('counts words', () => {
    expect(countWords('  one two\nthree ')).toBe(3);
    expect(countWords('')).toBe(0);
  });
});

describe('helpers', () => {
  it('derives a safe output name', () => {
    expect(outputBaseName('Report.final.PDF')).toBe('Report.final');
    expect(outputBaseName('a:b?.pdf')).toBe('a_b_');
    expect(outputBaseName('.pdf')).toBe('document');
  });

  it('classifies pdf.js errors', () => {
    expect(classifyPdfError({ name: 'PasswordException', message: 'No password given' })).toBe('password');
    expect(classifyPdfError({ name: 'InvalidPDFException', message: 'Invalid PDF structure.' })).toBe('invalid');
    expect(classifyPdfError(new Error('boom'))).toBe('unknown');
  });
});
