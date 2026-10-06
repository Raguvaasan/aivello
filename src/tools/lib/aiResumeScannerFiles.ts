/**
 * Reads resume text from PDF, DOCX and TXT files entirely in the browser.
 *
 * - PDF: pdfjs-dist, loaded on demand so the ~1 MB library is only fetched when a PDF is
 *   actually uploaded. The worker is served from our own origin.
 * - DOCX: a DOCX is a ZIP archive; we locate word/document.xml through the ZIP central
 *   directory and inflate it with the native DecompressionStream, so no ZIP library is
 *   needed. Legacy binary .doc files cannot be read client-side.
 */

export const MAX_RESUME_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 15;
const MAX_XML_BYTES = 20 * 1024 * 1024;

export type ResumeFileKind = 'pdf' | 'docx' | 'txt';

const MIME_BY_KIND: Record<ResumeFileKind, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  txt: ['text/plain', 'text/markdown'],
};

export const ACCEPTED_RESUME_TYPES = '.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';

export class ResumeFileError extends Error {}

/** Returns the file kind, or throws a user-facing ResumeFileError. */
export const detectResumeFileKind = (file: File): ResumeFileKind => {
  const ext = file.name.toLowerCase().split('.').pop() ?? '';
  if (ext === 'doc' || file.type === 'application/msword') {
    throw new ResumeFileError('Legacy .doc files can’t be read in the browser. Save it as PDF or DOCX, or paste the text below.');
  }
  const kind = (Object.keys(MIME_BY_KIND) as ResumeFileKind[]).find(
    (k) => ext === k || (ext === 'md' && k === 'txt') || MIME_BY_KIND[k].includes(file.type)
  );
  if (!kind) throw new ResumeFileError('Unsupported file type. Please upload a PDF, DOCX or TXT file.');
  if (file.size === 0) throw new ResumeFileError('This file is empty.');
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new ResumeFileError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. The maximum is 10 MB.`);
  }
  return kind;
};

export const cleanExtractedText = (text: string): string =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  width?: number;
  height?: number;
}

const extractPdfText = async (file: File): Promise<{ text: string; truncated: boolean }> => {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const data = new Uint8Array(await file.arrayBuffer());
  // pdf.js >= 5.7 has no eval-based font path, so the old isEvalSupported: false guard is gone.
  const task = pdfjs.getDocument({ data });
  let pdf: Awaited<typeof task.promise>;
  try {
    pdf = await task.promise;
  } catch (err) {
    const name = typeof err === 'object' && err !== null && 'name' in err ? String((err as { name: unknown }).name) : '';
    if (name === 'PasswordException') {
      throw new ResumeFileError('This PDF is password-protected. Remove the password or paste the text instead.');
    }
    throw new ResumeFileError('This PDF could not be read. It may be damaged. Try exporting it again or paste the text.');
  }
  try {
    const pages = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const out: string[] = [];
    for (let p = 1; p <= pages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      let line = '';
      let lastY: number | null = null;
      let lastEnd: number | null = null;
      for (const raw of content.items) {
        if (!('str' in raw)) continue;
        const item = raw as PdfTextItem;
        const x = item.transform?.[4] ?? 0;
        const y = item.transform?.[5] ?? 0;
        const h = item.height || 10;
        if (lastY !== null && Math.abs(y - lastY) > h * 0.5) {
          out.push(line);
          line = '';
          lastEnd = null;
        } else if (lastEnd !== null && x - lastEnd > h * 0.15 && !line.endsWith(' ') && !item.str.startsWith(' ')) {
          line += ' ';
        }
        line += item.str;
        lastY = y;
        lastEnd = x + (item.width ?? 0);
        if (item.hasEOL) {
          out.push(line);
          line = '';
          lastEnd = null;
          lastY = null;
        }
      }
      if (line) out.push(line);
      out.push('');
      page.cleanup();
    }
    return { text: out.join('\n'), truncated: pdf.numPages > MAX_PDF_PAGES };
  } finally {
    // pdf.js 6 removed PDFDocumentProxy.destroy(); the loading task owns teardown now.
    task.destroy().catch(() => undefined);
  }
};

const inflateRaw = async (data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> => {
  if (typeof DecompressionStream === 'undefined') {
    throw new ResumeFileError('Your browser can’t open DOCX files. Update it, upload a PDF, or paste the text.');
  }
  const source = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(data);
      controller.close();
    },
  });
  const stream = source.pipeThrough(new DecompressionStream('deflate-raw'));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_XML_BYTES) {
      await reader.cancel();
      throw new ResumeFileError('This DOCX is too large to read.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((c) => {
    out.set(c, offset);
    offset += c.length;
  });
  return out;
};

const NOT_DOCX = 'This file doesn’t look like a valid DOCX document.';

/** Finds and inflates one entry of a ZIP archive. */
const readZipEntry = async (buffer: ArrayBuffer, entryName: string): Promise<Uint8Array<ArrayBuffer>> => {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 0xffff); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ResumeFileError(NOT_DOCX);
  const entries = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  for (let n = 0; n < entries; n++) {
    if (ptr + 46 > bytes.length || view.getUint32(ptr, true) !== 0x02014b50) throw new ResumeFileError(NOT_DOCX);
    const method = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLength = view.getUint16(ptr + 28, true);
    const extraLength = view.getUint16(ptr + 30, true);
    const commentLength = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLength));
    if (name === entryName) {
      if (localOffset + 30 > bytes.length || view.getUint32(localOffset, true) !== 0x04034b50) {
        throw new ResumeFileError(NOT_DOCX);
      }
      const start = localOffset + 30 + view.getUint16(localOffset + 26, true) + view.getUint16(localOffset + 28, true);
      const compressed = bytes.subarray(start, start + compressedSize);
      if (method === 0) return compressed.slice();
      if (method === 8) return inflateRaw(compressed.slice());
      throw new ResumeFileError(NOT_DOCX);
    }
    ptr += 46 + nameLength + extraLength + commentLength;
  }
  throw new ResumeFileError(NOT_DOCX);
};

const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

export const docxXmlToText = (xml: string): string => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) throw new ResumeFileError(NOT_DOCX);
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, 'p'));
  return paragraphs
    .map((p) =>
      Array.from(p.getElementsByTagNameNS(W_NS, '*'))
        .map((el) => {
          if (el.localName === 't') return el.textContent ?? '';
          if (el.localName === 'tab') return '\t';
          if (el.localName === 'br' || el.localName === 'cr') return '\n';
          return '';
        })
        .join('')
    )
    .join('\n');
};

const extractDocxText = async (file: File): Promise<string> => {
  const xmlBytes = await readZipEntry(await file.arrayBuffer(), 'word/document.xml');
  return docxXmlToText(new TextDecoder().decode(xmlBytes));
};

export interface ExtractedResume {
  text: string;
  kind: ResumeFileKind;
  /** True when only the first pages of a long PDF were read. */
  truncated: boolean;
}

export const extractResumeText = async (file: File): Promise<ExtractedResume> => {
  const kind = detectResumeFileKind(file);
  let text = '';
  let truncated = false;
  if (kind === 'pdf') {
    const result = await extractPdfText(file);
    text = result.text;
    truncated = result.truncated;
  } else if (kind === 'docx') {
    text = await extractDocxText(file);
  } else {
    text = await file.text();
  }
  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    throw new ResumeFileError(
      kind === 'pdf'
        ? 'No selectable text found. This looks like a scanned/image PDF, which an ATS can’t read either. Paste the text or export a text-based PDF.'
        : 'No text found in this file.'
    );
  }
  return { text: cleaned, kind, truncated };
};
