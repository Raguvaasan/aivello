/**
 * Text sanitising for jsPDF's built-in fonts (Helvetica, Times, Courier).
 *
 * Those fonts only cover the WinAnsi (Windows-1252) character set. If a string passed
 * to `doc.text()` contains even one character outside it (a rupee sign, a star, a
 * narrow no-break space from `Intl.NumberFormat`, any non-Latin script), jsPDF falls
 * back to a UTF-16 encoding the font cannot render and the WHOLE line comes out as
 * garbage. Sanitising per character keeps the rest of the line readable.
 *
 * Used by the Invoice Generator and the Resume Builder PDF exports.
 */

/** Characters in the 0x80-0x9F block of Windows-1252 that jsPDF maps correctly. */
const WIN_ANSI_EXTRA = new Set<number>([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039,
  0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122,
  0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]);

/** Unicode spaces (thin, narrow no-break, figure, ideographic...) that should become ' '. */
const SPACE_LIKE = /[\u2000-\u200A\u202F\u205F\u3000]/g;
/** Zero-width characters that carry no visible content. */
const ZERO_WIDTH = /[\u200B-\u200D\u2060\uFEFF]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;

const isWinAnsi = (code: number): boolean =>
  (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(code);

/** True when every character of `text` can be drawn by jsPDF's built-in fonts. */
export const isPdfSafeText = (text: string): boolean => {
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code !== 0x0a && !isWinAnsi(code)) return false;
  }
  return true;
};

/**
 * Returns `text` rewritten so jsPDF's built-in fonts can draw it:
 * - line endings normalised to `\n`, tabs and exotic spaces become plain spaces
 * - control and zero-width characters are dropped
 * - accented letters outside WinAnsi lose their accent (e.g. "ā" -> "a")
 * - anything else that cannot be drawn becomes "?"
 */
export const toPdfSafeText = (text: string): string => {
  const prepared = text
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, ' ')
    .replace(SPACE_LIKE, ' ')
    .replace(ZERO_WIDTH, '');

  let out = '';
  for (const ch of prepared) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 0x0a || isWinAnsi(code)) {
      out += ch;
      continue;
    }
    // Control characters (C0 / C1) carry nothing printable.
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) continue;

    const base = ch.normalize('NFKD').replace(COMBINING_MARKS, '');
    out += base && isPdfSafeText(base) ? base : '?';
  }
  return out;
};

/**
 * True when some of `text` would be lost by {@link toPdfSafeText} - used to warn the
 * user before exporting (for example a name written in Tamil or Devanagari).
 */
export const hasUnsupportedPdfChars = (text: string): boolean => {
  const prepared = text.replace(/[\r\t]/g, ' ').replace(SPACE_LIKE, ' ').replace(ZERO_WIDTH, '');
  for (const ch of prepared) {
    const code = ch.codePointAt(0) ?? 0;
    if (code === 0x0a || isWinAnsi(code)) continue;
    if (code < 0x20 || (code >= 0x7f && code < 0xa0)) continue;
    const base = ch.normalize('NFKD').replace(COMBINING_MARKS, '');
    if (!base || !isPdfSafeText(base)) return true;
  }
  return false;
};
