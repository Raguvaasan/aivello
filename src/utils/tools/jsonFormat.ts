/**
 * Pure helpers for the JSON Formatter & Validator tool.
 *
 * Everything here runs locally; nothing is sent over the network.
 */

export type JsonIndent = 2 | 4 | 'tab';

/** Hard limit on the size of the input the tool will process (5 MB of UTF-8). */
export const MAX_JSON_INPUT_BYTES = 5 * 1024 * 1024;

export interface JsonErrorInfo {
  /** Human readable message (engine message, lightly cleaned up). */
  message: string;
  /** 0-based UTF-16 offset of the problem, when it could be determined. */
  position: number | null;
  /** 1-based line of the problem, when it could be determined. */
  line: number | null;
  /** 1-based column of the problem, when it could be determined. */
  column: number | null;
}

export type JsonParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonErrorInfo };

export type JsonTransformResult =
  | { ok: true; output: string; value: unknown }
  | { ok: false; error: JsonErrorInfo };

export interface FormatOptions {
  indent: JsonIndent;
  sortKeys: boolean;
}

/** Number of bytes `text` occupies when encoded as UTF-8 (without allocating a buffer). */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        // Valid surrogate pair -> one 4-byte code point.
        bytes += 4;
        i++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isWithinSizeLimit(text: string, limit = MAX_JSON_INPUT_BYTES): boolean {
  // Every UTF-16 code unit encodes to at most 3 UTF-8 bytes, so short inputs can skip the count.
  if (text.length * 3 <= limit) return true;
  if (text.length > limit) return false;
  return utf8ByteLength(text) <= limit;
}

/** Converts a 0-based offset in `text` into a 1-based line and column. */
export function positionToLineColumn(text: string, position: number): { line: number; column: number } {
  const pos = Math.max(0, Math.min(position, text.length));
  let line = 1;
  let lineStart = 0;
  for (let i = 0; i < pos; i++) {
    if (text.charCodeAt(i) === 0x0a) {
      line++;
      lineStart = i + 1;
    }
  }
  return { line, column: pos - lineStart + 1 };
}

/** Converts a 1-based line/column back into a 0-based offset (clamped to the text). */
export function lineColumnToPosition(text: string, line: number, column: number): number {
  let currentLine = 1;
  let i = 0;
  while (currentLine < line && i < text.length) {
    if (text.charCodeAt(i) === 0x0a) currentLine++;
    i++;
  }
  return Math.min(text.length, i + Math.max(0, column - 1));
}

const isWs = (c: number): boolean => c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
const isDigit = (c: number): boolean => c >= 0x30 && c <= 0x39;
const isHex = (c: number): boolean =>
  (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);

/**
 * Independent, iterative JSON syntax scanner (RFC 8259) that returns the offset of the first
 * syntax error, or `null` when the text is valid JSON. Used when the engine's error message
 * carries no position (Safari, "Unexpected end of JSON input", ...). Iterative so that very
 * deeply nested input cannot overflow the call stack.
 */
