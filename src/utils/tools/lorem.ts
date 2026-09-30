/**
 * Lorem ipsum generation from a seeded PRNG, so the same seed always yields the same
 * text (testable) while a fresh seed per click gives variety.
 */

export type LoremUnit = 'paragraphs' | 'sentences' | 'words';
export type LoremFormat = 'text' | 'html';

export const LOREM_MIN_COUNT = 1;
export const LOREM_MAX_COUNT = 100;

export const LOREM_OPENING_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'] as const;
export const LOREM_OPENING_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

export const LOREM_WORD_BANK: readonly string[] = [
  'a', 'ac', 'accumsan', 'ad', 'adipiscing', 'aenean', 'aliquam', 'aliquet', 'amet', 'ante',
  'aptent', 'arcu', 'at', 'auctor', 'augue', 'bibendum', 'blandit', 'commodo', 'condimentum',
  'congue', 'consectetur', 'consequat', 'conubia', 'convallis', 'cras', 'cubilia', 'curabitur',
  'curae', 'cursus', 'dapibus', 'diam', 'dictum', 'dictumst', 'dignissim', 'dis', 'dolor',
  'donec', 'dui', 'duis', 'efficitur', 'egestas', 'eget', 'eleifend', 'elementum', 'elit',
  'enim', 'erat', 'eros', 'est', 'et', 'etiam', 'eu', 'euismod', 'ex', 'facilisi', 'facilisis',
  'fames', 'faucibus', 'felis', 'fermentum', 'feugiat', 'finibus', 'fringilla', 'fusce',
  'gravida', 'habitant', 'habitasse', 'hac', 'hendrerit', 'himenaeos', 'iaculis', 'id',
  'imperdiet', 'in', 'inceptos', 'integer', 'interdum', 'ipsum', 'justo', 'lacinia', 'lacus',
  'laoreet', 'lectus', 'leo', 'libero', 'ligula', 'litora', 'lobortis', 'luctus', 'maecenas',
  'magna', 'magnis', 'malesuada', 'massa', 'mattis', 'mauris', 'maximus', 'metus', 'mi',
  'molestie', 'mollis', 'montes', 'morbi', 'mus', 'nam', 'nascetur', 'natoque', 'nec', 'neque',
  'netus', 'nibh', 'nisi', 'nisl', 'non', 'nostra', 'nulla', 'nullam', 'nunc', 'odio', 'orci',
  'ornare', 'parturient', 'pellentesque', 'penatibus', 'per', 'pharetra', 'phasellus',
  'placerat', 'platea', 'porta', 'porttitor', 'posuere', 'potenti', 'praesent', 'pretium',
  'primis', 'proin', 'pulvinar', 'purus', 'quam', 'quis', 'quisque', 'rhoncus', 'ridiculus',
  'risus', 'rutrum', 'sagittis', 'sapien', 'scelerisque', 'sed', 'sem', 'semper', 'senectus',
  'sit', 'sociosqu', 'sodales', 'sollicitudin', 'suscipit', 'suspendisse', 'taciti', 'tellus',
  'tempor', 'tempus', 'tincidunt', 'torquent', 'tortor', 'tristique', 'turpis', 'ullamcorper',
  'ultrices', 'ultricies', 'urna', 'ut', 'varius', 'vehicula', 'vel', 'velit', 'venenatis',
  'vestibulum', 'vitae', 'vivamus', 'viverra', 'volutpat', 'vulputate',
];

/** Clamps a requested count to 1-100; non-numeric input becomes 1. */
export function clampCount(value: number): number {
  if (!Number.isFinite(value)) return LOREM_MIN_COUNT;
  return Math.min(LOREM_MAX_COUNT, Math.max(LOREM_MIN_COUNT, Math.round(value)));
}

export type Rng = () => number;

/** mulberry32: tiny, fast, good enough for placeholder text. Returns floats in [0, 1). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const randInt = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));

const capitalizeFirst = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Picks `count` words from the bank, never repeating the same word twice in a row. */
export function randomWords(rng: Rng, count: number): string[] {
  const words: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let word = LOREM_WORD_BANK[Math.floor(rng() * LOREM_WORD_BANK.length)];
    if (word === words[words.length - 1]) {
      word = LOREM_WORD_BANK[(LOREM_WORD_BANK.indexOf(word) + 1) % LOREM_WORD_BANK.length];
    }
    words.push(word);
  }
  return words;
}

/** One sentence of 6-14 words, with an occasional comma, capitalised and full-stopped. */
export function generateSentence(rng: Rng): string {
  const words = randomWords(rng, randInt(rng, 6, 14));
  if (words.length > 5 && rng() < 0.5) {
    const commaAt = randInt(rng, 2, words.length - 3);
    words[commaAt] = `${words[commaAt]},`;
  }
  return `${capitalizeFirst(words.join(' '))}.`;
}

export function generateSentences(rng: Rng, count: number, startWithLorem: boolean): string[] {
  const sentences: string[] = [];
  for (let i = 0; i < count; i += 1) {
    sentences.push(i === 0 && startWithLorem ? LOREM_OPENING_SENTENCE : generateSentence(rng));
  }
  return sentences;
}

/** One paragraph of 4-7 sentences. */
export function generateParagraph(rng: Rng, startWithLorem: boolean): string {
  return generateSentences(rng, randInt(rng, 4, 7), startWithLorem).join(' ');
}

export function generateWordList(rng: Rng, count: number, startWithLorem: boolean): string[] {
  const opening = startWithLorem ? LOREM_OPENING_WORDS.slice(0, count) : [];
  return [...opening, ...randomWords(rng, count - opening.length)];
}

export interface LoremOptions {
  unit: LoremUnit;
  count: number;
  startWithLorem: boolean;
  format: LoremFormat;
  seed: number;
}

/**
 * Produces the final text. HTML format wraps each paragraph (or the whole block for
 * sentences/words) in `<p>` tags as plain text - it is meant to be copied, never rendered.
 */
export function generateLorem({ unit, count, startWithLorem, format, seed }: LoremOptions): string {
  const rng = createRng(seed);
  const n = clampCount(count);

  let blocks: string[];
  if (unit === 'paragraphs') {
    blocks = Array.from({ length: n }, (_, i) => generateParagraph(rng, startWithLorem && i === 0));
  } else if (unit === 'sentences') {
    blocks = [generateSentences(rng, n, startWithLorem).join(' ')];
  } else {
    blocks = [`${capitalizeFirst(generateWordList(rng, n, startWithLorem).join(' '))}.`];
  }

  if (format === 'html') return blocks.map((b) => `<p>${b}</p>`).join('\n');
  return blocks.join('\n\n');
}

/** A fresh 32-bit seed for each "Generate" click. */
export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0xffffffff);
}
