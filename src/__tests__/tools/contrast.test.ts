import { describe, it, expect } from 'vitest';
import {
  normalizeHex,
  isValidHex,
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  contrastRatioHex,
  formatRatio,
  evaluateContrast,
  rgbToHsl,
  hslToRgb,
  suggestPassingColor,
  WCAG_CHECKS,
} from '../../utils/tools/contrast';

describe('normalizeHex', () => {
  it('expands 3-digit shorthand and lowercases', () => {
    expect(normalizeHex('#FFF')).toBe('#ffffff');
    expect(normalizeHex('#a1B')).toBe('#aa11bb');
  });

  it('accepts 6-digit values with or without #', () => {
    expect(normalizeHex('#7C3AED')).toBe('#7c3aed');
    expect(normalizeHex('7c3aed')).toBe('#7c3aed');
    expect(normalizeHex('  #000000 ')).toBe('#000000');
  });

  it('rejects malformed input', () => {
    for (const bad of ['', '#', '#ff', '#ffff', '#fffff', '#fffffff', '#ggg', 'red', '#12345g', 'rgb(0,0,0)']) {
      expect(normalizeHex(bad)).toBeNull();
      expect(isValidHex(bad)).toBe(false);
    }
  });
});

describe('hex <-> rgb', () => {
  it('parses channels', () => {
    expect(hexToRgb('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('nope')).toBeNull();
  });

  it('formats and clamps', () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe('#ff8000');
    expect(rgbToHex({ r: 300, g: -5, b: 15.6 })).toBe('#ff0010');
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it('weights green most, blue least', () => {
    const r = relativeLuminance({ r: 255, g: 0, b: 0 });
    const g = relativeLuminance({ r: 0, g: 255, b: 0 });
    const b = relativeLuminance({ r: 0, g: 0, b: 255 });
    expect(r).toBeCloseTo(0.2126, 4);
    expect(g).toBeCloseTo(0.7152, 4);
    expect(b).toBeCloseTo(0.0722, 4);
  });

  it('uses the linear segment for very dark channels', () => {
    // 10/255 is below the 0.04045 threshold: c / 12.92
    expect(relativeLuminance({ r: 10, g: 10, b: 10 })).toBeCloseTo(10 / 255 / 12.92, 10);
  });
});

describe('contrastRatio', () => {
  it('black on white is 21:1', () => {
    expect(contrastRatioHex('#000', '#fff')).toBeCloseTo(21, 10);
    expect(formatRatio(contrastRatioHex('#000000', '#ffffff') as number)).toBe('21.00:1');
  });

  it('identical colours are 1:1', () => {
    expect(contrastRatioHex('#7c3aed', '#7c3aed')).toBeCloseTo(1, 10);
  });

  it('is symmetric', () => {
    expect(contrastRatioHex('#123456', '#fedcba')).toBeCloseTo(contrastRatioHex('#fedcba', '#123456') as number, 12);
  });

  it('#777 on white is ~4.48 (famously just fails AA)', () => {
    const ratio = contrastRatioHex('#777', '#fff') as number;
    expect(ratio).toBeCloseTo(4.48, 2);
    expect(evaluateContrast(ratio).aaNormal).toBe(false);
    expect(evaluateContrast(ratio).aaLarge).toBe(true);
  });

  it('matches other published reference values', () => {
    expect(contrastRatioHex('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(contrastRatioHex('#595959', '#ffffff')).toBeCloseTo(7.0, 1);
    expect(contrastRatio({ r: 255, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(4.0, 2);
  });

  it('returns null for invalid hex', () => {
    expect(contrastRatioHex('#zzz', '#fff')).toBeNull();
  });
});

describe('formatRatio', () => {
  it('truncates rather than rounds up', () => {
    expect(formatRatio(4.4999)).toBe('4.49:1');
    expect(formatRatio(4.5)).toBe('4.50:1');
    expect(formatRatio(1)).toBe('1.00:1');
  });
});

describe('evaluateContrast', () => {
  it('applies every WCAG threshold inclusively', () => {
    expect(evaluateContrast(21)).toEqual({ aaNormal: true, aaLarge: true, aaaNormal: true, aaaLarge: true, uiComponents: true });
    expect(evaluateContrast(1)).toEqual({ aaNormal: false, aaLarge: false, aaaNormal: false, aaaLarge: false, uiComponents: false });
    expect(evaluateContrast(4.5)).toEqual({ aaNormal: true, aaLarge: true, aaaNormal: false, aaaLarge: true, uiComponents: true });
    expect(evaluateContrast(3)).toEqual({ aaNormal: false, aaLarge: true, aaaNormal: false, aaaLarge: false, uiComponents: true });
    expect(evaluateContrast(7)).toEqual({ aaNormal: true, aaLarge: true, aaaNormal: true, aaaLarge: true, uiComponents: true });
    expect(evaluateContrast(6.99).aaaNormal).toBe(false);
  });

  it('defines the five standard checks', () => {
    expect(WCAG_CHECKS.map((c) => [c.id, c.threshold])).toEqual([
      ['aaNormal', 4.5],
      ['aaLarge', 3],
      ['aaaNormal', 7],
      ['aaaLarge', 4.5],
      ['uiComponents', 3],
    ]);
  });
});

describe('hsl conversion', () => {
  it('round-trips representative colours', () => {
    for (const hex of ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#7c3aed', '#db2777', '#808080']) {
      const rgb = hexToRgb(hex)!;
      expect(rgbToHex(hslToRgb(rgbToHsl(rgb)))).toBe(hex);
    }
  });

  it('reports known HSL values', () => {
    const red = rgbToHsl({ r: 255, g: 0, b: 0 });
    expect(red.h).toBeCloseTo(0);
    expect(red.s).toBeCloseTo(100);
    expect(red.l).toBeCloseTo(50);
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });
});

describe('suggestPassingColor', () => {
  it('returns the colour unchanged when it already passes', () => {
    expect(suggestPassingColor('#000', '#fff')).toBe('#000000');
  });

  it('nudges #777 on white just far enough darker to pass AA', () => {
    const suggestion = suggestPassingColor('#777777', '#ffffff')!;
    expect(suggestion).not.toBeNull();
    const ratio = contrastRatioHex(suggestion, '#ffffff')!;
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(4.8);
    // stays grey
    const { r, g, b } = hexToRgb(suggestion)!;
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it('lightens on dark backgrounds', () => {
    const suggestion = suggestPassingColor('#444444', '#111111')!;
    expect(contrastRatioHex(suggestion, '#111111')!).toBeGreaterThanOrEqual(4.5);
    expect(relativeLuminance(hexToRgb(suggestion)!)).toBeGreaterThan(relativeLuminance(hexToRgb('#444444')!));
  });

  it('keeps the hue of a saturated colour', () => {
    const suggestion = suggestPassingColor('#a78bfa', '#ffffff')!;
    expect(contrastRatioHex(suggestion, '#ffffff')!).toBeGreaterThanOrEqual(4.5);
    const before = rgbToHsl(hexToRgb('#a78bfa')!);
    const after = rgbToHsl(hexToRgb(suggestion)!);
    expect(Math.abs(after.h - before.h)).toBeLessThan(4);
  });

  it('works against a mid-grey background where either direction could win', () => {
    const suggestion = suggestPassingColor('#777777', '#777777')!;
    expect(contrastRatioHex(suggestion, '#777777')!).toBeGreaterThanOrEqual(4.5);
  });

  it('supports stricter targets', () => {
    const suggestion = suggestPassingColor('#777777', '#ffffff', 7)!;
    expect(contrastRatioHex(suggestion, '#ffffff')!).toBeGreaterThanOrEqual(7);
  });

  it('returns null for invalid input or impossible targets', () => {
    expect(suggestPassingColor('#xyz', '#fff')).toBeNull();
    expect(suggestPassingColor('#777', '#fff', 22)).toBeNull();
  });
});
