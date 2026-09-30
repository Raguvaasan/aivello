import { describe, it, expect } from 'vitest';
import {
  countCharacters,
  countParagraphs,
  countSentences,
  countWords,
  durationSeconds,
  formatDuration,
  splitForSpeech,
  topKeywords,
} from '../../tools/lib/textStats';

describe('countWords', () => {
  it('ignores punctuation-only tokens', () => {
    expect(countWords('Hello — world ... !')).toBe(2);
  });

  it('keeps contractions and hyphenated words together', () => {
    expect(countWords("Don't split well-known words")).toBe(4);
  });

  it('handles empty and whitespace-only text', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t ')).toBe(0);
  });

  it('counts non-Latin words', () => {
    expect(countWords('Привет мир')).toBe(2);
  });
});

describe('countCharacters', () => {
  it('counts an emoji as one character', () => {
    expect(countCharacters('a👍b')).toBe(3);
  });
});

describe('countSentences', () => {
  it('splits on terminators followed by whitespace', () => {
    expect(countSentences('One. Two! Three? Four')).toBe(4);
  });

  it('does not split decimals or domains', () => {
    expect(countSentences('Pi is 3.14 and the site is example.com today.')).toBe(1);
  });

  it('returns 0 for no words', () => {
    expect(countSentences('...')).toBe(0);
  });
});

describe('countParagraphs', () => {
  it('splits on blank lines, including CRLF', () => {
    expect(countParagraphs('First\r\n\r\nSecond\n\n\nThird\nstill third')).toBe(3);
  });
});

describe('topKeywords', () => {
  it('ranks by frequency and skips stop words', () => {
    const result = topKeywords('The cat and the dog. The cat sat. A cat.', 2);
    expect(result[0]).toMatchObject({ word: 'cat', count: 3 });
    expect(result.map((k) => k.word)).not.toContain('the');
  });
});

describe('durations', () => {
  it('computes and formats', () => {
    expect(durationSeconds(0, 200)).toBe(0);
    expect(durationSeconds(200, 200)).toBe(60);
    expect(formatDuration(0)).toBe('0 sec');
    expect(formatDuration(45)).toBe('45 sec');
    expect(formatDuration(200)).toBe('3 min 20 sec');
    expect(formatDuration(3900)).toBe('1 hr 5 min');
  });
});

describe('splitForSpeech', () => {
  it('keeps every chunk under the limit and loses no words', () => {
    const text = `${'This is a sentence. '.repeat(30)}${'word '.repeat(120)}${'x'.repeat(450)}`;
    const chunks = splitForSpeech(text, 100);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.join(' ').replace(/\s+/g, '')).toBe(text.replace(/\s+/g, ''));
  });

  it('returns nothing for empty text', () => {
    expect(splitForSpeech('   ')).toEqual([]);
  });
});
