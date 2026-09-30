/**
 * WCAG 2.x colour-contrast maths.
 *
 * Relative luminance and contrast ratio follow the WCAG 2.2 definitions:
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  /** 0-360 */
  h: number;
  /** 0-100 */
  s: number;
  /** 0-100 */
  l: number;
}

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalises `#rgb` / `#rrggbb` (the leading `#` is optional) to lowercase `#rrggbb`.
 * Returns null for anything else.
 */
export function normalizeHex(input: string): string | null {
  const match = HEX_RE.exec(input.trim());
  if (!match) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return `#${hex}`;
}

export function isValidHex(input: string): boolean {
  return normalizeHex(input) !== null;
}

export function hexToRgb(input: string): RGB | null {
  const hex = normalizeHex(input);
  if (!hex) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

const clampByte = (n: number): number => Math.min(255, Math.max(0, Math.round(n)));

export function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map((c) => clampByte(c).toString(16).padStart(2, '0')).join('')}`;
}

function channelToLinear(channel: number): number {
  const c = clampByte(channel) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: RGB): number {
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

/** Contrast ratio between two colours, 1 to 21. Order does not matter. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastRatioHex(a: string, b: string): number | null {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  return contrastRatio(ra, rb);
}

/**
 * Formats a ratio for display, truncating (never rounding up) to two decimals so a
 * failing 4.497 is never shown as a passing-looking "4.50".
 */
export function formatRatio(ratio: number): string {
  const truncated = Math.floor(ratio * 100 + 1e-9) / 100;
  return `${truncated.toFixed(2)}:1`;
}

export type WcagCheckId = 'aaNormal' | 'aaLarge' | 'aaaNormal' | 'aaaLarge' | 'uiComponents';

export interface WcagCheck {
  id: WcagCheckId;
  label: string;
  description: string;
  threshold: number;
}

export const WCAG_CHECKS: readonly WcagCheck[] = [
  { id: 'aaNormal', label: 'AA normal text', description: 'Body text below 18pt (24px) / 14pt bold', threshold: 4.5 },
  { id: 'aaLarge', label: 'AA large text', description: '18pt (24px) and up, or 14pt (~18.7px) bold', threshold: 3 },
  { id: 'aaaNormal', label: 'AAA normal text', description: 'Enhanced contrast for body text', threshold: 7 },
  { id: 'aaaLarge', label: 'AAA large text', description: 'Enhanced contrast for large text', threshold: 4.5 },
  { id: 'uiComponents', label: 'UI components & graphics', description: 'Icons, borders, focus rings (WCAG 1.4.11)', threshold: 3 },
];

export type WcagResults = Record<WcagCheckId, boolean>;

export function evaluateContrast(ratio: number): WcagResults {
  const results = {} as WcagResults;
  for (const check of WCAG_CHECKS) {
    results[check.id] = ratio >= check.threshold;
  }
  return results;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = clampByte(r) / 255;
  const gn = clampByte(g) / 255;
  const bn = clampByte(b) / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case rn:
        h = ((gn - bn) / d) % 6;
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const hn = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = ln - c / 2;
  let rgb: [number, number, number];
  if (hn < 60) rgb = [c, x, 0];
  else if (hn < 120) rgb = [x, c, 0];
  else if (hn < 180) rgb = [0, c, x];
  else if (hn < 240) rgb = [0, x, c];
  else if (hn < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return {
    r: clampByte((rgb[0] + m) * 255),
    g: clampByte((rgb[1] + m) * 255),
    b: clampByte((rgb[2] + m) * 255),
  };
}

/**
 * Finds the colour closest to `foreground` (same hue and saturation, lightness nudged
 * darker or lighter - whichever needs the smaller change) that reaches `target`
 * contrast against `background`.
 *
 * Returns the normalised foreground unchanged when it already passes, and null only for
 * invalid input or an unreachable target (anything above 21).
 */
export function suggestPassingColor(foreground: string, background: string, target = 4.5): string | null {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  if (!fg || !bg || target > 21) return null;
  if (contrastRatio(fg, bg) >= target) return rgbToHex(fg);

  const hsl = rgbToHsl(fg);
  const STEP = 0.5;
  let best: { hex: string; delta: number } | null = null;

  for (const direction of [-1, 1] as const) {
    for (let delta = STEP; delta <= 100; delta += STEP) {
      const l = hsl.l + direction * delta;
      if (l < 0 || l > 100) break;
      const candidate = hslToRgb({ ...hsl, l });
      if (contrastRatio(candidate, bg) >= target) {
        if (!best || delta < best.delta) best = { hex: rgbToHex(candidate), delta };
        break;
      }
    }
  }

  if (best) return best.hex;

  // Lightness steps can skip the extremes by rounding; pure black/white are the fallbacks.
  const black: RGB = { r: 0, g: 0, b: 0 };
  const white: RGB = { r: 255, g: 255, b: 255 };
  const blackRatio = contrastRatio(black, bg);
  const whiteRatio = contrastRatio(white, bg);
  if (Math.max(blackRatio, whiteRatio) < target) return null;
  return blackRatio >= whiteRatio ? '#000000' : '#ffffff';
}
