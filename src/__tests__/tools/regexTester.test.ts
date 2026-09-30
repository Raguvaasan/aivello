import vm from 'node:vm';
import { describe, it, expect } from 'vitest';
import {
  MAX_MATCHES,
  buildFlags,
  buildHighlightSegments,
  createRegexWorkerSource,
  escapeRegex,
  getCaptureGroupNames,
  runRegex,
  type RegexRunRequest,
  type RegexRunResponse,
} from '../../utils/tools/regexTester';

const req = (pattern: string, flags: string, text: string, extra: Partial<RegexRunRequest> = {}): RegexRunRequest => ({
  pattern,
  flags,
  text,
  replacement: null,
  maxMatches: MAX_MATCHES,
  maxTimeMs: 1000,
  ...extra,
});

describe('regexTester', () => {
  describe('runRegex', () => {
    it('finds all matches with the g flag', () => {
      const r = runRegex(req('\\d+', 'g', 'a1 b22 c333'));
      expect(r.ok).toBe(true);
      expect(r.matches.map((m) => [m.index, m.end, m.text])).toEqual([
        [1, 2, '1'],
        [4, 6, '22'],
        [8, 11, '333'],
      ]);
      expect(r.truncated).toBe(false);
    });

    it('finds only the first match without g', () => {
      const r = runRegex(req('\\d+', '', 'a1 b22 c333'));
      expect(r.matches).toHaveLength(1);
      expect(r.matches[0].text).toBe('1');
    });

    it('reports numbered and named groups', () => {
      const r = runRegex(req('(?<year>\\d{4})-(\\d{2})(-(\\d{2}))?', 'g', '2024-03 and 2025-12-31'));
      expect(r.matches).toHaveLength(2);
      expect(r.matches[0].groups).toEqual(['2024', '03', null, null]);
      expect(r.matches[0].named).toEqual([{ name: 'year', value: '2024' }]);
      expect(r.matches[1].groups).toEqual(['2025', '12', '-31', '31']);
    });

    it('respects flags i, m, s', () => {
      expect(runRegex(req('abc', 'gi', 'ABC abc')).matches).toHaveLength(2);
      expect(runRegex(req('^x', 'g', 'x\nx')).matches).toHaveLength(1);
      expect(runRegex(req('^x', 'gm', 'x\nx')).matches).toHaveLength(2);
      expect(runRegex(req('a.b', 'g', 'a\nb')).matches).toHaveLength(0);
      expect(runRegex(req('a.b', 'gs', 'a\nb')).matches).toHaveLength(1);
    });

    it('respects the sticky flag', () => {
      expect(runRegex(req('a', 'gy', 'aab a')).matches.map((m) => m.index)).toEqual([0, 1]);
      expect(runRegex(req('b', 'y', 'ab')).matches).toHaveLength(0);
    });

    it('does not loop forever on zero-length matches', () => {
      const r = runRegex(req('', 'g', 'abc'));
      expect(r.ok).toBe(true);
      expect(r.matches.map((m) => m.index)).toEqual([0, 1, 2, 3]);
      expect(r.matches.every((m) => m.text === '')).toBe(true);

      const star = runRegex(req('x*', 'g', 'axxb'));
      expect(star.matches.map((m) => [m.index, m.text])).toEqual([
        [0, ''],
        [1, 'xx'],
        [3, ''],
        [4, ''],
      ]);

      const boundary = runRegex(req('\\b', 'g', 'hi there'));
      expect(boundary.matches.map((m) => m.index)).toEqual([0, 2, 3, 8]);
      const lookahead = runRegex(req('(?=a)', 'g', 'aaa'));
      expect(lookahead.matches).toHaveLength(3);
    });

    it('steps over whole surrogate pairs for zero-length matches in unicode mode', () => {
      const text = '👋👋';
      expect(runRegex(req('', 'gu', text)).matches.map((m) => m.index)).toEqual([0, 2, 4]);
      expect(runRegex(req('', 'g', text)).matches.map((m) => m.index)).toEqual([0, 1, 2, 3, 4]);
    });

    it('caps the number of matches and flags truncation', () => {
      const text = 'a'.repeat(5000);
      const r = runRegex(req('a', 'g', text));
      expect(r.matches).toHaveLength(MAX_MATCHES);
      expect(r.truncated).toBe(true);
      const zero = runRegex(req('', 'g', text));
      expect(zero.matches).toHaveLength(MAX_MATCHES);
      expect(zero.truncated).toBe(true);
      const exact = runRegex(req('a', 'g', 'aaa', { maxMatches: 3 }));
      expect(exact.matches).toHaveLength(3);
      expect(exact.truncated).toBe(false);
    });

    it('returns a helpful error for invalid patterns and flags', () => {
      const r = runRegex(req('(abc', 'g', 'abc'));
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/Invalid regular expression|Unterminated group/i);
      expect(runRegex(req('a', 'gg', 'a')).ok).toBe(false);
      expect(runRegex(req('\\p{L}', 'u', 'a')).ok).toBe(true);
      expect(runRegex(req('\\p{Nope}', 'u', 'a')).ok).toBe(false);
    });

    it('builds a replacement preview with $1 and $<name>', () => {
      const r = runRegex(req('(?<first>\\w+) (\\w+)', 'g', 'john smith, jane doe', { replacement: '$2 $<first>' }));
      expect(r.replaced).toBe('smith john, doe jane');
      const once = runRegex(req('o', '', 'foo', { replacement: '0' }));
      expect(once.replaced).toBe('f0o');
      expect(runRegex(req('', 'g', 'ab', { replacement: '-' })).replaced).toBe('-a-b-');
    });

    it('stops when the soft time limit is exceeded', () => {
      const r = runRegex(req('a', 'g', 'a'.repeat(5000), { maxTimeMs: -1, maxMatches: 100000 }));
      expect(r.timedOut).toBe(true);
      expect(r.matches.length).toBeGreaterThan(0);
      expect(r.matches.length).toBeLessThan(5000);
    });
  });

  describe('worker source', () => {
    it('is self-contained and answers messages', () => {
      const posted: Array<{ id: number; response: RegexRunResponse }> = [];
      const self: { onmessage: ((e: { data: unknown }) => void) | null; postMessage: (m: never) => void } = {
        onmessage: null,
        postMessage: (m) => posted.push(m),
      };
      const context = vm.createContext({ self, RegExp, Object, String, Date, Error });
      new vm.Script(createRegexWorkerSource()).runInContext(context);
      expect(typeof self.onmessage).toBe('function');
      self.onmessage?.({ data: { id: 7, request: req('(\\w)(?<rest>\\w*)', 'g', 'hello world') } });
      expect(posted).toHaveLength(1);
      expect(posted[0].id).toBe(7);
      expect(posted[0].response.ok).toBe(true);
      expect(posted[0].response.matches.map((m) => m.text)).toEqual(['hello', 'world']);
      expect(posted[0].response.matches[0].named).toEqual([{ name: 'rest', value: 'ello' }]);
    });
  });

  describe('helpers', () => {
    it('builds flags in canonical order', () => {
      expect(buildFlags({ y: true, g: true, i: true })).toBe('giy');
      expect(buildFlags({})).toBe('');
      expect(buildFlags({ g: true, i: false, m: true, s: true, u: true, y: false })).toBe('gmsu');
    });

    it('lists capture group names', () => {
      expect(getCaptureGroupNames('(a)(?:b)(?<name>c)(?=d)(?!e)(?<=f)(?<!g)(h)')).toEqual([null, 'name', null]);
      expect(getCaptureGroupNames('\\((x)[(](?<y>z)')).toEqual([null, 'y']);
      expect(getCaptureGroupNames('[\\]()](a)')).toEqual([null]);
      expect(getCaptureGroupNames('no groups')).toEqual([]);
    });

    it('builds highlight segments from match indices', () => {
      const text = 'a1 b22';
      const r = runRegex(req('\\d+', 'g', text));
      expect(buildHighlightSegments(text, r.matches)).toEqual([
        { text: 'a', matchIndex: null },
        { text: '1', matchIndex: 0 },
        { text: ' b', matchIndex: null },
        { text: '22', matchIndex: 1 },
      ]);
    });

    it('keeps zero-length matches as empty segments', () => {
      const text = 'ab';
      const r = runRegex(req('', 'g', text));
      const segs = buildHighlightSegments(text, r.matches);
      expect(segs.map((s) => s.text).join('')).toBe(text);
      expect(segs.filter((s) => s.matchIndex !== null)).toHaveLength(3);
    });

    it('ignores stale or overlapping indices', () => {
      expect(buildHighlightSegments('abc', [{ index: 0, end: 2 }, { index: 1, end: 3 }, { index: 2, end: 10 }])).toEqual([
        { text: 'ab', matchIndex: 0 },
        { text: 'c', matchIndex: null },
      ]);
    });

    it('escapes regex metacharacters', () => {
      const special = 'a.b*c+d?e^f$g{h}i(j)k|l[m]n\\o/p';
      expect(new RegExp(escapeRegex(special)).test(special)).toBe(true);
      expect(new RegExp(`^${escapeRegex('a.b')}$`).test('axb')).toBe(false);
    });
  });
});
