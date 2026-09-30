/**
 * Line-based text diff for the Text Diff Checker tool.
 *
 * Uses Myers' O(ND) algorithm in its linear-space "middle snake" form (the same bisection
 * approach as Google's diff-match-patch), applied to interned line ids, with a time budget so
 * pathological inputs degrade to a coarse diff instead of freezing the page.
 */

export const MAX_DIFF_LINES = 5000;
/** Time budget for the line diff before falling back to a coarser (still correct) result. */
export const LINE_DIFF_BUDGET_MS = 2000;
/** Total time budget for word-level highlighting inside changed lines. */
export const WORD_DIFF_BUDGET_MS = 300;
/** Lines with more tokens than this are not word-diffed. */
export const MAX_WORD_TOKENS = 600;

export type DiffRunType = 'equal' | 'insert' | 'delete';

export interface DiffRun {
  type: DiffRunType;
  /** Start index in the old sequence (for inserts: the position the insert happens at). */
  aStart: number;
  /** Start index in the new sequence (for deletes: the position the delete happens at). */
  bStart: number;
  length: number;
}

export interface DiffSequencesResult {
  runs: DiffRun[];
  timedOut: boolean;
}

/**
 * Diffs two sequences of integer ids. Runs are in order; within each block of changes, the
 * deletions come before the insertions.
 */
export function diffSequences(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  budgetMs: number = LINE_DIFF_BUDGET_MS
): DiffSequencesResult {
  const deadline = Number.isFinite(budgetMs) ? Date.now() + budgetMs : Infinity;
  const raw: DiffRun[] = [];
  let timedOut = false;

  const push = (type: DiffRunType, aStart: number, bStart: number, length: number): void => {
    if (length <= 0) return;
    const last = raw[raw.length - 1];
    if (last && last.type === type) {
      last.length += length;
      return;
    }
    raw.push({ type, aStart, bStart, length });
  };

  const bisect = (aLo: number, aHi: number, bLo: number, bHi: number): { x: number; y: number } | null => {
    const n = aHi - aLo;
    const m = bHi - bLo;
    const maxD = Math.ceil((n + m) / 2);
    const vOffset = maxD;
    const vLength = 2 * maxD + 2;
    const v1 = new Int32Array(vLength).fill(-1);
    const v2 = new Int32Array(vLength).fill(-1);
    v1[vOffset + 1] = 0;
    v2[vOffset + 1] = 0;
    const delta = n - m;
    const front = delta % 2 !== 0;
    let k1start = 0;
    let k1end = 0;
    let k2start = 0;
    let k2end = 0;

    for (let d = 0; d < maxD; d++) {
      if ((d & 31) === 0 && Date.now() > deadline) return null;

      // Walk the forward path one step.
      for (let k1 = -d + k1start; k1 <= d - k1end; k1 += 2) {
        const k1Offset = vOffset + k1;
        let x1 =
          k1 === -d || (k1 !== d && v1[k1Offset - 1] < v1[k1Offset + 1]) ? v1[k1Offset + 1] : v1[k1Offset - 1] + 1;
        let y1 = x1 - k1;
        while (x1 < n && y1 < m && a[aLo + x1] === b[bLo + y1]) {
          x1++;
          y1++;
        }
        v1[k1Offset] = x1;
        if (x1 > n) {
          k1end += 2;
        } else if (y1 > m) {
          k1start += 2;
        } else if (front) {
          const k2Offset = vOffset + delta - k1;
          if (k2Offset >= 0 && k2Offset < vLength && v2[k2Offset] !== -1) {
            const x2 = n - v2[k2Offset];
            if (x1 >= x2) return { x: aLo + x1, y: bLo + y1 };
          }
        }
      }

      // Walk the reverse path one step.
      for (let k2 = -d + k2start; k2 <= d - k2end; k2 += 2) {
        const k2Offset = vOffset + k2;
        let x2 =
          k2 === -d || (k2 !== d && v2[k2Offset - 1] < v2[k2Offset + 1]) ? v2[k2Offset + 1] : v2[k2Offset - 1] + 1;
        let y2 = x2 - k2;
        while (x2 < n && y2 < m && a[aHi - 1 - x2] === b[bHi - 1 - y2]) {
          x2++;
          y2++;
        }
        v2[k2Offset] = x2;
        if (x2 > n) {
          k2end += 2;
        } else if (y2 > m) {
          k2start += 2;
        } else if (!front) {
          const k1Offset = vOffset + delta - k2;
          if (k1Offset >= 0 && k1Offset < vLength && v1[k1Offset] !== -1) {
            const x1 = v1[k1Offset];
            const y1 = vOffset + x1 - k1Offset;
            if (x1 >= n - x2) return { x: aLo + x1, y: bLo + y1 };
          }
        }
      }
    }
    return null;
  };

  const rec = (aLo: number, aHi: number, bLo: number, bHi: number, depth: number): void => {
    // Common prefix.
    let pre = 0;
    while (aLo + pre < aHi && bLo + pre < bHi && a[aLo + pre] === b[bLo + pre]) pre++;
    push('equal', aLo, bLo, pre);
    aLo += pre;
    bLo += pre;

    // Common suffix (emitted after the middle).
    let suf = 0;
    while (aLo < aHi - suf && bLo < bHi - suf && a[aHi - 1 - suf] === b[bHi - 1 - suf]) suf++;
    const aMid = aHi - suf;
    const bMid = bHi - suf;

    if (aLo === aMid) {
      push('insert', aLo, bLo, bMid - bLo);
    } else if (bLo === bMid) {
      push('delete', aLo, bLo, aMid - aLo);
    } else {
      const split = timedOut || depth > 200 ? null : bisect(aLo, aMid, bLo, bMid);
      const degenerate =
        !split || (split.x === aLo && split.y === bLo) || (split.x === aMid && split.y === bMid);
      if (degenerate) {
        if (!split) timedOut = timedOut || Date.now() > deadline;
        push('delete', aLo, bLo, aMid - aLo);
        push('insert', aMid, bLo, bMid - bLo);
      } else {
        rec(aLo, split.x, bLo, split.y, depth + 1);
        rec(split.x, aMid, split.y, bMid, depth + 1);
      }
    }

    push('equal', aMid, bMid, suf);
  };

  rec(0, a.length, 0, b.length, 0);
  return { runs: normalizeRuns(raw), timedOut };
}

