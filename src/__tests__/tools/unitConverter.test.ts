import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  CATEGORY_IDS,
  convert,
  convertTemperature,
  formatResult,
  parseNumericInput,
} from '../../tools/lib/unitConverter';

describe('temperature (affine, not linear)', () => {
  it.each([
    [0, 'celsius', 'fahrenheit', 32],
    [100, 'celsius', 'fahrenheit', 212],
    [-40, 'celsius', 'fahrenheit', -40],
    [32, 'fahrenheit', 'celsius', 0],
    [0, 'celsius', 'kelvin', 273.15],
    [0, 'kelvin', 'celsius', -273.15],
    [0, 'kelvin', 'rankine', 0],
    [491.67, 'rankine', 'celsius', 0],
    [212, 'fahrenheit', 'kelvin', 373.15],
    [0, 'fahrenheit', 'rankine', 459.67],
  ])('%s %s -> %s = %s', (value, from, to, expected) => {
    expect(convertTemperature(value as number, from as string, to as string)).toBeCloseTo(expected as number, 9);
  });
});

describe('linear conversions use exact definitions', () => {
  it.each([
    [1, 'length', 'mile', 'meter', 1609.344],
    [1, 'length', 'foot', 'inch', 12],
    [1, 'length', 'yard', 'foot', 3],
    [1, 'weight', 'pound', 'ounce', 16],
    [1, 'weight', 'stone', 'pound', 14],
    [1, 'weight', 'kilogram', 'pound', 2.2046226218],
    [1, 'volume', 'gallon', 'fluidOunce', 128],
    [1, 'volume', 'cup', 'tablespoon', 16],
    [1, 'volume', 'tablespoon', 'teaspoon', 3],
    [1, 'volume', 'cubicMeter', 'liter', 1000],
    [1, 'area', 'acre', 'squareFoot', 43560],
    [1, 'area', 'squareMile', 'acre', 640],
    [1, 'speed', 'kilometerPerHour', 'meterPerSecond', 1 / 3.6],
    [1, 'speed', 'knot', 'kilometerPerHour', 1.852],
    [1, 'time', 'day', 'hour', 24],
    [1, 'energy', 'kilowattHour', 'joule', 3.6e6],
    [1, 'energy', 'kilocalorie', 'calorie', 1000],
    [1, 'data', 'gibibyte', 'mebibyte', 1024],
    [1, 'data', 'byte', 'bit', 8],
  ] as const)('%s %s: %s -> %s', (value, category, from, to, expected) => {
    expect(convert(value, category, from, to)).toBeCloseTo(expected, 9);
  });

  it('round-trips every unit pair in every category', () => {
    for (const category of CATEGORY_IDS) {
      const keys = Object.keys(CATEGORIES[category].units);
      for (const a of keys) {
        for (const b of keys) {
          const there = convert(123.456, category, a, b);
          expect(convert(there, category, b, a)).toBeCloseTo(123.456, 6);
        }
      }
    }
  });
});

describe('parseNumericInput', () => {
  it.each([
    ['12', 12],
    ['-3.5', -3.5],
    ['+7', 7],
    ['.5', 0.5],
    ['1.2e6', 1.2e6],
    ['1,000,000', 1e6],
    [' 42 ', 42],
  ])('parses %s', (raw, expected) => {
    expect(parseNumericInput(raw)).toBe(expected);
  });

  it.each([[''], ['abc'], ['1.2.3'], ['1e'], ['--1'], ['Infinity'], ['NaN']])('rejects %s', (raw) => {
    expect(parseNumericInput(raw)).toBeNull();
  });
});

describe('formatResult', () => {
  it('hides floating point noise', () => {
    expect(formatResult(0.1 + 0.2)).toBe('0.3');
  });

  it('never uses locale separators (so the value can be typed back in)', () => {
    expect(formatResult(1609344)).toBe('1609344');
    expect(parseNumericInput(formatResult(1609344))).toBe(1609344);
  });

  it('uses exponents for extremes', () => {
    expect(formatResult(1e20)).toBe('1e+20');
    expect(formatResult(1.5e-12)).toBe('1.5e-12');
  });

  it('returns empty for non-finite', () => {
    expect(formatResult(Number.NaN)).toBe('');
  });
});
