import { describe, it, expect } from 'vitest';
import {
  MAX_JSON_INPUT_BYTES,
  cleanJsonErrorMessage,
  describeJsonError,
  extractLocationFromMessage,
  findJsonErrorOffset,
  formatJson,
  getJsonStats,
  getLine,
  isWithinSizeLimit,
  lineColumnToPosition,
  minifyJson,
  parseJson,
  positionToLineColumn,
  sortKeysDeep,
  utf8ByteLength,
} from '../../utils/tools/jsonFormat';

describe('jsonFormat', () => {
  describe('formatJson', () => {
    const input = '{"b":1,"a":[1,2,{"d":true,"c":null}]}';

    it('formats with 2 spaces', () => {
      const r = formatJson(input, { indent: 2, sortKeys: false });
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.output).toBe(JSON.stringify(JSON.parse(input), null, 2));
    });

    it('formats with 4 spaces and tabs', () => {
      const four = formatJson('{"a":1}', { indent: 4, sortKeys: false });
      const tab = formatJson('{"a":1}', { indent: 'tab', sortKeys: false });
      expect(four.ok && four.output).toBe('{\n    "a": 1\n}');
      expect(tab.ok && tab.output).toBe('{\n\t"a": 1\n}');
    });

    it('sorts keys recursively but keeps array order', () => {
      const r = formatJson(input, { indent: 2, sortKeys: true });
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.output).toBe(
          JSON.stringify({ a: [1, 2, { c: null, d: true }], b: 1 }, null, 2)
        );
      }
    });

    it('minifies', () => {
      const r = minifyJson('{\n  "a" : [ 1 , 2 ],\n  "b" : "x y"\n}', { sortKeys: false });
      expect(r.ok && r.output).toBe('{"a":[1,2],"b":"x y"}');
    });

    it('minifies with sorted keys', () => {
      const r = minifyJson('{"z":{"y":1,"x":2},"a":0}', { sortKeys: true });
      expect(r.ok && r.output).toBe('{"a":0,"z":{"x":2,"y":1}}');
    });

    it('handles top-level primitives', () => {
      expect(formatJson('"hi"', { indent: 2, sortKeys: true })).toMatchObject({ ok: true, output: '"hi"' });
      expect(formatJson('42', { indent: 2, sortKeys: false })).toMatchObject({ ok: true, output: '42' });
      expect(formatJson('null', { indent: 2, sortKeys: false })).toMatchObject({ ok: true, output: 'null' });
    });

    it('preserves unicode', () => {
      const r = minifyJson('{ "msg": "héllo 👋" }', { sortKeys: false });
      expect(r.ok && r.output).toBe('{"msg":"héllo 👋"}');
    });
  });

  describe('sortKeysDeep', () => {
    it('keeps a "__proto__" key as data instead of changing the prototype', () => {
      const parsed = JSON.parse('{"b":1,"__proto__":{"polluted":true}}') as unknown;
      const sorted = sortKeysDeep(parsed) as Record<string, unknown>;
      expect(Object.keys(sorted)).toEqual(['__proto__', 'b']);
      expect(JSON.stringify(sorted)).toBe('{"__proto__":{"polluted":true},"b":1}');
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('does not mutate its input', () => {
      const value = { b: { d: 1, c: 2 }, a: [3, 2, 1] };
      const copy = JSON.parse(JSON.stringify(value)) as unknown;
      sortKeysDeep(value);
      expect(value).toEqual(copy);
    });

    it('copes with very deep nesting', () => {
      const depth = 20000;
      const deep = '['.repeat(depth) + ']'.repeat(depth);
      const value = JSON.parse(deep) as unknown;
      expect(() => sortKeysDeep(value)).not.toThrow();
    });
  });

  describe('errors', () => {
    it('reports empty input', () => {
      const r = parseJson('   ');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe('Input is empty');
    });

    it('gives line and column for a missing value', () => {
      const text = '{\n  "a": 1,\n  "b": }';
      const r = parseJson(text);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error.line).toBe(3);
        expect(r.error.column).toBe(8);
        expect(r.error.position).toBe(text.indexOf('}'));
      }
    });

    it('locates a trailing comma', () => {
      const text = '[1, 2, ]';
      const r = parseJson(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect({ line: r.error.line, column: r.error.column }).toEqual({ line: 1, column: 8 });
    });

    it('locates unexpected end of input', () => {
      const text = '{"a": [1, 2';
      const r = parseJson(text);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.position).toBe(text.length);
    });

    it('parses V8 messages with line/column', () => {
      const text = '{\n"a" 1}';
      const loc = extractLocationFromMessage(
        "Expected ':' after property name in JSON at position 6 (line 2 column 5)",
        text
      );
      expect(loc).toEqual({ position: 6, line: 2, column: 5 });
    });

    it('parses old V8 messages with only a position', () => {
      const text = '{\n"a" 1}';
      expect(extractLocationFromMessage('Unexpected number in JSON at position 6', text)).toEqual({
        position: 6,
        line: 2,
        column: 5,
      });
    });

    it('parses Firefox messages', () => {
      const text = '{\n"a" 1}';
      expect(
        extractLocationFromMessage(
          "JSON.parse: expected ':' after property name in object at line 2 column 5 of the JSON data",
          text
        )
      ).toEqual({ position: 6, line: 2, column: 5 });
    });

    it('falls back to its own scanner for Safari-style messages', () => {
      const text = '{\n"a" 1}';
      expect(extractLocationFromMessage("JSON Parse error: Expected ':' before value in object property definition", text)).toBeNull();
      const info = describeJsonError("JSON Parse error: Expected ':' before value in object property definition", text);
      expect(info).toMatchObject({ position: 6, line: 2, column: 5 });
      expect(info.message).toBe("Expected ':' before value in object property definition");
    });

    it('cleans engine prefixes and location suffixes', () => {
      expect(cleanJsonErrorMessage("Expected ',' or '}' after property value in JSON at position 9 (line 1 column 10)")).toBe(
        "Expected ',' or '}' after property value"
      );
      expect(cleanJsonErrorMessage('JSON.parse: unexpected character at line 1 column 2 of the JSON data')).toBe('Unexpected character');
      expect(cleanJsonErrorMessage('Unexpected token } in JSON at position 5')).toBe('Unexpected token }');
      expect(cleanJsonErrorMessage('')).toBe('Invalid JSON');
    });
  });

  describe('findJsonErrorOffset', () => {
    const valid = [
      '{}',
      '[]',
      ' { "a" : [ 1, -2.5e+3, true, false, null, "x\\u00e9\\n" ] } ',
      '0',
      '-0.1E-2',
      '"\\"\\\\\\/\\b\\f\\n\\r\\t"',
      '[[[[]]]]',
      '{"a":{"b":{"c":{}}}}',
    ];
    it.each(valid)('accepts valid JSON %s', (text) => {
      expect(() => JSON.parse(text)).not.toThrow();
      expect(findJsonErrorOffset(text)).toBeNull();
    });

    const invalid: Array<[string, number]> = [
      ['', 0],
      ['{', 1],
      ['{"a" 1}', 5],
      ['{"a":}', 5],
      ['[1,]', 3],
      ['{"a":1,}', 7],
      ["{'a':1}", 1],
      ['01', 1],
      ['1.', 2],
      ['1e', 2],
      ['-', 1],
      ['tru', 3],
      ['nul!', 3],
      ['"abc', 4],
      ['"a\\x"', 3],
      ['"\\u12G4"', 5],
      ['"a\nb"', 2],
      ['[1] [2]', 4],
      ['{"a":1]', 6],
      ['[1}', 2],
      ['NaN', 0],
    ];
    it.each(invalid)('rejects %j at offset %i', (text, offset) => {
      expect(() => JSON.parse(text)).toThrow();
      expect(findJsonErrorOffset(text)).toBe(offset);
    });

    it('handles very deep nesting without a stack overflow', () => {
      const depth = 100000;
      expect(findJsonErrorOffset('['.repeat(depth) + ']'.repeat(depth))).toBeNull();
      expect(findJsonErrorOffset('['.repeat(depth))).toBe(depth);
    });
  });

  describe('positions', () => {
    it('converts between offsets and line/column', () => {
      const text = 'ab\ncd\n\nef';
      expect(positionToLineColumn(text, 0)).toEqual({ line: 1, column: 1 });
      expect(positionToLineColumn(text, 4)).toEqual({ line: 2, column: 2 });
      expect(positionToLineColumn(text, 7)).toEqual({ line: 4, column: 1 });
      expect(lineColumnToPosition(text, 2, 2)).toBe(4);
      expect(lineColumnToPosition(text, 4, 1)).toBe(7);
    });

    it('returns a line for context', () => {
      expect(getLine('a\r\nbb\nccc', 2)).toBe('bb');
      expect(getLine('a\r\nbb\nccc', 1)).toBe('a');
      expect(getLine('a', 5)).toBe('');
    });
  });

  describe('size', () => {
    it('counts UTF-8 bytes', () => {
      expect(utf8ByteLength('abc')).toBe(3);
      expect(utf8ByteLength('é')).toBe(2);
      expect(utf8ByteLength('€')).toBe(3);
      expect(utf8ByteLength('👋')).toBe(4);
      expect(utf8ByteLength('héllo 👋')).toBe(new TextEncoder().encode('héllo 👋').length);
    });

    it('enforces the 5 MB limit', () => {
      expect(MAX_JSON_INPUT_BYTES).toBe(5 * 1024 * 1024);
      expect(isWithinSizeLimit('x'.repeat(1000))).toBe(true);
      expect(isWithinSizeLimit('x'.repeat(MAX_JSON_INPUT_BYTES))).toBe(true);
      expect(isWithinSizeLimit('x'.repeat(MAX_JSON_INPUT_BYTES + 1))).toBe(false);
      expect(isWithinSizeLimit('é'.repeat(MAX_JSON_INPUT_BYTES / 2 + 1))).toBe(false);
    });
  });

  it('computes stats', () => {
    expect(getJsonStats(JSON.parse('{"a":{"b":[1,{"c":2}]},"d":3}') as unknown)).toEqual({ type: 'object', keys: 4, depth: 4 });
    expect(getJsonStats(null)).toEqual({ type: 'null', keys: 0, depth: 0 });
    expect(getJsonStats([])).toEqual({ type: 'array', keys: 0, depth: 1 });
  });
});