export function findJsonErrorOffset(text: string): number | null {
  const n = text.length;
  let i = 0;
  // Stack of open containers: 0x5b '[' or 0x7b '{'.
  const stack: number[] = [];

  const skipWs = (): void => {
    while (i < n && isWs(text.charCodeAt(i))) i++;
  };

  /** Scans a string starting at the opening quote. Returns an error offset or -1. */
  const scanString = (): number => {
    i++; // opening quote
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 0x22) {
        i++;
        return -1;
      }
      if (c === 0x5c) {
        if (i + 1 >= n) return n;
        const e = text.charCodeAt(i + 1);
        // " \ / b f n r t
        if (e === 0x22 || e === 0x5c || e === 0x2f || e === 0x62 || e === 0x66 || e === 0x6e || e === 0x72 || e === 0x74) {
          i += 2;
          continue;
        }
        if (e === 0x75) {
          for (let k = 0; k < 4; k++) {
            const pos = i + 2 + k;
            if (pos >= n) return n;
            if (!isHex(text.charCodeAt(pos))) return pos;
          }
          i += 6;
          continue;
        }
        return i + 1;
      }
      if (c < 0x20) return i; // unescaped control character
      i++;
    }
    return n; // unterminated string
  };

  /** Scans a number. Returns an error offset or -1. */
  const scanNumber = (): number => {
    if (text.charCodeAt(i) === 0x2d) i++; // '-'
    if (i >= n) return n;
    if (text.charCodeAt(i) === 0x30) {
      i++;
    } else if (isDigit(text.charCodeAt(i))) {
      while (i < n && isDigit(text.charCodeAt(i))) i++;
    } else {
      return i;
    }
    if (i < n && text.charCodeAt(i) === 0x2e) {
      i++;
      if (i >= n) return n;
      if (!isDigit(text.charCodeAt(i))) return i;
      while (i < n && isDigit(text.charCodeAt(i))) i++;
    }
    if (i < n && (text.charCodeAt(i) === 0x65 || text.charCodeAt(i) === 0x45)) {
      i++;
      if (i < n && (text.charCodeAt(i) === 0x2b || text.charCodeAt(i) === 0x2d)) i++;
      if (i >= n) return n;
      if (!isDigit(text.charCodeAt(i))) return i;
      while (i < n && isDigit(text.charCodeAt(i))) i++;
    }
    return -1;
  };

  const scanLiteral = (word: string): number => {
    for (let k = 0; k < word.length; k++) {
      if (i + k >= n) return n;
      if (text.charCodeAt(i + k) !== word.charCodeAt(k)) return i + k;
    }
    i += word.length;
    return -1;
  };

  /**
   * Scans one value. When it opens a container, pushes onto the stack and returns -1 with
   * `opened` set so the caller switches state. Returns an error offset or -1.
   */
  let opened = false;
  const scanValue = (): number => {
    opened = false;
    skipWs();
    if (i >= n) return n;
    const c = text.charCodeAt(i);
    if (c === 0x7b || c === 0x5b) {
      stack.push(c);
      i++;
      opened = true;
      return -1;
    }
    if (c === 0x22) return scanString();
    if (c === 0x2d || isDigit(c)) return scanNumber();
    if (c === 0x74) return scanLiteral('true');
    if (c === 0x66) return scanLiteral('false');
    if (c === 0x6e) return scanLiteral('null');
    return i;
  };

  type State = 'value' | 'afterOpen' | 'afterValue' | 'key';
  let state: State = 'value';

  for (;;) {
    if (state === 'value') {
      const err = scanValue();
      if (err >= 0) return err;
      state = opened ? 'afterOpen' : 'afterValue';
      continue;
    }

    if (state === 'afterOpen') {
      skipWs();
      if (i >= n) return n;
      const top = stack[stack.length - 1];
      const c = text.charCodeAt(i);
      if (top === 0x5b && c === 0x5d) {
        stack.pop();
        i++;
        state = 'afterValue';
        continue;
      }
      if (top === 0x7b && c === 0x7d) {
        stack.pop();
        i++;
        state = 'afterValue';
        continue;
      }
      state = top === 0x7b ? 'key' : 'value';
      continue;
    }

    if (state === 'key') {
      skipWs();
      if (i >= n) return n;
      if (text.charCodeAt(i) !== 0x22) return i;
      const err = scanString();
      if (err >= 0) return err;
      skipWs();
      if (i >= n) return n;
      if (text.charCodeAt(i) !== 0x3a) return i;
      i++;
      state = 'value';
      continue;
    }

    // afterValue
    skipWs();
    if (stack.length === 0) {
      return i < n ? i : null;
    }
    if (i >= n) return n;
    const top = stack[stack.length - 1];
    const c = text.charCodeAt(i);
    if (c === 0x2c) {
      i++;
      state = top === 0x7b ? 'key' : 'value';
      continue;
    }
    if ((top === 0x5b && c === 0x5d) || (top === 0x7b && c === 0x7d)) {
      stack.pop();
      i++;
      state = 'afterValue';
      continue;
    }
    return i;
  }
}

/**
 * Pulls a location out of a `JSON.parse` error message. Engines disagree:
 *  - V8 (new):   `Expected ',' or '}' after property value in JSON at position 12 (line 2 column 3)`
 *  - V8 (old):   `Unexpected token } in JSON at position 12`
 *  - Firefox:    `JSON.parse: expected ',' or '}' after property value in object at line 2 column 3 of the JSON data`
 *  - Safari:     `JSON Parse error: Expected '}'` (no location at all)
 * Returns `null` when the message has no usable location.
 */
export function extractLocationFromMessage(
  message: string,
  text: string
): { position: number; line: number; column: number } | null {
  const lineCol = /line\s+(\d+)\s+column\s+(\d+)/i.exec(message);
  if (lineCol) {
    const line = Number(lineCol[1]);
    const column = Number(lineCol[2]);
    if (line >= 1 && column >= 1) {
      return { position: lineColumnToPosition(text, line, column), line, column };
    }
  }
  const pos = /position\s+(\d+)/i.exec(message);
  if (pos) {
    const position = Math.min(Number(pos[1]), text.length);
    return { position, ...positionToLineColumn(text, position) };
  }
  return null;
}

