export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface PaletteColor {
  hex: string;
  rgb: string;
  hsl: string;
}

export type PaletteType = 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split-complementary' | 'monochromatic';

export const PALETTE_TYPES: ReadonlyArray<{ id: PaletteType; label: string; description: string }> = [
  { id: 'complementary', label: 'Complementary', description: 'Colors opposite each other on the color wheel' },
  { id: 'analogous', label: 'Analogous', description: 'Neighbouring colors on the wheel' },
  { id: 'triadic', label: 'Triadic', description: 'Three colors evenly spaced around the wheel' },
  { id: 'tetradic', label: 'Tetradic', description: 'Four colors forming a square on the wheel' },
  { id: 'split-complementary', label: 'Split Complementary', description: 'A base plus the two neighbours of its complement' },
  { id: 'monochromatic', label: 'Monochromatic', description: 'Tints and shades of a single hue' },
];

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Wraps any hue (including negatives) into 0-359. */
export const normalizeHue = (h: number): number => ((Math.round(h) % 360) + 360) % 360;

/**
 * Normalises "#abc", "abc", "#AABBCC" or "aabbcc" to lowercase "#aabbcc".
 * Returns null for anything else.
 */
export const normalizeHex = (input: string): string | null => {
  const match = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(input.trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? Array.from(match[1], (c) => c + c).join('') : match[1];
  return `#${digits.toLowerCase()}`;
};

export const hexToRgb = (hex: string): Rgb | null => {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
};

export const rgbToHsl = ({ r, g, b }: Rgb): Hsl => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h /= 6;
  }

  return { h: normalizeHue(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

/** h in degrees (any value), s and l in percent (clamped to 0-100). */
export const hslToHex = ({ h, s, l }: Hsl): string => {
  const hue = normalizeHue(h);
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;
  const a = sat * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    const value = light - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(clamp(value, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
};

const makeColor = (hsl: Hsl): PaletteColor => {
  const h = normalizeHue(hsl.h);
  const s = Math.round(clamp(hsl.s, 0, 100));
  const l = Math.round(clamp(hsl.l, 0, 100));
  const hex = hslToHex({ h, s, l });
  // hexToRgb cannot fail on hslToHex output.
  const { r, g, b } = hexToRgb(hex) as Rgb;
  return { hex, rgb: `rgb(${r}, ${g}, ${b})`, hsl: `hsl(${h}, ${s}%, ${l}%)` };
};

/**
 * Lightens toward white without overshooting: moves `amount` of the way from l to 95,
 * so a colour that is already light still produces a distinct, valid tint.
 */
const tint = (l: number, amount: number): number => l + (95 - l) * amount;

export const generatePalette = (baseHex: string, type: PaletteType): PaletteColor[] => {
  const rgb = hexToRgb(baseHex);
  if (!rgb) return [];
  const { h, s, l } = rgbToHsl(rgb);
  // Use the exact input for the base swatch; an HSL round trip can drift by one step.
  const base: PaletteColor = {
    hex: normalizeHex(baseHex) as string,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };

  switch (type) {
    case 'complementary':
      return [
        base,
        makeColor({ h: h + 180, s, l }),
        makeColor({ h, s: s * 0.7, l: tint(l, 0.4) }),
        makeColor({ h: h + 180, s: s * 0.7, l: tint(l, 0.4) }),
        makeColor({ h, s: s * 0.4, l: tint(l, 0.75) }),
      ];
    case 'analogous':
      return [-2, -1, 0, 1, 2].map((i) => (i === 0 ? base : makeColor({ h: h + i * 30, s, l })));
    case 'triadic':
      return [
        base,
        makeColor({ h: h + 120, s, l }),
        makeColor({ h: h + 240, s, l }),
        makeColor({ h, s: s * 0.6, l: tint(l, 0.5) }),
        makeColor({ h: h + 120, s: s * 0.6, l: tint(l, 0.5) }),
      ];
    case 'tetradic':
      return [
        base,
        makeColor({ h: h + 90, s, l }),
        makeColor({ h: h + 180, s, l }),
        makeColor({ h: h + 270, s, l }),
        makeColor({ h, s: s * 0.5, l: tint(l, 0.6) }),
      ];
    case 'split-complementary':
      return [
        base,
        makeColor({ h: h + 150, s, l }),
        makeColor({ h: h + 210, s, l }),
        makeColor({ h, s: s * 0.6, l: tint(l, 0.5) }),
        makeColor({ h: h + 180, s: s * 0.5, l: tint(l, 0.7) }),
      ];
    case 'monochromatic': {
      // Five evenly spaced lightness steps, with the step nearest the base replaced by
      // the base itself, so the input colour appears and no two swatches collide.
      const steps = [10, 30.5, 51, 71.5, 92];
      let nearest = 0;
      steps.forEach((step, i) => {
        if (Math.abs(step - l) < Math.abs(steps[nearest] - l)) nearest = i;
      });
      return steps.map((step, i) => (i === nearest ? base : makeColor({ h, s, l: step })));
    }
    default:
      return [base];
  }
};

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const relativeLuminance = ({ r, g, b }: Rgb): number => {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG contrast ratio between two colours, 1 to 21. */
export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** Black or white, whichever reads better on `hex`. */
export const readableTextColor = (hex: string): '#000000' | '#ffffff' => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  return contrastRatio(rgb, { r: 0, g: 0, b: 0 }) >= contrastRatio(rgb, { r: 255, g: 255, b: 255 })
    ? '#000000'
    : '#ffffff';
};

export const paletteToCss = (palette: PaletteColor[]): string =>
  `:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.rgb} */`).join('\n')}\n}\n`;
