import { describe, it, expect } from 'vitest';
import {
  MAX_DIFF_LINES,
  diffLines,
  diffSequences,
  diffWords,
  normalizeForCompare,
  splitLines,
  toUnifiedPatch,
  type DiffRun,
  type LineDiffResult,
} from '../../utils/tools/textDiff';

const ok = (r: ReturnType<typeof diffLines>): LineDiffResult => {
  if (!r.ok) throw new Error('expected a diff result');
  return r;
};

/** Applies runs to rebuild `b` from `a` - proves the edit script is correct. */
function applyRuns(a: number[], b: number[], runs: DiffRun[]): number[] {
  const out: number[] = [];
  let ai = 0;
  let bi = 0;
  for (const run of runs) {
    if (run.type === 'equal') {
      expect(run.aStart).toBe(ai);
      expect(run.bStart).toBe(bi);
      for (let k = 0; k < run.length; k++) expect(a[ai + k]).toBe(b[bi + k]);
      out.push(...a.slice(ai, ai + run.length));
      ai += run.length;
      bi += run.length;
    } else if (run.type === 'delete') {
      expect(run.aStart).toBe(ai);
      ai += run.length;
    } else {
      expect(run.bStart).toBe(bi);
      out.push(...b.slice(bi, bi + run.length));
      bi += run.length;
    }
  }
  expect(ai).toBe(a.length);
  expect(bi).toBe(b.length);
  return out;
}

