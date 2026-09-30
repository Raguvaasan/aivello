import { createHash, createHmac } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  HASH_ALGORITHMS,
  HASH_HEX_LENGTH,
  bufferToHex,
  compareWithExpected,
  guessAlgorithmFromLength,
  hashAll,
  hashText,
  hmacSha256Hex,
  isHexString,
  isSubtleCryptoAvailable,
  normalizeHash,
  textToBytes,
} from '../../utils/tools/hash';

const nodeAlg = (alg: string): string => alg.replace('-', '').toLowerCase();

describe('hash', () => {
  it('has Web Crypto available in the test runtime', () => {
    expect(isSubtleCryptoAvailable()).toBe(true);
  });

  it('computes the known SHA-256 of "abc"', async () => {
    expect(await hashText('SHA-256', 'abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('computes known digests of "abc" for every algorithm', async () => {
    const all = await hashAll(textToBytes('abc'));
    expect(all['SHA-1']).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(all['SHA-256']).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(all['SHA-384']).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7'
    );
    expect(all['SHA-512']).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
    );
  });

  it('hashes the empty string', async () => {
    expect(await hashText('SHA-256', '')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('matches node:crypto for unicode text', async () => {
    const text = 'héllo 👋 — 日本語';
    for (const alg of HASH_ALGORITHMS) {
      const expected = createHash(nodeAlg(alg)).update(text, 'utf8').digest('hex');
      const actual = await hashText(alg, text);
      expect(actual).toBe(expected);
      expect(actual).toHaveLength(HASH_HEX_LENGTH[alg]);
    }
  });

  it('hashes binary data (ArrayBuffer and Uint8Array)', async () => {
    const bytes = new Uint8Array(4096);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
    const expected = createHash('sha256').update(bytes).digest('hex');
    expect((await hashAll(bytes))['SHA-256']).toBe(expected);
    expect((await hashAll(bytes.buffer))['SHA-256']).toBe(expected);
  });

  describe('HMAC-SHA256', () => {
    it('matches RFC 4231 test case 2', async () => {
      expect(await hmacSha256Hex('Jefe', 'what do ya want for nothing?')).toBe(
        '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
      );
    });

    it('supports an empty key', async () => {
      expect(await hmacSha256Hex('', '')).toBe('b613679a0814d9ec772f95d778c35fc5ff1697c493715653c6c712144292c5ad');
      expect(await hmacSha256Hex('', 'abc')).toBe(createHmac('sha256', '').update('abc').digest('hex'));
    });

    it('matches node:crypto with unicode key and message', async () => {
      const key = 'clé 🔑';
      const msg = 'message héllo 👋';
      expect(await hmacSha256Hex(key, msg)).toBe(createHmac('sha256', key).update(msg).digest('hex'));
    });
  });

  it('formats hex in upper or lower case', () => {
    const bytes = new Uint8Array([0, 1, 15, 16, 171, 255]);
    expect(bufferToHex(bytes)).toBe('00010f10abff');
    expect(bufferToHex(bytes.buffer, true)).toBe('00010F10ABFF');
  });

  describe('compare with expected', () => {
    const results = {
      'SHA-1': 'a9993e364706816aba3e25717850c26c9cd0d89d',
      'SHA-256': 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    };

    it('normalizes pasted hashes', () => {
      expect(normalizeHash('  0xAB:CD-ef 12\n')).toBe('abcdef12');
      expect(isHexString('abcdef0123')).toBe(true);
      expect(isHexString('xyz')).toBe(false);
    });

    it('matches case-insensitively and names the algorithm', () => {
      expect(compareWithExpected(results['SHA-256'].toUpperCase(), results)).toEqual({ status: 'match', algorithm: 'SHA-256' });
      expect(compareWithExpected(` ${results['SHA-1']} `, results)).toEqual({ status: 'match', algorithm: 'SHA-1' });
    });

    it('reports mismatches with a guessed algorithm', () => {
      expect(compareWithExpected('0'.repeat(64), results)).toEqual({ status: 'mismatch', guessed: 'SHA-256' });
      expect(compareWithExpected('0'.repeat(32), results)).toEqual({ status: 'mismatch', guessed: 'MD5' });
      expect(compareWithExpected('abc', results)).toEqual({ status: 'mismatch', guessed: null });
    });

    it('handles empty and invalid input', () => {
      expect(compareWithExpected('   ', results)).toEqual({ status: 'empty' });
      expect(compareWithExpected('not-a-hash!', results).status).toBe('invalid');
    });

    it('guesses algorithms from length', () => {
      expect(guessAlgorithmFromLength('a'.repeat(40))).toBe('SHA-1');
      expect(guessAlgorithmFromLength('a'.repeat(96))).toBe('SHA-384');
      expect(guessAlgorithmFromLength('a'.repeat(128))).toBe('SHA-512');
      expect(guessAlgorithmFromLength('a'.repeat(10))).toBeNull();
    });
  });
});
