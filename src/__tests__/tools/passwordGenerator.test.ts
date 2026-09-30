import { describe, it, expect, vi } from 'vitest';
import {
  AMBIGUOUS_CHARACTERS,
  CHARACTER_SETS,
  PasswordOptions,
  PasswordOptionsError,
  estimateStrength,
  generatePassword,
  secureRandomInt,
} from '../../tools/lib/passwordGenerator';

const ALL: PasswordOptions = { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true };

describe('secureRandomInt', () => {
  it('returns integers within [0, max)', () => {
    for (let i = 0; i < 500; i++) {
      const n = secureRandomInt(7);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it('rejects values in the biased tail instead of taking them modulo max', () => {
    // For max = 3, the accepted range is [0, 2^32 - 1): 2^32 - 1 must be redrawn.
    const values = [0xffffffff, 5];
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((arr) => {
      (arr as unknown as Uint32Array)[0] = values.shift() as number;
      return arr;
    });
    expect(secureRandomInt(3)).toBe(5 % 3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('never uses Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    generatePassword(ALL);
    expect(spy).not.toHaveBeenCalled();
  });

  it('throws for invalid bounds', () => {
    expect(() => secureRandomInt(0)).toThrow(RangeError);
    expect(() => secureRandomInt(1.5)).toThrow(RangeError);
  });
});

describe('generatePassword', () => {
  it('produces the requested length', () => {
    for (const length of [4, 16, 64, 128]) {
      expect(generatePassword({ ...ALL, length })).toHaveLength(length);
    }
  });

  it('always includes at least one character from every selected set', () => {
    for (let i = 0; i < 200; i++) {
      const pwd = generatePassword({ ...ALL, length: 4 });
      for (const set of Object.values(CHARACTER_SETS)) {
        expect([...pwd].some((c) => set.includes(c))).toBe(true);
      }
    }
  });

  it('only uses characters from selected sets', () => {
    const pwd = generatePassword({ length: 64, uppercase: false, lowercase: false, numbers: true, symbols: false });
    expect(pwd).toMatch(/^\d{64}$/);
  });

  it('excludes ambiguous characters when asked', () => {
    for (let i = 0; i < 50; i++) {
      const pwd = generatePassword({ ...ALL, length: 128, excludeAmbiguous: true });
      expect([...pwd].some((c) => AMBIGUOUS_CHARACTERS.includes(c))).toBe(false);
    }
  });

  it('rejects when no set is selected or the length is out of range', () => {
    expect(() =>
      generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: false, symbols: false })
    ).toThrow(PasswordOptionsError);
    expect(() => generatePassword({ ...ALL, length: 3 })).toThrow(PasswordOptionsError);
    expect(() => generatePassword({ ...ALL, length: 129 })).toThrow(PasswordOptionsError);
  });
});

describe('estimateStrength', () => {
  it('computes entropy as length * log2(pool)', () => {
    const digits = estimateStrength({ length: 10, uppercase: false, lowercase: false, numbers: true, symbols: false });
    expect(digits.entropyBits).toBeCloseTo(10 * Math.log2(10), 5);
    expect(digits.level).toBe('weak');
  });

  it('rates a 16-char full-charset password as strong', () => {
    expect(estimateStrength(ALL).level).toBe('strong');
  });
});
