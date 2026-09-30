/** Dimension maths and format metadata for the canvas-based Image Converter. */

import { MB } from './fileUtils';

export interface Size {
  width: number;
  height: number;
}

export type OutputFormat = 'png' | 'jpeg' | 'webp';

export interface OutputFormatInfo {
  id: OutputFormat;
  label: string;
  mime: string;
  extension: string;
  /** Whether a quality setting applies. */
  lossy: boolean;
  /** Whether transparency survives. */
  alpha: boolean;
}

export const OUTPUT_FORMATS: Record<OutputFormat, OutputFormatInfo> = {
  png: { id: 'png', label: 'PNG', mime: 'image/png', extension: 'png', lossy: false, alpha: true },
  jpeg: { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg', extension: 'jpg', lossy: true, alpha: false },
  webp: { id: 'webp', label: 'WebP', mime: 'image/webp', extension: 'webp', lossy: true, alpha: true },
};

export function formatFromMime(mime: string): OutputFormat | null {
  const match = (Object.values(OUTPUT_FORMATS) as OutputFormatInfo[]).find((f) => f.mime === mime);
  return match ? match.id : null;
}

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'jfif', 'png', 'webp', 'gif', 'bmp'] as const;

export const MAX_IMAGE_BYTES = 20 * MB;

/** Longest side allowed for the output canvas. */
export const MAX_DIMENSION = 12_000;
/** Total pixels allowed; keeps well inside desktop browsers' canvas limits. */
export const MAX_PIXELS = 100_000_000;

export const MIN_PERCENT = 1;
export const MAX_PERCENT = 400;

/** The other side of a box that keeps `original`'s aspect ratio. Never below 1px. */
export function linkedDimension(changed: 'width' | 'height', value: number, original: Size): number {
  if (!(value > 0) || original.width <= 0 || original.height <= 0) return 1;
  const ratio = changed === 'width' ? original.height / original.width : original.width / original.height;
  return Math.max(1, Math.round(value * ratio));
}

export function scaleByPercent(original: Size, percent: number): Size {
  const factor = percent / 100;
  return {
    width: Math.max(1, Math.round(original.width * factor)),
    height: Math.max(1, Math.round(original.height * factor)),
  };
}

export type ResizeRequest =
  | { mode: 'dimensions'; width: number | null; height: number | null; lockAspect: boolean }
  | { mode: 'percentage'; percent: number };

export type ResizeResult = { ok: true; size: Size } | { ok: false; error: string };

/**
 * Works out the output size.
 *
 * In `dimensions` mode an empty (null) side is derived from the other one while keeping
 * the aspect ratio; with both empty the original size is used. When `lockAspect` is on
 * and both sides are given, width wins and height is derived from it.
 */
export function computeTargetSize(original: Size, request: ResizeRequest): ResizeResult {
  if (!(original.width > 0 && original.height > 0)) return { ok: false, error: 'The image has no size.' };

  let size: Size;
  if (request.mode === 'percentage') {
    const { percent } = request;
    if (!Number.isFinite(percent) || percent < MIN_PERCENT || percent > MAX_PERCENT) {
      return { ok: false, error: `Scale must be between ${MIN_PERCENT}% and ${MAX_PERCENT}%.` };
    }
    size = scaleByPercent(original, percent);
  } else {
    const { width, height, lockAspect } = request;
    for (const [label, value] of [
      ['Width', width],
      ['Height', height],
    ] as const) {
      if (value !== null && (!Number.isFinite(value) || value < 1 || !Number.isInteger(value))) {
        return { ok: false, error: `${label} must be a whole number of at least 1px.` };
      }
    }
    if (width !== null && height !== null && !lockAspect) size = { width, height };
    else if (width !== null) size = { width, height: linkedDimension('width', width, original) };
    else if (height !== null) size = { width: linkedDimension('height', height, original), height };
    else size = { ...original };
  }

  if (size.width > MAX_DIMENSION || size.height > MAX_DIMENSION) {
    return { ok: false, error: `Output can be at most ${MAX_DIMENSION.toLocaleString('en-US')}px on each side.` };
  }
  if (size.width * size.height > MAX_PIXELS) {
    return { ok: false, error: 'That output size is too large for the browser to render.' };
  }
  return { ok: true, size };
}

/** Maps a 1-100 quality slider to canvas.toBlob's 0-1 range. */
export function qualityToUnit(quality: number): number {
  if (!Number.isFinite(quality)) return 0.92;
  return Math.min(100, Math.max(1, Math.round(quality))) / 100;
}

/** Signed percentage change in file size, e.g. -42 for 42% smaller. */
export function sizeChangePercent(originalBytes: number, outputBytes: number): number {
  if (originalBytes <= 0) return 0;
  return Math.round(((outputBytes - originalBytes) / originalBytes) * 100);
}
