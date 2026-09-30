/**
 * Helpers for the Language Translator, which uses the free MyMemory API
 * (https://mymemory.translated.net/doc/spec.php).
 *
 * MyMemory accepts at most 500 bytes of UTF-8 per request and gives anonymous users a
 * daily quota of roughly 5,000 characters, so text is split into sentence-aligned
 * chunks below the byte limit and the total input is capped.
 */

export interface Language {
  /** Code sent to MyMemory. */
  code: string;
  name: string;
  flag: string;
  /** BCP-47 tag for speech synthesis / recognition. */
  speech: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}', speech: 'en-US' },
  { code: 'es', name: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}', speech: 'es-ES' },
  { code: 'fr', name: 'French', flag: '\u{1F1EB}\u{1F1F7}', speech: 'fr-FR' },
  { code: 'de', name: 'German', flag: '\u{1F1E9}\u{1F1EA}', speech: 'de-DE' },
  { code: 'it', name: 'Italian', flag: '\u{1F1EE}\u{1F1F9}', speech: 'it-IT' },
  { code: 'pt', name: 'Portuguese', flag: '\u{1F1F5}\u{1F1F9}', speech: 'pt-PT' },
  { code: 'ru', name: 'Russian', flag: '\u{1F1F7}\u{1F1FA}', speech: 'ru-RU' },
  { code: 'ja', name: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}', speech: 'ja-JP' },
  { code: 'ko', name: 'Korean', flag: '\u{1F1F0}\u{1F1F7}', speech: 'ko-KR' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '\u{1F1E8}\u{1F1F3}', speech: 'zh-CN' },
  { code: 'ar', name: 'Arabic', flag: '\u{1F1F8}\u{1F1E6}', speech: 'ar-SA' },
  { code: 'hi', name: 'Hindi', flag: '\u{1F1EE}\u{1F1F3}', speech: 'hi-IN' },
  { code: 'ta', name: 'Tamil', flag: '\u{1F1EE}\u{1F1F3}', speech: 'ta-IN' },
  { code: 'te', name: 'Telugu', flag: '\u{1F1EE}\u{1F1F3}', speech: 'te-IN' },
  { code: 'th', name: 'Thai', flag: '\u{1F1F9}\u{1F1ED}', speech: 'th-TH' },
  { code: 'vi', name: 'Vietnamese', flag: '\u{1F1FB}\u{1F1F3}', speech: 'vi-VN' },
  { code: 'nl', name: 'Dutch', flag: '\u{1F1F3}\u{1F1F1}', speech: 'nl-NL' },
  { code: 'sv', name: 'Swedish', flag: '\u{1F1F8}\u{1F1EA}', speech: 'sv-SE' },
  { code: 'no', name: 'Norwegian', flag: '\u{1F1F3}\u{1F1F4}', speech: 'nb-NO' },
  { code: 'da', name: 'Danish', flag: '\u{1F1E9}\u{1F1F0}', speech: 'da-DK' },
];

export const getLanguage = (code: string): Language => LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];

/** MyMemory's hard per-request limit, in UTF-8 bytes. */
export const MYMEMORY_MAX_BYTES = 500;
/** Chunk size we aim for, leaving headroom below the hard limit. */
export const CHUNK_TARGET_BYTES = 450;
/** Total characters per translation; roughly the anonymous daily quota. */
export const MAX_TRANSLATE_CHARS = 5000;
/** Guards against pathological input (hundreds of one-word lines). */
export const MAX_CHUNKS = 40;

const encoder = new TextEncoder();
export const utf8Length = (s: string): number => encoder.encode(s).length;

/** Scripts written without spaces between words. */
export const joinerFor = (langCode: string): string => (/^(ja|zh|th)/.test(langCode) ? '' : ' ');

const packGreedy = (pieces: string[], maxBytes: number, joiner: string): string[] => {
  const out: string[] = [];
  let current = '';
  pieces.forEach((piece) => {
    const candidate = current ? `${current}${joiner}${piece}` : piece;
    if (utf8Length(candidate) <= maxBytes) {
      current = candidate;
    } else {
      if (current) out.push(current);
      current = piece;
    }
  });
  if (current) out.push(current);
  return out;
};

