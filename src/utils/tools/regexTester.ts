/**
 * Pure helpers for the Regex Tester tool.
 *
 * `runRegex` is deliberately self-contained (it references nothing outside itself) and avoids
 * syntax that transpilers rewrite into shared helpers (destructuring, spread, for-of, optional
 * chaining, `typeof`),
 * because its source text is also used to build a Web Worker. Running patterns in a worker lets
 * the UI terminate a catastrophically backtracking pattern instead of freezing the tab.
 */

export const REGEX_FLAGS = ['g', 'i', 'm', 's', 'u', 'y'] as const;
export type RegexFlag = (typeof REGEX_FLAGS)[number];

export const REGEX_FLAG_INFO: Record<RegexFlag, string> = {
  g: 'global - find all matches',
  i: 'ignore case',
  m: 'multiline - ^ and $ match at line breaks',
  s: 'dotAll - . matches newlines',
  u: 'unicode - code point aware',
  y: 'sticky - match only at lastIndex',
};

export const MAX_TEST_STRING_LENGTH = 100000;
export const MAX_MATCHES = 1000;
/** Soft time limit checked between matches. */
export const MAX_MATCH_LOOP_MS = 1000;
/** Hard limit after which the worker is terminated. */
export const WORKER_TIMEOUT_MS = 1500;

export interface RegexRunRequest {
  pattern: string;
  flags: string;
  text: string;
  /** Replacement string for the preview, or null to skip replacing. */
  replacement: string | null;
  maxMatches: number;
  maxTimeMs: number;
}

export interface RegexNamedGroup {
  name: string;
  value: string | null;
}

export interface RegexRunMatch {
  index: number;
  end: number;
  text: string;
  /** Numbered capture groups (group 1 first); null when the group did not participate. */
  groups: Array<string | null>;
  named: RegexNamedGroup[];
}

export interface RegexRunResponse {
  ok: boolean;
  error: string | null;
  matches: RegexRunMatch[];
  /** More matches exist than `maxMatches`. */
  truncated: boolean;
  /** Stopped early because matching exceeded `maxTimeMs`. */
  timedOut: boolean;
  replaced: string | null;
  elapsedMs: number;
}

/**
 * Compiles and runs a pattern against `text`, collecting at most `maxMatches` matches and
 * guarding zero-length matches from looping forever. Never throws.
 */
export function runRegex(req: RegexRunRequest): RegexRunResponse {
  const started = Date.now();
  const fail = function (message: string): RegexRunResponse {
    return {
      ok: false,
      error: message,
      matches: [],
      truncated: false,
      timedOut: false,
      replaced: null,
      elapsedMs: Date.now() - started,
    };
  };
  const errorMessage = function (err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  };
  // Advances past a zero-length match, stepping over a whole surrogate pair in unicode mode.
  const advance = function (str: string, index: number, unicode: boolean): number {
    if (unicode && index + 1 < str.length) {
      const hi = str.charCodeAt(index);
      const lo = str.charCodeAt(index + 1);
      if (hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff) return index + 2;
    }
    return index + 1;
  };

  const flags = req.flags;
  const isGlobal = flags.indexOf('g') !== -1;
  let re: RegExp;
  let iter: RegExp;
  try {
    re = new RegExp(req.pattern, flags);
    // Always iterate with a global copy; non-global patterns stop after the first match.
    iter = new RegExp(req.pattern, isGlobal ? flags : flags + 'g');
  } catch (err) {
    return fail(errorMessage(err));
  }

  const text = req.text;
  const unicode = flags.indexOf('u') !== -1 || flags.indexOf('v') !== -1;
  const matches: RegexRunMatch[] = [];
  let truncated = false;
  let timedOut = false;
  let replaced: string | null = null;

  try {
    iter.lastIndex = 0;
    for (;;) {
      const m = iter.exec(text);
      if (m === null) break;
      const groups: Array<string | null> = [];
      for (let g = 1; g < m.length; g++) {
        groups.push(m[g] === undefined ? null : m[g]);
      }
      const named: RegexNamedGroup[] = [];
      if (m.groups) {
        const names = Object.keys(m.groups);
        for (let n = 0; n < names.length; n++) {
          const value = m.groups[names[n]];
          named.push({ name: names[n], value: value === undefined ? null : value });
        }
      }
      matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: groups, named: named });

      if (!isGlobal) break;
      if (m[0] === '') iter.lastIndex = advance(text, iter.lastIndex, unicode);
      if (matches.length >= req.maxMatches) {
        truncated = iter.lastIndex <= text.length && iter.exec(text) !== null;
        break;
      }
      if (Date.now() - started > req.maxTimeMs) {
        timedOut = true;
        break;
      }
    }

    if (req.replacement !== null && !timedOut) {
      re.lastIndex = 0;
      replaced = text.replace(re, req.replacement);
    }
  } catch (err) {
    return fail(errorMessage(err));
  }

  return {
    ok: true,
    error: null,
    matches: matches,
    truncated: truncated,
    timedOut: timedOut,
    replaced: replaced,
    elapsedMs: Date.now() - started,
  };
}

/** Source of a dedicated worker that answers `{ id, request }` messages with `{ id, response }`. */
export function createRegexWorkerSource(): string {
  return (
    'var runRegex = ' +
    runRegex.toString() +
    ';\n' +
    'self.onmessage = function (e) {\n' +
    '  var id = e.data && e.data.id;\n' +
    '  var response;\n' +
    '  try { response = runRegex(e.data.request); }\n' +
    '  catch (err) { response = { ok: false, error: String((err && err.message) || err), matches: [], truncated: false, timedOut: false, replaced: null, elapsedMs: 0 }; }\n' +
    '  self.postMessage({ id: id, response: response });\n' +
    '};\n'
  );
}

/** Builds a flags string in canonical order from a set of enabled flags. */
export function buildFlags(enabled: Partial<Record<RegexFlag, boolean>>): string {
  return REGEX_FLAGS.filter((f) => enabled[f]).join('');
}

/**
 * Lists capture groups in order (group 1 first): the group name, or null for unnamed groups.
 * Skips escapes, character classes and non-capturing / lookaround groups.
 */
export function getCaptureGroupNames(pattern: string): Array<string | null> {
  const names: Array<string | null> = [];
  let inClass = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '\\') {
      i++;
      continue;
    }
    if (inClass) {
      if (c === ']') inClass = false;
      continue;
    }
    if (c === '[') {
      inClass = true;
      continue;
    }
    if (c !== '(') continue;
    if (pattern[i + 1] !== '?') {
      names.push(null);
      continue;
    }
    if (pattern[i + 2] === '<' && pattern[i + 3] !== '=' && pattern[i + 3] !== '!') {
      const close = pattern.indexOf('>', i + 3);
      if (close !== -1) names.push(pattern.slice(i + 3, close));
    }
  }
  return names;
}

export interface HighlightSegment {
  text: string;
  /** Index into the match list, or null for unmatched text. Zero-length matches have empty text. */
  matchIndex: number | null;
}

/** Splits `text` into plain and matched segments for rendering as React spans. */
export function buildHighlightSegments(
  text: string,
  matches: ReadonlyArray<{ index: number; end: number }>
): HighlightSegment[] {
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const { index, end } = matches[i];
    if (index < cursor || end > text.length) continue; // defensive: overlapping / stale
    if (index > cursor) segments.push({ text: text.slice(cursor, index), matchIndex: null });
    segments.push({ text: text.slice(index, end), matchIndex: i });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), matchIndex: null });
  return segments;
}

/** Escapes text so it can be used literally inside a pattern. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
