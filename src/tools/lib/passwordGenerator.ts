/**
 * Cryptographically secure password generation.
 *
 * Every random choice goes through `crypto.getRandomValues` with rejection sampling,
 * so each character in a pool is exactly equally likely (a plain `value % n` would
 * slightly favour the first characters of the pool). `Math.random` is never used.
 */

export const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

export type CharacterSetName = keyof typeof CHARACTER_SETS;

/** Characters that are easy to confuse when a password is read or typed by hand. */
export const AMBIGUOUS_CHARACTERS = 'Il1O0o|';

export const MIN_PASSWORD_LENGTH = 4;
export const MAX_PASSWORD_LENGTH = 128;

export interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous?: boolean;
}

/** Returns a uniformly distributed integer in [0, max). */
export type RandomIntFn = (max: number) => number;

const UINT32_RANGE = 2 ** 32;

/**
 * Uniform random integer in [0, max) from the Web Crypto CSPRNG.
 *
 * Values at or above the largest multiple of `max` that fits in 32 bits are discarded
 * and redrawn, which removes modulo bias entirely.
 */
export const secureRandomInt: RandomIntFn = (max) => {
  if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
    throw new RangeError(`max must be an integer in 1..2^32, got ${max}`);
  }
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== 'function') {
    throw new Error('Secure random number generation is not available in this browser.');
  }

  const limit = UINT32_RANGE - (UINT32_RANGE % max);
  const buffer = new Uint32Array(1);
  // Expected iterations < 2 for any max; the loop terminates with probability 1.
  for (;;) {
    cryptoApi.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
};

const removeAmbiguous = (chars: string): string =>
  Array.from(chars)
    .filter((c) => !AMBIGUOUS_CHARACTERS.includes(c))
    .join('');

/** The character pools selected by `options`, in a stable order. */
export const getSelectedPools = (options: PasswordOptions): string[] => {
  const names: CharacterSetName[] = ['uppercase', 'lowercase', 'numbers', 'symbols'];
  return names
    .filter((name) => options[name])
    .map((name) => (options.excludeAmbiguous ? removeAmbiguous(CHARACTER_SETS[name]) : CHARACTER_SETS[name]))
    .filter((pool) => pool.length > 0);
};

export class PasswordOptionsError extends Error {}

/**
 * Generates a password that contains at least one character from every selected set.
 *
 * One character is drawn from each selected pool, the rest from the combined pool, and
 * the result is shuffled with Fisher-Yates so the guaranteed characters do not sit at
 * predictable positions.
 */
export const generatePassword = (options: PasswordOptions, randomInt: RandomIntFn = secureRandomInt): string => {
  const pools = getSelectedPools(options);
  if (pools.length === 0) {
    throw new PasswordOptionsError('Select at least one character type.');
  }

  const length = Math.trunc(options.length);
  if (!Number.isFinite(length) || length < MIN_PASSWORD_LENGTH || length > MAX_PASSWORD_LENGTH) {
    throw new PasswordOptionsError(
      `Length must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters.`
    );
  }
  if (length < pools.length) {
    throw new PasswordOptionsError(`Length must be at least ${pools.length} to include every selected type.`);
  }

  const combined = pools.join('');
  const chars: string[] = pools.map((pool) => pool[randomInt(pool.length)]);
  while (chars.length < length) {
    chars.push(combined[randomInt(combined.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';

export interface PasswordStrength {
  /** Entropy of the generation process in bits: length * log2(pool size). */
  entropyBits: number;
  level: StrengthLevel;
  label: string;
  /** 1-5, for the meter. */
  score: number;
}

/**
 * Strength of a password produced by `generatePassword` with these options.
 *
 * This measures the generator's entropy, which is the honest figure for a random
 * password; pattern-based estimators are for human-chosen passwords.
 */
export const estimateStrength = (options: PasswordOptions): PasswordStrength => {
  const poolSize = new Set(getSelectedPools(options).join('')).size;
  const entropyBits = poolSize > 1 ? Math.trunc(options.length) * Math.log2(poolSize) : 0;

  if (entropyBits < 40) return { entropyBits, level: 'weak', label: 'Weak', score: 1 };
  if (entropyBits < 60) return { entropyBits, level: 'fair', label: 'Fair', score: 2 };
  if (entropyBits < 80) return { entropyBits, level: 'good', label: 'Good', score: 3 };
  if (entropyBits < 128) return { entropyBits, level: 'strong', label: 'Strong', score: 4 };
  return { entropyBits, level: 'very-strong', label: 'Very strong', score: 5 };
};
