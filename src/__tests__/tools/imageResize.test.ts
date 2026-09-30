import { describe, it, expect } from 'vitest';
import {
  linkedDimension,
  scaleByPercent,
  computeTargetSize,
  qualityToUnit,
  sizeChangePercent,
  formatFromMime,
  OUTPUT_FORMATS,
  MAX_DIMENSION,
  type Size,
} from '../../utils/tools/imageResize';

const photo: Size = { width: 4000, height: 3000 };

const sizeOf = (...args: Parameters<typeof computeTargetSize>) => {
  const result = computeTargetSize(...args);
  if (!result.ok) throw new Error(result.error);
  return result.size;
};

const errorOf = (...args: Parameters<typeof computeTargetSize>) => {
  const result = computeTargetSize(...args);
  if (result.ok) throw new Error('expected failure');
  return result.error;
};

describe('linkedDimension', () => {
  it('keeps the aspect ratio in both directions', () => {
    expect(linkedDimension('width', 800, photo)).toBe(600);
    expect(linkedDimension('height', 600, photo)).toBe(800);
    expect(linkedDimension('width', 1000, { width: 1920, height: 1080 })).toBe(563);
  });

  it('never returns less than 1px', () => {
    expect(linkedDimension('width', 1, { width: 5000, height: 10 })).toBe(1);
    expect(linkedDimension('width', 0, photo)).toBe(1);
    expect(linkedDimension('width', Number.NaN, photo)).toBe(1);
    expect(linkedDimension('width', 10, { width: 0, height: 0 })).toBe(1);
  });
});

describe('scaleByPercent', () => {
  it('scales and rounds', () => {
    expect(scaleByPercent(photo, 50)).toEqual({ width: 2000, height: 1500 });
    expect(scaleByPercent({ width: 333, height: 101 }, 33)).toEqual({ width: 110, height: 33 });
    expect(scaleByPercent({ width: 10, height: 10 }, 1)).toEqual({ width: 1, height: 1 });
  });
});

describe('computeTargetSize', () => {
  it('derives the missing side from the aspect ratio', () => {
    expect(sizeOf(photo, { mode: 'dimensions', width: 1200, height: null, lockAspect: true })).toEqual({ width: 1200, height: 900 });
    expect(sizeOf(photo, { mode: 'dimensions', width: null, height: 900, lockAspect: false })).toEqual({ width: 1200, height: 900 });
  });

  it('uses width when both sides are given and the aspect is locked', () => {
    expect(sizeOf(photo, { mode: 'dimensions', width: 1000, height: 123, lockAspect: true })).toEqual({ width: 1000, height: 750 });
  });

  it('honours free-form sizes when unlocked', () => {
    expect(sizeOf(photo, { mode: 'dimensions', width: 500, height: 500, lockAspect: false })).toEqual({ width: 500, height: 500 });
  });

  it('keeps the original size when nothing is entered', () => {
    expect(sizeOf(photo, { mode: 'dimensions', width: null, height: null, lockAspect: true })).toEqual(photo);
  });

  it('scales by percentage', () => {
    expect(sizeOf(photo, { mode: 'percentage', percent: 25 })).toEqual({ width: 1000, height: 750 });
    expect(sizeOf({ width: 100, height: 50 }, { mode: 'percentage', percent: 400 })).toEqual({ width: 400, height: 200 });
  });

  it('validates input', () => {
    expect(errorOf(photo, { mode: 'dimensions', width: 0, height: null, lockAspect: true })).toMatch(/Width/);
    expect(errorOf(photo, { mode: 'dimensions', width: 10.5, height: null, lockAspect: true })).toMatch(/whole number/);
    expect(errorOf(photo, { mode: 'dimensions', width: null, height: -3, lockAspect: false })).toMatch(/Height/);
    expect(errorOf(photo, { mode: 'percentage', percent: 0 })).toMatch(/between 1% and 400%/);
    expect(errorOf(photo, { mode: 'percentage', percent: 401 })).toMatch(/between/);
    expect(errorOf(photo, { mode: 'percentage', percent: Number.NaN })).toMatch(/between/);
    expect(errorOf({ width: 0, height: 0 }, { mode: 'percentage', percent: 50 })).toMatch(/no size/);
  });

  it('refuses outputs the browser cannot render', () => {
    expect(errorOf(photo, { mode: 'dimensions', width: MAX_DIMENSION + 1, height: null, lockAspect: false })).toMatch(/at most/);
    expect(errorOf(photo, { mode: 'percentage', percent: 400 })).toMatch(/at most/);
    expect(errorOf({ width: 11000, height: 11000 }, { mode: 'percentage', percent: 100 })).toMatch(/too large/);
  });
});

describe('quality and size helpers', () => {
  it('maps quality to 0-1', () => {
    expect(qualityToUnit(92)).toBe(0.92);
    expect(qualityToUnit(0)).toBe(0.01);
    expect(qualityToUnit(150)).toBe(1);
    expect(qualityToUnit(Number.NaN)).toBe(0.92);
  });

  it('reports size change', () => {
    expect(sizeChangePercent(1000, 580)).toBe(-42);
    expect(sizeChangePercent(1000, 1500)).toBe(50);
    expect(sizeChangePercent(0, 10)).toBe(0);
  });
});

describe('formats', () => {
  it('maps MIME types back to formats', () => {
    expect(formatFromMime('image/png')).toBe('png');
    expect(formatFromMime('image/jpeg')).toBe('jpeg');
    expect(formatFromMime('image/webp')).toBe('webp');
    expect(formatFromMime('image/gif')).toBeNull();
  });

  it('describes lossy and alpha support', () => {
    expect(OUTPUT_FORMATS.jpeg.alpha).toBe(false);
    expect(OUTPUT_FORMATS.png.lossy).toBe(false);
    expect(OUTPUT_FORMATS.webp.lossy && OUTPUT_FORMATS.webp.alpha).toBe(true);
    expect(OUTPUT_FORMATS.jpeg.extension).toBe('jpg');
  });
});