/** Collapses each block of interleaved deletes/inserts into one delete run followed by one insert run. */
function normalizeRuns(raw: DiffRun[]): DiffRun[] {
  const out: DiffRun[] = [];
  let i = 0;
  while (i < raw.length) {
    const run = raw[i];
    if (run.type === 'equal') {
      out.push({ ...run });
      i++;
      continue;
    }
    let delStart = -1;
    let delLen = 0;
    let insStart = -1;
    let insLen = 0;
    let aPos = run.aStart;
    let bPos = run.bStart;
    while (i < raw.length && raw[i].type !== 'equal') {
      const r = raw[i];
      if (r.type === 'delete') {
        if (delStart === -1) delStart = r.aStart;
        delLen += r.length;
        aPos = r.aStart + r.length;
      } else {
        if (insStart === -1) insStart = r.bStart;
        insLen += r.length;
        bPos = r.bStart + r.length;
      }
      i++;
    }
    const blockA = delStart === -1 ? aPos : delStart;
    const blockB = insStart === -1 ? bPos : insStart;
    if (delLen > 0) out.push({ type: 'delete', aStart: blockA, bStart: blockB, length: delLen });
    if (insLen > 0) out.push({ type: 'insert', aStart: blockA + delLen, bStart: blockB, length: insLen });
  }
  return out;
}

/** Splits text into lines (\n, \r\n or \r). A single trailing newline does not add an empty line. */
export function splitLines(text: string): string[] {
  if (text === '') return [];
  const lines = text.split(/\r\n|\r|\n/);
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
}

export function normalizeForCompare(line: string, options: DiffOptions): string {
  let s = line;
  if (options.ignoreWhitespace) s = s.replace(/\s+/g, ' ').trim();
  if (options.ignoreCase) s = s.toLowerCase();
  return s;
}

/** Maps each distinct (normalized) string to a small integer so comparisons are cheap. */
function intern(lists: string[][], normalize: (s: string) => string): Int32Array[] {
  const ids = new Map<string, number>();
  return lists.map((list) => {
    const out = new Int32Array(list.length);
    for (let i = 0; i < list.length; i++) {
      const key = normalize(list[i]);
      let id = ids.get(key);
      if (id === undefined) {
        id = ids.size;
        ids.set(key, id);
      }
      out[i] = id;
    }
    return out;
  });
}

