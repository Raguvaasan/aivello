/** Small, framework-free helpers shared by the client-side file tools. */

export const MB = 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(bytes < 10 * MB ? 2 : 1)} MB`;
}

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export interface FileRule {
  /** MIME types accepted, e.g. ['application/pdf']. */
  mimeTypes: readonly string[];
  /** Extensions (lowercase, no dot) accepted when the browser reports no MIME type. */
  extensions: readonly string[];
  maxBytes: number;
  /** Human label used in messages, e.g. "PDF". */
  label: string;
}

/** Returns an error message, or null when the file is acceptable. */
export function validateFile(file: FileLike, rule: FileRule): string | null {
  const extension = getExtension(file.name);
  const typeOk = file.type
    ? rule.mimeTypes.includes(file.type.toLowerCase())
    : rule.extensions.includes(extension);
  if (!typeOk) return `"${file.name}" is not a supported ${rule.label} file.`;
  if (file.size === 0) return `"${file.name}" is empty.`;
  if (file.size > rule.maxBytes) {
    return `"${file.name}" is ${formatBytes(file.size)} - the limit is ${formatBytes(rule.maxBytes)}.`;
  }
  return null;
}

export function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** "Holiday photo.final.JPG" -> "Holiday photo.final"; strips characters unsafe in file names. */
export function baseName(name: string, fallback = 'file'): string {
  const dot = name.lastIndexOf('.');
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '_')
    .trim();
  return stem || fallback;
}

/** Returns a copy of `items` with the element at `from` moved to `to` (clamped). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const copy = items.slice();
  if (from < 0 || from >= copy.length) return copy;
  const target = Math.max(0, Math.min(copy.length - 1, to));
  const [item] = copy.splice(from, 1);
  copy.splice(target, 0, item);
  return copy;
}

/** Triggers a browser download of `blob`, revoking the object URL afterwards. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the URL is released.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** True when `bytes` (the start of a file) contains the "%PDF-" signature within its first 1KB. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const limit = Math.min(bytes.length, 1024) - 5;
  for (let i = 0; i <= limit; i += 1) {
    if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46 && bytes[i + 4] === 0x2d) {
      return true;
    }
  }
  return false;
}

/**
 * Wraps bytes in a Blob without copying when the view spans its whole ArrayBuffer
 * (the usual case for library output such as pdf-lib's `save()`).
 */
export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  const { buffer } = bytes;
  const whole = buffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === buffer.byteLength;
  return new Blob([whole ? buffer : (bytes.slice().buffer as ArrayBuffer)], { type });
}
