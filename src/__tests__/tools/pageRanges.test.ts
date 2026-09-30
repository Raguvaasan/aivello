import { describe, it, expect } from 'vitest';
import { parsePageRanges, formatPageList } from '../../utils/tools/pageRanges';

const pagesOf = (input: string, count: number) => {
  const result = parsePageRanges(input, count);
  if (!result.ok) throw new Error(result.error);
  return result.pages;
};

const errorOf = (input: string, count: number) => {
  const result = parsePageRanges(input, count);
  if (result.ok) throw new Error(`expected "${input}" to fail`);
  return result.error;
};

describe('parsePageRanges', () => {
  it('parses single pages and ranges', () => {
    expect(pagesOf('1-3,5,8-10', 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
    expect(pagesOf('4', 4)).toEqual([4]);
    expect(pagesOf('2-2', 3)).toEqual([2]);
  });

  it('ignores whitespace and empty tokens', () => {
    expect(pagesOf(' 1 - 3 , 5 ,, 7 ', 10)).toEqual([1, 2, 3, 5, 7]);
    expect(pagesOf('1,', 3)).toEqual([1]);
  });

  it('accepts en and em dashes', () => {
    expect(pagesOf('1–3', 5)).toEqual([1, 2, 3]);
    expect(pagesOf('2—4', 5)).toEqual([2, 3, 4]);
  });

  it('supports open-ended ranges to the last page', () => {
    expect(pagesOf('8-', 10)).toEqual([8, 9, 10]);
  });

  it('keeps typed order and drops duplicates', () => {
    expect(pagesOf('5,1-3', 5)).toEqual([5, 1, 2, 3]);
    expect(pagesOf('1-3,2-4,1', 5)).toEqual([1, 2, 3, 4]);
  });

  it('reports groups as typed', () => {
    const result = parsePageRanges('1-3,5', 10);
    expect(result.ok && result.groups).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
    ]);
  });

  it('rejects empty input', () => {
    expect(errorOf('', 5)).toMatch(/at least one page/);
    expect(errorOf('  ,  , ', 5)).toMatch(/at least one page/);
  });

  it('rejects pages outside the document', () => {
    expect(errorOf('11', 10)).toMatch(/Page 11 is out of range - this document has 10 pages/);
    expect(errorOf('8-12', 10)).toMatch(/Page 12/);
    expect(errorOf('2', 1)).toMatch(/has 1 page\./);
    expect(errorOf('0', 10)).toMatch(/start at 1/);
    expect(errorOf('0-3', 10)).toMatch(/start at 1/);
  });

  it('rejects reversed ranges with a hint', () => {
    expect(errorOf('5-3', 10)).toMatch(/backwards - write it as 3-5/);
  });

  it('rejects garbage tokens', () => {
    for (const bad of ['a', '1-2-3', '-3', '1.5', '1;2', '3-a', '+2', '1 2']) {
      expect(errorOf(bad, 10)).toBeTruthy();
    }
  });

  it('rejects a document without pages', () => {
    expect(errorOf('1', 0)).toMatch(/no pages/);
  });

  it('rejects absurdly long input', () => {
    expect(errorOf('1,'.repeat(600), 10)).toMatch(/too long/);
  });
});

describe('formatPageList', () => {
  it('compresses consecutive runs', () => {
    expect(formatPageList([1, 2, 3, 5, 8, 9, 10])).toBe('1-3,5,8-10');
    expect(formatPageList([4])).toBe('4');
    expect(formatPageList([])).toBe('');
    expect(formatPageList([5, 1, 2, 3])).toBe('5,1-3');
  });
});