export interface DiffSegment {
  text: string;
  changed: boolean;
}

const TOKEN_RE = /\s+|[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;

export function tokenize(line: string): string[] {
  return line.match(TOKEN_RE) ?? [];
}

function pushSegment(list: DiffSegment[], text: string, changed: boolean): void {
  if (text === '') return;
  const last = list[list.length - 1];
  if (last && last.changed === changed) last.text += text;
  else list.push({ text, changed });
}

/**
 * Word-level diff of two lines. Returns segments for the old line (changed = removed) and the
 * new line (changed = added), or null when the lines are too long to diff cheaply.
 */
export function diffWords(
  oldLine: string,
  newLine: string,
  options: DiffOptions = { ignoreWhitespace: false, ignoreCase: false },
  budgetMs = 50
): { left: DiffSegment[]; right: DiffSegment[] } | null {
  const aTokens = tokenize(oldLine);
  const bTokens = tokenize(newLine);
  if (aTokens.length > MAX_WORD_TOKENS || bTokens.length > MAX_WORD_TOKENS) return null;
  const normalize = (t: string): string => {
    let s = t;
    if (options.ignoreWhitespace && /^\s+$/.test(s)) s = ' ';
    if (options.ignoreCase) s = s.toLowerCase();
    return s;
  };
  const [a, b] = intern([aTokens, bTokens], normalize);
  const { runs, timedOut } = diffSequences(a, b, budgetMs);
  if (timedOut) return null;
  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  for (const run of runs) {
    if (run.type === 'equal') {
      pushSegment(left, aTokens.slice(run.aStart, run.aStart + run.length).join(''), false);
      pushSegment(right, bTokens.slice(run.bStart, run.bStart + run.length).join(''), false);
    } else if (run.type === 'delete') {
      pushSegment(left, aTokens.slice(run.aStart, run.aStart + run.length).join(''), true);
    } else {
      pushSegment(right, bTokens.slice(run.bStart, run.bStart + run.length).join(''), true);
    }
  }
  return { left, right };
}

export interface DiffLine {
  type: DiffRunType;
  text: string;
  /** 1-based line number in the original text (null for insertions). */
  oldNumber: number | null;
  /** 1-based line number in the changed text (null for deletions). */
  newNumber: number | null;
  /** Word-level segments for a modified line, when available. */
  segments: DiffSegment[] | null;
}

export interface SideBySideRow {
  type: 'equal' | 'change';
  left: DiffLine | null;
  right: DiffLine | null;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

export interface LineDiffResult {
  ok: true;
  lines: DiffLine[];
  rows: SideBySideRow[];
  stats: DiffStats;
  identical: boolean;
  timedOut: boolean;
}

export interface LineDiffTooLarge {
  ok: false;
  reason: 'too-large';
  message: string;
  oldLineCount: number;
  newLineCount: number;
}

export type LineDiffOutcome = LineDiffResult | LineDiffTooLarge;

export function diffLines(
  oldText: string,
  newText: string,
  options: DiffOptions = { ignoreWhitespace: false, ignoreCase: false },
  limits: { maxLines?: number; budgetMs?: number; wordBudgetMs?: number } = {}
): LineDiffOutcome {
  const maxLines = limits.maxLines ?? MAX_DIFF_LINES;
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  if (oldLines.length > maxLines || newLines.length > maxLines) {
    return {
      ok: false,
      reason: 'too-large',
      message: `Each side is limited to ${maxLines.toLocaleString('en-US')} lines (original has ${oldLines.length.toLocaleString('en-US')}, changed has ${newLines.length.toLocaleString('en-US')}).`,
      oldLineCount: oldLines.length,
      newLineCount: newLines.length,
    };
  }

  const [a, b] = intern([oldLines, newLines], (s) => normalizeForCompare(s, options));
  const { runs, timedOut } = diffSequences(a, b, limits.budgetMs ?? LINE_DIFF_BUDGET_MS);

  const lines: DiffLine[] = [];
  const rows: SideBySideRow[] = [];
  const stats: DiffStats = { added: 0, removed: 0, unchanged: 0 };
  const wordDeadline = Date.now() + (limits.wordBudgetMs ?? WORD_DIFF_BUDGET_MS);

  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    if (run.type === 'equal') {
      for (let k = 0; k < run.length; k++) {
        const oi = run.aStart + k;
        const ni = run.bStart + k;
        const line: DiffLine = { type: 'equal', text: newLines[ni], oldNumber: oi + 1, newNumber: ni + 1, segments: null };
        lines.push(line);
        rows.push({
          type: 'equal',
          left: { ...line, text: oldLines[oi] },
          right: line,
        });
      }
      stats.unchanged += run.length;
      continue;
    }

    // A change block: a delete run optionally followed by an insert run (or an insert alone).
    const del = run.type === 'delete' ? run : null;
    const next = runs[r + 1];
    const ins = run.type === 'insert' ? run : next && next.type === 'insert' ? next : null;
    if (del && ins) r++;

    const deleted: DiffLine[] = [];
    const inserted: DiffLine[] = [];
    if (del) {
      for (let k = 0; k < del.length; k++) {
        const oi = del.aStart + k;
        deleted.push({ type: 'delete', text: oldLines[oi], oldNumber: oi + 1, newNumber: null, segments: null });
      }
      stats.removed += del.length;
    }
    if (ins) {
      for (let k = 0; k < ins.length; k++) {
        const ni = ins.bStart + k;
        inserted.push({ type: 'insert', text: newLines[ni], oldNumber: null, newNumber: ni + 1, segments: null });
      }
      stats.added += ins.length;
    }

    const pairs = Math.max(deleted.length, inserted.length);
    for (let k = 0; k < pairs; k++) {
      const left = deleted[k] ?? null;
      const right = inserted[k] ?? null;
      if (left && right && Date.now() < wordDeadline) {
        const words = diffWords(left.text, right.text, options);
        if (words) {
          left.segments = words.left;
          right.segments = words.right;
        }
      }
      rows.push({ type: 'change', left, right });
    }
    lines.push(...deleted, ...inserted);
  }

  return {
    ok: true,
    lines,
    rows,
    stats,
    identical: stats.added === 0 && stats.removed === 0,
    timedOut,
  };
}

/**
 * Renders a diff as a unified patch (`diff -u` style) with `context` lines around each hunk.
 */
export function toUnifiedPatch(
  result: LineDiffResult,
  options: { oldName?: string; newName?: string; context?: number } = {}
): string {
  const context = Math.max(0, options.context ?? 3);
  const { lines } = result;
  const out: string[] = [`--- ${options.oldName ?? 'original'}`, `+++ ${options.newName ?? 'changed'}`];
  if (result.identical) return out.join('\n') + '\n';

  // Prefix sums of old/new line presence for hunk header maths.
  const oldBefore = new Int32Array(lines.length + 1);
  const newBefore = new Int32Array(lines.length + 1);
  for (let i = 0; i < lines.length; i++) {
    oldBefore[i + 1] = oldBefore[i] + (lines[i].oldNumber !== null ? 1 : 0);
    newBefore[i + 1] = newBefore[i] + (lines[i].newNumber !== null ? 1 : 0);
  }

  const changeIdx: number[] = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].type !== 'equal') changeIdx.push(i);

  let g = 0;
  while (g < changeIdx.length) {
    let last = changeIdx[g];
    let h = g + 1;
    while (h < changeIdx.length && changeIdx[h] - last <= context * 2 + 1) {
      last = changeIdx[h];
      h++;
    }
    const start = Math.max(0, changeIdx[g] - context);
    const end = Math.min(lines.length, last + context + 1);
    const oldCount = oldBefore[end] - oldBefore[start];
    const newCount = newBefore[end] - newBefore[start];
    const oldStart = oldCount === 0 ? oldBefore[start] : oldBefore[start] + 1;
    const newStart = newCount === 0 ? newBefore[start] : newBefore[start] + 1;
    const range = (s: number, c: number): string => (c === 1 ? `${s}` : `${s},${c}`);
    out.push(`@@ -${range(oldStart, oldCount)} +${range(newStart, newCount)} @@`);
    for (let i = start; i < end; i++) {
      const line = lines[i];
      const prefix = line.type === 'equal' ? ' ' : line.type === 'delete' ? '-' : '+';
      out.push(prefix + line.text);
    }
    g = h;
  }
  return out.join('\n') + '\n';
}
