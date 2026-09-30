import { describe, it, expect } from 'vitest';
import { hasUnsupportedPdfChars, isPdfSafeText, toPdfSafeText } from '../../tools/lib/pdfSafeText';

const ch = (code: number) => String.fromCharCode(code);

describe('toPdfSafeText', () => {
  it('keeps Latin-1 and the WinAnsi extras (euro, curly quotes, bullet, dashes)', () => {
    const text = `Caf${ch(0xe9)} ${ch(0x20ac)}5 ${ch(0x201c)}ok${ch(0x201d)} ${ch(0x2022)} ${ch(0x2014)}`;
    expect(toPdfSafeText(text)).toBe(text);
    expect(isPdfSafeText(text)).toBe(true);
  });

  it('turns exotic spaces into plain spaces and drops zero-width and control characters', () => {
    const text = `1${ch(0x202f)}000${ch(0x200b)}${ch(0x07)}\r\nx\ty`;
    expect(toPdfSafeText(text)).toBe('1 000\nx y');
  });

  it('strips accents that WinAnsi cannot draw and replaces the rest with "?"', () => {
    expect(toPdfSafeText(`${ch(0x101)}b`)).toBe('ab'); // a with macron
    expect(toPdfSafeText(`${ch(0x20b9)}10`)).toBe('?10'); // rupee sign
    expect(toPdfSafeText(ch(0x2605))).toBe('?'); // star
  });
});

describe('hasUnsupportedPdfChars', () => {
  it('flags scripts the built-in fonts cannot render', () => {
    expect(hasUnsupportedPdfChars('Hello')).toBe(false);
    expect(hasUnsupportedPdfChars(`Na${ch(0xef)}ve ${ch(0x202f)}`)).toBe(false);
    expect(hasUnsupportedPdfChars(`${ch(0xba4)}${ch(0xbae)}`)).toBe(true); // Tamil letters
  });
});
