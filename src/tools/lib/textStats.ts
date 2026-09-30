/**
 * Text statistics shared by the Word Counter and Read Time tools.
 *
 * A "word" is a run of letters or digits, optionally joined by an apostrophe or hyphen
 * (don't, well-known). Punctuation-only tokens such as "—" or "..." are not words,
 * which a naive split on whitespace would count.
 */

const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export const getWords = (text: string): string[] => text.match(WORD_PATTERN) ?? [];

export const countWords = (text: string): number => getWords(text).length;

/** User-perceived characters (an emoji counts as one), not UTF-16 code units. */
export const countCharacters = (text: string): number => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    let count = 0;
    // Iterating the segments avoids materialising an array for very long text.
    const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text);
    for (const segment of segments) if (segment.segment) count++;
    return count;
  }
  return Array.from(text).length;
};

export const countCharactersNoSpaces = (text: string): number => countCharacters(text.replace(/\s/g, ''));

const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Sentences end at . ! ? or … followed by whitespace or the end of the text, so
 * "3.14" and "example.com" do not split. A trailing fragment without a terminator
 * still counts as a sentence.
 */
export const countSentences = (text: string): number =>
  text.split(/[.!?…]+(?=\s|$)/u).filter((s) => HAS_WORD_CHAR.test(s)).length;

/** Paragraphs are separated by one or more blank lines (LF or CRLF). */
export const countParagraphs = (text: string): number =>
  text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0).length;

export const countLines = (text: string): number => (text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length);

/** Common English function words, excluded from keyword density. */
const STOP_WORDS = new Set(
  (
    'a about above after again against all am an and any are as at be because been before being below between both ' +
    'but by can could did do does doing down during each few for from further had has have having he her here hers ' +
    'herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on ' +
    'once only or other our ours ourselves out over own same she should so some such than that the their theirs them ' +
    'themselves then there these they this those through to too under until up very was we were what when where which ' +
    'while who whom why will with would you your yours yourself yourselves also may might must shall us i\'m it\'s ' +
    'don\'t can\'t won\'t isn\'t aren\'t wasn\'t weren\'t didn\'t doesn\'t hasn\'t haven\'t let\'s that\'s there\'s'
  ).split(' ')
);

export interface KeywordCount {
  word: string;
  count: number;
  /** Share of all words in the text, 0-100. */
  density: number;
}

/** Most frequent non-stop-words of at least `minLength` letters. Ties break alphabetically. */
export const topKeywords = (text: string, limit = 10, minLength = 3): KeywordCount[] => {
  const words = getWords(text);
  if (words.length === 0) return [];

  const counts = new Map<string, number>();
  for (const raw of words) {
    const word = raw.toLowerCase().replace(/’/g, "'");
    if (word.length < minLength || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  return Array.from(counts, ([word, count]) => ({ word, count, density: (count / words.length) * 100 }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
};

/** Average adult silent reading speed for non-fiction (Brysbaert, 2019). */
export const DEFAULT_READING_WPM = 238;
/** Typical presentation / narration speaking pace. */
export const DEFAULT_SPEAKING_WPM = 140;

/** Duration in seconds to get through `words` at `wpm` words per minute. */
export const durationSeconds = (words: number, wpm: number): number =>
  wpm > 0 && words > 0 ? Math.max(1, Math.round((words / wpm) * 60)) : 0;

/** "0 sec", "45 sec", "3 min", "3 min 20 sec", "1 hr 5 min". */
export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '0 sec';
  if (totalSeconds < 60) return `${totalSeconds} sec`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  return seconds > 0 ? `${minutes} min ${seconds} sec` : `${minutes} min`;
};

/**
 * Splits text into utterance-sized chunks at sentence boundaries (falling back to
 * word boundaries for very long sentences).
 *
 * Chrome silently stops speaking a single long utterance after ~15 seconds with some
 * voices, and rejects utterances over 32,767 characters; queueing short chunks avoids both.
 */
export const splitForSpeech = (text: string, maxLength = 200): string[] => {
  const sentences = text.match(/[^.!?…\n]+(?:[.!?…]+|\n+|$)/gu) ?? [];
  const chunks: string[] = [];
  let current = '';

  const push = (piece: string) => {
    const trimmed = piece.trim();
    if (trimmed) chunks.push(trimmed);
  };

  for (const sentence of sentences) {
    if (sentence.trim().length > maxLength) {
      push(current);
      current = '';
      // Break an over-long sentence at spaces.
      let part = '';
      for (const word of sentence.split(/\s+/)) {
        if (part && part.length + word.length + 1 > maxLength) {
          push(part);
          part = '';
        }
        part = part ? `${part} ${word}` : word;
        while (part.length > maxLength) {
          push(part.slice(0, maxLength));
          part = part.slice(maxLength);
        }
      }
      push(part);
    } else if (current.length + sentence.length > maxLength) {
      push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }
  push(current);
  return chunks;
};