/** Classic O(nm) LCS length, used to check the diff is minimal. */
function lcsLength(a: number[], b: number[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Deterministic pseudo-random generator for reproducible fuzzing. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

describe('textDiff', () => {
  describe('splitLines', () => {
    it('handles all newline styles and a trailing newline', () => {
      expect(splitLines('')).toEqual([]);
      expect(splitLines('a')).toEqual(['a']);
      expect(splitLines('a\nb\r\nc\rd')).toEqual(['a', 'b', 'c', 'd']);
      expect(splitLines('a\nb\n')).toEqual(['a', 'b']);
      expect(splitLines('a\n\n')).toEqual(['a', '']);
      expect(splitLines('\n')).toEqual(['']);
    });
  });

  describe('diffLines', () => {
    it('reports identical texts', () => {
      const r = ok(diffLines('a\nb\nc', 'a\nb\nc'));
      expect(r.identical).toBe(true);
      expect(r.stats).toEqual({ added: 0, removed: 0, unchanged: 3 });
      expect(r.lines.every((l) => l.type === 'equal')).toBe(true);
    });

    it('diffs a known example', () => {
      const oldText = ['apple', 'banana', 'cherry', 'date'].join('\n');
      const newText = ['apple', 'blueberry', 'cherry', 'date', 'elderberry'].join('\n');
      const r = ok(diffLines(oldText, newText));
      expect(r.stats).toEqual({ added: 2, removed: 1, unchanged: 3 });
      expect(r.lines.map((l) => [l.type, l.text, l.oldNumber, l.newNumber])).toEqual([
        ['equal', 'apple', 1, 1],
        ['delete', 'banana', 2, null],
        ['insert', 'blueberry', null, 2],
        ['equal', 'cherry', 3, 3],
        ['equal', 'date', 4, 4],
        ['insert', 'elderberry', null, 5],
      ]);
      // Side-by-side pairs the replaced line on one row.
      expect(r.rows.map((row) => [row.type, row.left?.text ?? null, row.right?.text ?? null])).toEqual([
        ['equal', 'apple', 'apple'],
        ['change', 'banana', 'blueberry'],
        ['equal', 'cherry', 'cherry'],
        ['equal', 'date', 'date'],
        ['change', null, 'elderberry'],
      ]);
    });

    it('handles empty sides', () => {
      expect(ok(diffLines('', 'a\nb')).stats).toEqual({ added: 2, removed: 0, unchanged: 0 });
      expect(ok(diffLines('a\nb', '')).stats).toEqual({ added: 0, removed: 2, unchanged: 0 });
      expect(ok(diffLines('', '')).identical).toBe(true);
    });

    it('can ignore whitespace and case', () => {
      const a = 'Hello   World\n  indented\nSAME';
      const b = 'hello world\nindented  \nsame';
      expect(ok(diffLines(a, b)).stats.unchanged).toBe(0);
      expect(ok(diffLines(a, b, { ignoreWhitespace: true, ignoreCase: false })).stats).toEqual({
        added: 2,
        removed: 2,
        unchanged: 1,
      });
      expect(ok(diffLines(a, b, { ignoreWhitespace: true, ignoreCase: true })).identical).toBe(true);
      expect(ok(diffLines('ABC', 'abc', { ignoreWhitespace: false, ignoreCase: true })).identical).toBe(true);
      expect(normalizeForCompare('  A \t B  ', { ignoreWhitespace: true, ignoreCase: true })).toBe('a b');
    });

    it('treats a trailing newline difference as no line change', () => {
      expect(ok(diffLines('a\nb', 'a\nb\n')).identical).toBe(true);
    });

    it('refuses inputs over the line cap', () => {
      const big = Array.from({ length: MAX_DIFF_LINES + 1 }, (_, i) => `line ${i}`).join('\n');
      const r = diffLines(big, 'x');
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.reason).toBe('too-large');
        expect(r.oldLineCount).toBe(MAX_DIFF_LINES + 1);
        expect(r.message).toMatch(/5,000 lines/);
      }
    });

    it('diffs two completely different 5,000-line inputs quickly', () => {
      const a = Array.from({ length: MAX_DIFF_LINES }, (_, i) => `a${i}`).join('\n');
      const b = Array.from({ length: MAX_DIFF_LINES }, (_, i) => `b${i}`).join('\n');
      const start = Date.now();
      const r = ok(diffLines(a, b));
      expect(Date.now() - start).toBeLessThan(5000);
      expect(r.stats).toEqual({ added: MAX_DIFF_LINES, removed: MAX_DIFF_LINES, unchanged: 0 });
    });

    it('adds word-level segments to modified lines', () => {
      const r = ok(diffLines('the quick brown fox', 'the slow brown fox'));
      const row = r.rows[0];
      expect(row.type).toBe('change');
      expect(row.left?.segments).toEqual([
        { text: 'the ', changed: false },
        { text: 'quick', changed: true },
        { text: ' brown fox', changed: false },
      ]);
      expect(row.right?.segments).toEqual([
        { text: 'the ', changed: false },
        { text: 'slow', changed: true },
        { text: ' brown fox', changed: false },
      ]);
    });
  });

  describe('diffWords', () => {
    it('reconstructs both lines from segments', () => {
      const a = 'const x = foo(1, 2);';
      const b = 'let x = foo(1, 3, 4);';
      const w = diffWords(a, b);
      expect(w).not.toBeNull();
      if (w) {
        expect(w.left.map((s) => s.text).join('')).toBe(a);
        expect(w.right.map((s) => s.text).join('')).toBe(b);
        expect(w.left.filter((s) => s.changed).map((s) => s.text)).toEqual(['const', '2']);
      }
    });

    it('handles unicode words', () => {
      const w = diffWords('héllo wörld 👋', 'héllo welt 👋');
      expect(w?.right.filter((s) => s.changed).map((s) => s.text)).toEqual(['welt']);
    });
  });

  describe('diffSequences', () => {
    it('produces a correct and minimal edit script (fuzz)', () => {
      const rand = lcg(42);
      for (let t = 0; t < 300; t++) {
        const n = Math.floor(rand() * 30);
        const m = Math.floor(rand() * 30);
        const alphabet = 1 + Math.floor(rand() * 5);
        const a = Array.from({ length: n }, () => Math.floor(rand() * alphabet));
        const b = Array.from({ length: m }, () => Math.floor(rand() * alphabet));
        const { runs, timedOut } = diffSequences(a, b, Infinity);
        expect(timedOut).toBe(false);
        expect(applyRuns(a, b, runs)).toEqual(b);
        const equal = runs.filter((r) => r.type === 'equal').reduce((s, r) => s + r.length, 0);
        expect(equal).toBe(lcsLength(a, b));
        // Within a change block deletes come before inserts; no two runs of the same type touch.
        for (let i = 1; i < runs.length; i++) {
          expect(runs[i].type === runs[i - 1].type).toBe(false);
          expect(runs[i - 1].type === 'insert' && runs[i].type === 'delete').toBe(false);
        }
      }
    });

    it('still returns a valid (if coarse) script when out of time', () => {
      const a = Array.from({ length: 3000 }, (_, i) => i % 7);
      const b = Array.from({ length: 3000 }, (_, i) => (i * 3) % 11);
      const { runs } = diffSequences(a, b, 0);
      expect(applyRuns(a, b, runs)).toEqual(b);
    });
  });

  describe('toUnifiedPatch', () => {
    it('renders hunks with context and headers', () => {
      const oldLines = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`);
      const newLines = [...oldLines];
      newLines[1] = 'line 2 changed';
      newLines.splice(10, 0, 'inserted');
      const r = ok(diffLines(oldLines.join('\n'), newLines.join('\n')));
      const patch = toUnifiedPatch(r, { oldName: 'a.txt', newName: 'b.txt', context: 2 });
      expect(patch).toBe(
        [
          '--- a.txt',
          '+++ b.txt',
          '@@ -1,4 +1,4 @@',
          ' line 1',
          '-line 2',
          '+line 2 changed',
          ' line 3',
          ' line 4',
          '@@ -9,4 +9,5 @@',
          ' line 9',
          ' line 10',
          '+inserted',
          ' line 11',
          ' line 12',
          '',
        ].join('\n')
      );
    });

    it('merges nearby hunks and handles pure insertion into an empty file', () => {
      const r = ok(diffLines('', 'x\ny'));
      expect(toUnifiedPatch(r)).toBe('--- original\n+++ changed\n@@ -0,0 +1,2 @@\n+x\n+y\n');
      const merged = ok(diffLines('a\nb\nc\nd', 'A\nb\nc\nD'));
      expect(toUnifiedPatch(merged, { context: 1 }).match(/@@/g)).toHaveLength(2); // one header = two "@@"
    });

    it('renders only headers for identical input', () => {
      expect(toUnifiedPatch(ok(diffLines('a', 'a')))).toBe('--- original\n+++ changed\n');
    });
  });
});
