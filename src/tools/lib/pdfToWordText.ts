/**
 * Pure helpers for the PDF to Word converter: file checks, pdf.js text assembly and
 * clean-up. No pdf.js import here - the library is loaded lazily by the component.
 */

/** Largest PDF the converter accepts. Everything runs in the browser, so this is a memory guard. */
export const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB

/** Browsers report PDFs inconsistently (empty type on some Windows/Android setups). */
export const isPdfCandidate = (file: { name: string; type: string }): boolean =>
  file.type === 'application/pdf' ||
  file.type === 'application/x-pdf' ||
  ((file.type === '' || file.type === 'application/octet-stream') && /\.pdf$/i.test(file.name));

/**
 * Checks for the `%PDF-` signature. The spec allows junk before it, and real-world
 * files do have some, so look within the first 1KB like most readers do.
 */
export const hasPdfSignature = (bytes: Uint8Array): boolean => {
  const limit = Math.min(bytes.length - 5, 1024);
  for (let i = 0; i <= limit; i += 1) {
    if (
      bytes[i] === 0x25 && // %
      bytes[i + 1] === 0x50 && // P
      bytes[i + 2] === 0x44 && // D
      bytes[i + 3] === 0x46 && // F
      bytes[i + 4] === 0x2d // -
    ) {
      return true;
    }
  }
  return false;
};

/** Structural subset of pdf.js' `TextItem` (the rest of the union is marked content). */
interface TextItemLike {
  str: string;
  hasEOL?: boolean;
}

const isTextItem = (item: unknown): item is TextItemLike =>
  typeof item === 'object' && item !== null && typeof (item as { str?: unknown }).str === 'string';

/**
 * Characters that are illegal in XML 1.0. A single one in the text makes the
 * generated .docx unreadable ("Word found unreadable content"), and PDFs with
 * broken font maps produce them regularly.
 */
// eslint-disable-next-line no-control-regex
const INVALID_XML_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uFFFE\uFFFF]/g;
const LONE_SURROGATES = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

export const stripInvalidXmlChars = (text: string): string =>
  text.replace(INVALID_XML_CHARS, '').replace(LONE_SURROGATES, '');

/**
 * Normalises extracted text: tidies whitespace inside each line, drops trailing blank
 * lines, and keeps at most one empty line between blocks.
 */
export const normalizeExtractedText = (text: string): string =>
  stripInvalidXmlChars(text)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t\u00A0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Joins pdf.js text items into page text. Items are concatenated as-is and `hasEOL`
 * marks a line break - the same way pdf.js' own find controller rebuilds text
 * (pdf.js already emits whitespace items where a visual gap exists, so joining with
 * an extra space would split words that were kerned into several items).
 */
export const textItemsToPageText = (items: readonly unknown[]): string => {
  let text = '';
  for (const item of items) {
    if (!isTextItem(item)) continue;
    text += item.str;
    if (item.hasEOL) text += '\n';
  }
  return normalizeExtractedText(text);
};

export const countWords = (text: string): number => (text.match(/\S+/g) ?? []).length;

/** File name without the `.pdf` extension, safe to reuse for the download. */
export const outputBaseName = (fileName: string): string => {
  const base = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim();
  return base || 'document';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export type PdfErrorKind = 'password' | 'invalid' | 'unknown';

/** Maps pdf.js exceptions (identified by name - the classes are not all exported) to a kind. */
export const classifyPdfError = (error: unknown): PdfErrorKind => {
  const name = typeof error === 'object' && error !== null ? String((error as { name?: unknown }).name ?? '') : '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (name === 'PasswordException' || /password/i.test(message)) return 'password';
  if (name === 'InvalidPDFException' || /invalid pdf|corrupt|bad xref|no pdf header/i.test(message)) {
    return 'invalid';
  }
  return 'unknown';
};