/** Splits a single over-long piece by words, then by characters as a last resort. */
const splitOversized = (piece: string, maxBytes: number): string[] => {
  if (utf8Length(piece) <= maxBytes) return [piece];
  const words = piece.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return packGreedy(words.flatMap((w) => splitOversized(w, maxBytes)), maxBytes, ' ');
  }
  return packGreedy(Array.from(piece), maxBytes, '');
};

export interface TranslationParagraph {
  chunks: string[];
  /** Whitespace that followed this paragraph in the source (newlines are preserved). */
  separator: string;
}

/**
 * Splits text into paragraphs (keeping the original line breaks) and each paragraph into
 * sentence-aligned chunks of at most `maxBytes` UTF-8 bytes.
 */
export const chunkForTranslation = (text: string, maxBytes = CHUNK_TARGET_BYTES): TranslationParagraph[] => {
  const parts = text.replace(/\r\n?/g, '\n').split(/(\n+)/);
  const paragraphs: TranslationParagraph[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const body = parts[i].trim();
    const separator = parts[i + 1] ?? '';
    if (!body) {
      if (paragraphs.length > 0) paragraphs[paragraphs.length - 1].separator += separator;
      continue;
    }
    const sentences = body.match(/[^.!?。！？]+(?:[.!?。！？]+|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [body];
    const pieces = sentences.flatMap((s) => splitOversized(s, maxBytes));
    paragraphs.push({ chunks: packGreedy(pieces, maxBytes, ' '), separator });
  }
  return paragraphs;
};

export const countChunks = (paragraphs: TranslationParagraph[]): number =>
  paragraphs.reduce((sum, p) => sum + p.chunks.length, 0);

export type TranslationErrorKind = 'quota' | 'language' | 'service' | 'network' | 'timeout';

export class TranslationError extends Error {
  readonly kind: TranslationErrorKind;
  constructor(kind: TranslationErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'TranslationError';
  }
}

interface MyMemoryResponse {
  responseData?: { translatedText?: string | null };
  responseStatus?: number | string;
  responseDetails?: string;
  quotaFinished?: boolean | null;
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0' };

/** MyMemory sometimes returns HTML entities (e.g. &#39;). Decoded without touching the DOM. */
export const decodeEntities = (s: string): string =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : all;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? all;
  });

/** Validates a MyMemory JSON response and returns the translated text, or throws TranslationError. */
export const parseMyMemoryResponse = (data: unknown): string => {
  const d = (data ?? {}) as MyMemoryResponse;
  const status = Number(d.responseStatus);
  const text = d.responseData?.translatedText ?? '';
  const details = String(d.responseDetails ?? '');
  const combined = `${text} ${details}`;

  if (d.quotaFinished || status === 429 || /MYMEMORY WARNING|USED ALL AVAILABLE FREE TRANSLATIONS/i.test(combined)) {
    const next = combined.match(/NEXT AVAILABLE IN\s+([0-9A-Z ]+?)(?:\.|VISIT|$)/i)?.[1]?.trim().toLowerCase();
    throw new TranslationError(
      'quota',
      `The free translation quota for today has been used up${next ? ` (resets in ${next})` : ''}. Please try again later.`
    );
  }
  if (status === 403 || /INVALID (SOURCE|TARGET) LANGUAGE|SELECT TWO DISTINCT LANGUAGES/i.test(combined)) {
    throw new TranslationError('language', 'This language pair isn’t supported by the translation service.');
  }
  if (status !== 200 || !text.trim()) {
    throw new TranslationError('service', `The translation service returned an error${details ? `: ${details}` : ''}. Please try again.`);
  }
  return decodeEntities(text);
};

export const buildMyMemoryUrl = (text: string, source: string, target: string): string =>
  `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(`${source}|${target}`)}`;

/** Best installed voice for a BCP-47 tag: exact match, then same base language. */
export const pickVoice = (voices: readonly SpeechSynthesisVoice[], bcp47: string): SpeechSynthesisVoice | null => {
  const norm = (lang: string) => lang.toLowerCase().replace('_', '-');
  const target = norm(bcp47);
  const base = target.split('-')[0];
  const bases = base === 'nb' || base === 'no' ? ['nb', 'no', 'nn'] : [base];
  const exact = voices.filter((v) => norm(v.lang) === target);
  const sameBase = voices.filter((v) => bases.includes(norm(v.lang).split('-')[0]));
  return exact.find((v) => v.localService) ?? exact[0] ?? sameBase.find((v) => v.localService) ?? sameBase[0] ?? null;
};
