import { describe, it, expect } from 'vitest';
import {
  clampCount,
  createRng,
  randomWords,
  generateSentence,
  generateLorem,
  generateWordList,
  randomSeed,
  LOREM_WORD_BANK,
  LOREM_OPENING_SENTENCE,
  type LoremOptions,
} from '../../utils/tools/lorem';

const base: LoremOptions = { unit: 'paragraphs', count: 3, startWithLorem: true, format: 'text', seed: 42 };

const wordsOf = (text: string) => text.replace(/<\/?p>/g, ' ').trim().split(/\s+/).filter(Boolean);

describe('clampCount', () => {
  it('clamps to 1-100 and rounds', () => {
    expect(clampCount(0)).toBe(1);
    expect(clampCount(-5)).toBe(1);
    expect(clampCount(1)).toBe(1);
    expect(clampCount(100)).toBe(100);
    expect(clampCount(101)).toBe(100);
    expect(clampCount(1e9)).toBe(100);
    expect(clampCount(2.6)).toBe(3);
    expect(clampCount(Number.NaN)).toBe(1);
    expect(clampCount(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe('createRng', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = createRng(123);
    const b = createRng(123);
    const c = createRng(124);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    const seqC = Array.from({ length: 50 }, () => c());
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    for (const n of seqA) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });
});

describe('randomWords', () => {
  it('draws from the bank without immediate repeats', () => {
    const words = randomWords(createRng(7), 2000);
    expect(words).toHaveLength(2000);
    for (let i = 0; i < words.length; i += 1) {
      expect(LOREM_WORD_BANK).toContain(words[i]);
      if (i > 0) expect(words[i]).not.toBe(words[i - 1]);
    }
    expect(new Set(words).size).toBeGreaterThan(100);
  });
});

describe('generateSentence', () => {
  it('is capitalised, full-stopped and 6-14 words long', () => {
    const rng = createRng(99);
    for (let i = 0; i < 200; i += 1) {
      const sentence = generateSentence(rng);
      expect(sentence).toMatch(/^[A-Z][a-z]*[ ,a-z]*\.$/);
      const n = sentence.split(' ').length;
      expect(n).toBeGreaterThanOrEqual(6);
      expect(n).toBeLessThanOrEqual(14);
    }
  });
});

describe('generateWordList', () => {
  it('starts with the classic opening, truncated for small counts', () => {
    expect(generateWordList(createRng(1), 3, true)).toEqual(['lorem', 'ipsum', 'dolor']);
    const ten = generateWordList(createRng(1), 10, true);
    expect(ten.slice(0, 5)).toEqual(['lorem', 'ipsum', 'dolor', 'sit', 'amet']);
    expect(ten).toHaveLength(10);
  });
});

describe('generateLorem', () => {
  it('is deterministic for a given seed and varies across seeds', () => {
    expect(generateLorem(base)).toBe(generateLorem(base));
    expect(generateLorem(base)).not.toBe(generateLorem({ ...base, seed: 43 }));
  });

  it('produces the requested number of paragraphs', () => {
    const text = generateLorem({ ...base, count: 5 });
    expect(text.split('\n\n')).toHaveLength(5);
    expect(text.startsWith(LOREM_OPENING_SENTENCE)).toBe(true);
  });

  it('only the first paragraph starts with Lorem ipsum', () => {
    const paragraphs = generateLorem({ ...base, count: 4 }).split('\n\n');
    expect(paragraphs.filter((p) => p.startsWith(LOREM_OPENING_SENTENCE))).toHaveLength(1);
  });

  it('can skip the classic opening', () => {
    // Several seeds: none should start with the fixed opening sentence.
    for (let seed = 0; seed < 20; seed += 1) {
      expect(generateLorem({ ...base, seed, startWithLorem: false }).startsWith(LOREM_OPENING_SENTENCE)).toBe(false);
    }
  });

  it('produces the requested number of sentences', () => {
    const text = generateLorem({ ...base, unit: 'sentences', count: 7 });
    expect(text.match(/\./g)).toHaveLength(7);
    expect(text).not.toContain('\n');
  });

  it('produces exactly the requested number of words', () => {
    for (const count of [1, 2, 5, 6, 37, 100]) {
      const text = generateLorem({ ...base, unit: 'words', count });
      expect(wordsOf(text)).toHaveLength(count);
      expect(text.endsWith('.')).toBe(true);
    }
    expect(generateLorem({ ...base, unit: 'words', count: 2 })).toBe('Lorem ipsum.');
  });

  it('clamps out-of-range counts', () => {
    expect(generateLorem({ ...base, count: 0 }).split('\n\n')).toHaveLength(1);
    expect(generateLorem({ ...base, count: 500 }).split('\n\n')).toHaveLength(100);
    expect(wordsOf(generateLorem({ ...base, unit: 'words', count: 1000 }))).toHaveLength(100);
  });

  it('wraps paragraphs in <p> tags for HTML output', () => {
    const html = generateLorem({ ...base, count: 3, format: 'html' });
    const lines = html.split('\n');
    expect(lines).toHaveLength(3);
    for (const line of lines) expect(line).toMatch(/^<p>[^<>]+<\/p>$/);
  });

  it('wraps sentences/words output in a single <p>', () => {
    expect(generateLorem({ ...base, unit: 'sentences', count: 3, format: 'html' })).toMatch(/^<p>[^<>]+<\/p>$/);
    expect(generateLorem({ ...base, unit: 'words', count: 3, format: 'html' })).toBe('<p>Lorem ipsum dolor.</p>');
  });
});

describe('randomSeed', () => {
  it('returns unsigned 32-bit integers', () => {
    for (let i = 0; i < 10; i += 1) {
      const seed = randomSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(0xffffffff);
    }
  });
});
