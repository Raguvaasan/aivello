import { describe, it, expect } from 'vitest';
import {
  PALETTE_TYPES,
  contrastRatio,
  generatePalette,
  hexToRgb,
  hslToHex,
  normalizeHex,
  readableTextColor,
  rgbToHsl,
} from '../../tools/lib/colorPalette';

const HEX = /^#[0-9a-f]{6}$/;

describe('hex parsing', () => {
  it('normalises short and long forms', () => {
    expect(normalizeHex('#38F')).toBe('#3388ff');
    expect(normalizeHex('3B82F6')).toBe('#3b82f6');
    expect(normalizeHex('#12345')).toBeNull();
    expect(normalizeHex('red')).toBeNull();
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('hsl conversion', () => {
  it('round-trips primaries', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00');
  });

  it('wraps negative hues and clamps out-of-range lightness instead of producing invalid hex', () => {
    expect(hslToHex({ h: -120, s: 100, l: 50 })).toBe(hslToHex({ h: 240, s: 100, l: 50 }));
    expect(hslToHex({ h: 0, s: 50, l: 140 })).toBe('#ffffff');
  });
});

describe('generatePalette', () => {
  it.each(PALETTE_TYPES.map((t) => [t.id]))('%s yields five valid colours including the base', (type) => {
    for (const base of ['#3b82f6', '#000000', '#ffffff', '#fafafa', '#ff0000']) {
      const palette = generatePalette(base, type);
      expect(palette).toHaveLength(5);
      palette.forEach((c) => expect(c.hex).toMatch(HEX));
      expect(palette.map((c) => c.hex)).toContain(base);
    }
  });

  it('monochromatic swatches are distinct', () => {
    const hexes = generatePalette('#3b82f6', 'monochromatic').map((c) => c.hex);
    expect(new Set(hexes).size).toBe(5);
  });

  it('returns nothing for invalid input', () => {
    expect(generatePalette('nope', 'triadic')).toEqual([]);
  });
});

describe('contrast', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 5);
    expect(readableTextColor('#ffff00')).toBe('#000000');
    expect(readableTextColor('#000080')).toBe('#ffffff');
  });
});
