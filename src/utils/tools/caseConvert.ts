/**
 * Text case conversions. Unicode-aware: letters are matched with `\p{…}` property
 * escapes and iterated by code point, so accented Latin, Greek, Cyrillic and astral
 * characters (emoji) survive intact.
 */

export type CaseId =
  | 'upper'
  | 'lower'
  | 'title'
  | 'sentence'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'
  | 'inverse';

/** Words kept lowercase in Title Case unless they are first, last or start a clause. */
export const TITLE_SMALL_WORDS: ReadonlySet<string> = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'en',
  'for',
  'from',
  'if',
  'in',
  'into',
  'nor',
  'of',
  'on',
  'onto',
  'or',
  'per',
  'so',
  'the',
  'than',
  'to',
  'up',
  'upon',
  'v',
  'vs',
  'via',
  'with',
  'yet',
]);

const isCased = (ch: string): boolean => ch.toLowerCase() !== ch.toUpperCase();
const isUpper = (ch: string): boolean => ch !== ch.toLowerCase();

/** Upper-cases the first code point and lower-cases the rest. */
export function capitalize(word: string): string {
  const chars = Array.from(word);
  if (chars.length === 0) return word;
  return chars[0].toUpperCase() + chars.slice(1).join('').toLowerCase();
}

export function toUpperCase(text: string): string {
  return text.toUpperCase();
}

export function toLowerCase(text: string): string {
  return text.toLowerCase();
}

// A "word" for Title Case: letters, marks and digits, with inner apostrophes (don't, it's).
const TITLE_WORD_RE = /[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu;

export function toTitleCase(text: string): string {
  const matches = Array.from(text.matchAll(TITLE_WORD_RE));
  if (matches.length === 0) return text;
  const lastIndex = matches.length - 1;

  let result = '';
  let cursor = 0;
  matches.forEach((match, i) => {
    const word = match[0];
    const start = match.index ?? 0;
    const end = start + word.length;
    const before = text.slice(cursor, start);
    const lower = word.toLowerCase();

    // Only the gap since the previous word matters, which keeps this linear.
    const startsClause = i !== 0 && /[:!?—–]/u.test(before);
    // First element of a compound ("In-Depth") is always capitalised; later elements
    // follow the normal rule ("State-of-the-Art").
    const opensCompound = text[end] === '-' && !before.endsWith('-');
    const keepSmall =
      i !== 0 && i !== lastIndex && !startsClause && !opensCompound && TITLE_SMALL_WORDS.has(lower);

    result += before + (keepSmall ? lower : capitalize(word));
    cursor = end;
  });
  return result + text.slice(cursor);
}

export function toSentenceCase(text: string): string {
  const lower = text.toLowerCase();
  let result = '';
  let capitalizeNext = true;
  for (const ch of lower) {
    if (capitalizeNext && /[\p{L}\p{N}]/u.test(ch)) {
      result += ch.toUpperCase();
      capitalizeNext = false;
      continue;
    }
    result += ch;
    if (/[.!?\n]/.test(ch)) capitalizeNext = true;
  }
  return result;
}

/**
 * Splits text into identifier words: on anything that is not a letter/digit, and on
 * camelCase humps ("XMLHttpRequest" -> XML, Http, Request). Apostrophes are dropped so
 * "don't" stays one word.
 */
export function splitWords(text: string): string[] {
  return text
    .replace(/['’]/g, '')
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu})(\p{Lu}\p{Ll})/gu, '$1 $2')
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean);
}

export function toCamelCase(text: string): string {
  return splitWords(text)
    .map((w, i) => (i === 0 ? w.toLowerCase() : capitalize(w)))
    .join('');
}

export function toPascalCase(text: string): string {
  return splitWords(text).map(capitalize).join('');
}

export function toSnakeCase(text: string): string {
  return splitWords(text)
    .map((w) => w.toLowerCase())
    .join('_');
}

export function toKebabCase(text: string): string {
  return splitWords(text)
    .map((w) => w.toLowerCase())
    .join('-');
}

export function toConstantCase(text: string): string {
  return splitWords(text)
    .map((w) => w.toUpperCase())
    .join('_');
}

/** aLtErNaTiNg: alternates across letters only, so spaces and digits don't break the rhythm. */
export function toAlternatingCase(text: string): string {
  let letterIndex = 0;
  let result = '';
  for (const ch of text) {
    if (isCased(ch)) {
      result += letterIndex % 2 === 0 ? ch.toLowerCase() : ch.toUpperCase();
      letterIndex += 1;
    } else {
      result += ch;
    }
  }
  return result;
}

/** iNVERSE: swaps the case of every letter. */
export function toInverseCase(text: string): string {
  let result = '';
  for (const ch of text) {
    if (!isCased(ch)) result += ch;
    else result += isUpper(ch) ? ch.toLowerCase() : ch.toUpperCase();
  }
  return result;
}

export interface CaseConversion {
  id: CaseId;
  label: string;
  example: string;
  convert: (text: string) => string;
}

export const CASE_CONVERSIONS: readonly CaseConversion[] = [
  { id: 'upper', label: 'UPPER CASE', example: 'HELLO WORLD', convert: toUpperCase },
  { id: 'lower', label: 'lower case', example: 'hello world', convert: toLowerCase },
  { id: 'title', label: 'Title Case', example: 'The Lord of the Rings', convert: toTitleCase },
  { id: 'sentence', label: 'Sentence case', example: 'Hello world. How are you?', convert: toSentenceCase },
  { id: 'camel', label: 'camelCase', example: 'helloWorld', convert: toCamelCase },
  { id: 'pascal', label: 'PascalCase', example: 'HelloWorld', convert: toPascalCase },
  { id: 'snake', label: 'snake_case', example: 'hello_world', convert: toSnakeCase },
  { id: 'kebab', label: 'kebab-case', example: 'hello-world', convert: toKebabCase },
  { id: 'constant', label: 'CONSTANT_CASE', example: 'HELLO_WORLD', convert: toConstantCase },
  { id: 'alternating', label: 'aLtErNaTiNg', example: 'hElLo wOrLd', convert: toAlternatingCase },
  { id: 'inverse', label: 'iNVERSE', example: 'hELLO wORLD', convert: toInverseCase },
];

/** Counts user-perceived characters (grapheme clusters) where the runtime supports it. */
export function countCharacters(text: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text)).length;
  }
  return Array.from(text).length;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}