/** Strips engine-specific prefixes and the (now redundant) location suffixes. */
export function cleanJsonErrorMessage(message: string): string {
  const cleaned = message
    .replace(/^JSON\.parse:\s*/i, '')
    .replace(/^JSON Parse error:\s*/i, '')
    .replace(/\s*\(line \d+ column \d+\)\s*$/i, '')
    .replace(/\s+at line \d+ column \d+ of the JSON data\s*$/i, '')
    .replace(/\s+in JSON at position \d+\s*$/i, '')
    .replace(/\s+at position \d+\s*$/i, '')
    .trim();
  if (!cleaned) return 'Invalid JSON';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Builds error details for a failed parse of `text`. */
export function describeJsonError(rawMessage: string, text: string): JsonErrorInfo {
  const message = cleanJsonErrorMessage(rawMessage);
  const fromMessage = extractLocationFromMessage(rawMessage, text);
  if (fromMessage) {
    return { message, ...fromMessage };
  }
  const offset = findJsonErrorOffset(text);
  if (offset !== null) {
    return { message, position: offset, ...positionToLineColumn(text, offset) };
  }
  return { message, position: null, line: null, column: null };
}

export function parseJson(text: string): JsonParseResult {
  if (text.trim() === '') {
    return {
      ok: false,
      error: { message: 'Input is empty', position: null, line: null, column: null },
    };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    return { ok: false, error: describeJsonError(raw, text) };
  }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Returns a deep copy of `value` with every object's keys sorted (by UTF-16 code unit order).
 * Arrays keep their order. Uses null-prototype objects so a `"__proto__"` key survives as data.
 * Iterative to cope with very deep documents.
 */
export function sortKeysDeep(value: unknown): unknown {
  if (!isPlainObject(value) && !Array.isArray(value)) return value;

  const cloneShallow = (v: unknown): unknown => {
    if (Array.isArray(v)) return new Array<unknown>(v.length);
    if (isPlainObject(v)) return Object.create(null) as Record<string, unknown>;
    return v;
  };

  const root = cloneShallow(value);
  const work: Array<{ src: unknown; dst: unknown }> = [{ src: value, dst: root }];

  while (work.length > 0) {
    const item = work.pop();
    if (!item) break;
    const { src, dst } = item;
    if (Array.isArray(src) && Array.isArray(dst)) {
      for (let k = 0; k < src.length; k++) {
        const child = src[k];
        const copy = cloneShallow(child);
        dst[k] = copy;
        if (copy !== child) work.push({ src: child, dst: copy });
      }
    } else if (isPlainObject(src) && isPlainObject(dst)) {
      const keys = Object.keys(src).sort();
      for (const key of keys) {
        const child = src[key];
        const copy = cloneShallow(child);
        dst[key] = copy;
        if (copy !== child) work.push({ src: child, dst: copy });
      }
    }
  }
  return root;
}

export function stringifyJson(value: unknown, indent: JsonIndent | 0): string {
  const space = indent === 'tab' ? '\t' : indent;
  return JSON.stringify(value, null, space);
}

export function formatJson(text: string, options: FormatOptions): JsonTransformResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  const value = options.sortKeys ? sortKeysDeep(parsed.value) : parsed.value;
  return { ok: true, output: stringifyJson(value, options.indent), value };
}

export function minifyJson(text: string, options: { sortKeys: boolean }): JsonTransformResult {
  const parsed = parseJson(text);
  if (!parsed.ok) return parsed;
  const value = options.sortKeys ? sortKeysDeep(parsed.value) : parsed.value;
  return { ok: true, output: stringifyJson(value, 0), value };
}

export interface JsonStats {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  keys: number;
  depth: number;
}

/** Counts object keys and nesting depth of a parsed value (iterative). */
export function getJsonStats(value: unknown): JsonStats {
  const type: JsonStats['type'] =
    value === null ? 'null' : Array.isArray(value) ? 'array' : (typeof value as JsonStats['type']);
  let keys = 0;
  let depth = 0;
  const work: Array<{ v: unknown; d: number }> = [{ v: value, d: 0 }];
  while (work.length > 0) {
    const item = work.pop();
    if (!item) break;
    const { v, d } = item;
    if (Array.isArray(v)) {
      depth = Math.max(depth, d + 1);
      for (const child of v) work.push({ v: child, d: d + 1 });
    } else if (isPlainObject(v)) {
      depth = Math.max(depth, d + 1);
      const k = Object.keys(v);
      keys += k.length;
      for (const key of k) work.push({ v: v[key], d: d + 1 });
    }
  }
  return { type, keys, depth };
}

/** Returns the full text of `line` (1-based) for showing context around an error. */
export function getLine(text: string, line: number): string {
  let current = 1;
  let start = 0;
  for (let i = 0; i < text.length && current < line; i++) {
    if (text.charCodeAt(i) === 0x0a) {
      current++;
      start = i + 1;
    }
  }
  if (current !== line) return '';
  let end = text.indexOf('\n', start);
  if (end === -1) end = text.length;
  return text.slice(start, end).replace(/\r$/, '');
}
