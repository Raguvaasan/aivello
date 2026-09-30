import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import toast from 'react-hot-toast';
import { FiDownload, FiImage, FiLink, FiRefreshCw, FiUpload, FiX } from 'react-icons/fi';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PERCENT,
  MIN_PERCENT,
  OUTPUT_FORMATS,
  computeTargetSize,
  formatFromMime,
  linkedDimension,
  qualityToUnit,
  sizeChangePercent,
  type OutputFormat,
  type Size,
} from '../utils/tools/imageResize';
import { baseName, downloadBlob, formatBytes, validateFile } from '../utils/tools/fileUtils';
import { normalizeHex } from '../utils/tools/contrast';

const TOOL_ID = 'image-converter';
const TOOL_NAME = 'Image Converter & Resizer';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full min-w-0 min-h-[44px] bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-5 py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';
const PILL =
  'flex items-center justify-center min-h-[44px] px-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 dark:peer-checked:bg-purple-500/20 dark:peer-checked:text-purple-100 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50';
const LABEL = 'block font-semibold text-gray-900 dark:text-white mb-2';

const IMAGE_RULE = {
  mimeTypes: ACCEPTED_IMAGE_TYPES,
  extensions: ACCEPTED_IMAGE_EXTENSIONS,
  maxBytes: MAX_IMAGE_BYTES,
  label: 'image (JPG, PNG, WebP, GIF or BMP)',
};

type ResizeMode = 'dimensions' | 'percentage';

interface Source {
  file: File;
  url: string;
  image: HTMLImageElement;
  size: Size;
}

interface Output {
  url: string;
  blob: Blob;
  size: Size;
  format: OutputFormat;
  filename: string;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = url;
  });
}

/**
 * Draws `source` at `target` size. Large reductions are done in halving steps, which
 * avoids the aliasing a single big downscale produces in most browsers.
 */
function renderToCanvas(source: HTMLImageElement, original: Size, target: Size, fill: string | null): HTMLCanvasElement {
  let current: CanvasImageSource = source;
  let currentSize = { ...original };

  while (currentSize.width / 2 >= target.width && currentSize.height / 2 >= target.height) {
    const step = document.createElement('canvas');
    step.width = Math.max(1, Math.round(currentSize.width / 2));
    step.height = Math.max(1, Math.round(currentSize.height / 2));
    const stepCtx = step.getContext('2d');
    if (!stepCtx) break;
    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(current, 0, 0, step.width, step.height);
    current = step;
    currentSize = { width: step.width, height: step.height };
  }

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, target.width, target.height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(current, 0, 0, target.width, target.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

const parseDimension = (value: string): number | null => (value.trim() === '' ? null : Number(value));

export default function ImageConverter() {
  const uid = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);

  const [source, setSource] = useState<Source | null>(null);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [format, setFormat] = useState<OutputFormat>('webp');
  const [quality, setQuality] = useState(85);
  const [background, setBackground] = useState('#ffffff');
  const [mode, setMode] = useState<ResizeMode>('dimensions');
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [percentInput, setPercentInput] = useState('100');

  // Object URLs are revoked when replaced and on unmount. Tracked in a ref rather than
  // effect cleanups so StrictMode's mount/unmount/mount cycle cannot revoke a live URL.
  const urlsRef = useRef<{ source: string | null; output: string | null }>({ source: null, output: null });
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      if (urls.source) URL.revokeObjectURL(urls.source);
      if (urls.output) URL.revokeObjectURL(urls.output);
      urls.source = null;
      urls.output = null;
    };
  }, []);

  const replaceSource = (next: Source | null) => {
    const urls = urlsRef.current;
    if (urls.source && urls.source !== next?.url) URL.revokeObjectURL(urls.source);
    urls.source = next?.url ?? null;
    setSource(next);
  };

  const replaceOutput = (next: Output | null) => {
    const urls = urlsRef.current;
    if (urls.output && urls.output !== next?.url) URL.revokeObjectURL(urls.output);
    urls.output = next?.url ?? null;
    setOutput(next);
  };

  const formatInfo = OUTPUT_FORMATS[format];

  const request =
    mode === 'percentage'
      ? ({ mode, percent: Number(percentInput) } as const)
      : ({ mode, width: parseDimension(widthInput), height: parseDimension(heightInput), lockAspect } as const);
  const target = source ? computeTargetSize(source.size, request) : null;

  const acceptFile = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateFile(file, IMAGE_RULE);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      const size = { width: image.naturalWidth, height: image.naturalHeight };
      if (!size.width || !size.height) throw new Error('empty');
      replaceSource({ file, url, image, size });
      replaceOutput(null);
      setWidthInput(String(size.width));
      setHeightInput(String(size.height));
      setPercentInput('100');
    } catch {
      URL.revokeObjectURL(url);
      setError(`"${file.name}" could not be opened. It may be damaged, or your browser cannot decode this format.`);
    } finally {
      setBusy(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    void acceptFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    void acceptFile(e.dataTransfer.files?.[0]);
  };

  const onWidthChange = (value: string) => {
    setWidthInput(value);
    const n = Number(value);
    if (lockAspect && source && value.trim() !== '' && n > 0) {
      setHeightInput(String(linkedDimension('width', n, source.size)));
    }
  };

  const onHeightChange = (value: string) => {
    setHeightInput(value);
    const n = Number(value);
    if (lockAspect && source && value.trim() !== '' && n > 0) {
      setWidthInput(String(linkedDimension('height', n, source.size)));
    }
  };

  const toggleLock = () => {
    const next = !lockAspect;
    setLockAspect(next);
    const n = Number(widthInput);
    if (next && source && n > 0) setHeightInput(String(linkedDimension('width', n, source.size)));
  };

  const clear = () => {
    replaceSource(null);
    replaceOutput(null);
    setError(null);
    setWidthInput('');
    setHeightInput('');
  };

  const convert = async () => {
    if (!source || !target) return;
    if (!target.ok) {
      setError(target.error);
      return;
    }
    const bg = normalizeHex(background) ?? '#ffffff';
    setBusy(true);
    setError(null);
    try {
      // Let the "Converting..." state paint before the synchronous canvas work.
      await new Promise((r) => window.setTimeout(r, 0));
      const canvas = renderToCanvas(source.image, source.size, target.size, formatInfo.alpha ? null : bg);
      const blob = await canvasToBlob(canvas, formatInfo.mime, formatInfo.lossy ? qualityToUnit(quality) : undefined);
      canvas.width = 0;
      canvas.height = 0;
      if (!blob) throw new Error('encode');

      // Safari (before 17) silently falls back to PNG for WebP; name the file for what we got.
      const actualFormat = formatFromMime(blob.type) ?? format;
      if (actualFormat !== format) {
        toast(`Your browser can't create ${formatInfo.label} files, so this was saved as ${OUTPUT_FORMATS[actualFormat].label}.`);
      }
      const ext = OUTPUT_FORMATS[actualFormat].extension;
      replaceOutput({
        url: URL.createObjectURL(blob),
        blob,
        size: target.size,
        format: actualFormat,
        filename: `${baseName(source.file.name, 'image')}-${target.size.width}x${target.size.height}.${ext}`,
      });
      track('convert');
    } catch {
      setError('Conversion failed - the image may be too large for this browser. Try a smaller size.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!output) return;
    downloadBlob(output.blob, output.filename);
    track('download');
  };

  const change = output && source ? sizeChangePercent(source.file.size, output.blob.size) : 0;

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Convert images between JPG, PNG and WebP and resize by pixels or percentage - privately in your browser, no uploads."
      toolCategory="Media"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">🔄</span> Image Converter &amp; Resizer
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Convert to PNG, JPEG or WebP and resize in one step. Your image never leaves your device.
          </p>
        </div>

        {!source ? (
          <div
            className={`${CARD} border-2 border-dashed text-center transition-colors ${
              dragging ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="py-8">
              <IconWrapper icon={FiImage} className="mx-auto mb-3 h-12 w-12 text-purple-600 dark:text-purple-300" />
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Drop an image here</p>
              <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">JPG, PNG, WebP, GIF or BMP, up to {formatBytes(MAX_IMAGE_BYTES)}</p>
              <input
                id={`${uid}-file`}
                type="file"
                accept={[...ACCEPTED_IMAGE_TYPES, '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].join(',')}
                onChange={onFileChange}
                disabled={busy}
                className="peer sr-only"
              />
              <label
                htmlFor={`${uid}-file`}
                className={`${PRIMARY_BTN} cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900 ${busy ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <IconWrapper icon={FiUpload} className="w-4 h-4" />
                {busy ? 'Opening...' : 'Choose image'}
              </label>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <section className={`${CARD} lg:col-span-2 space-y-5`} aria-label="Conversion settings">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate" title={source.file.name}>
                    {source.file.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {source.size.width} &times; {source.size.height}px &middot; {formatBytes(source.file.size)}
                  </p>
                  {source.file.type === 'image/gif' && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Animated GIFs are converted using their first frame.</p>
                  )}
                </div>
                <button type="button" onClick={clear} className={SECONDARY_BTN} aria-label="Remove image and start over">
                  <IconWrapper icon={FiX} className="w-4 h-4" />
                </button>
              </div>

              <fieldset>
                <legend className={LABEL}>Output format</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(OUTPUT_FORMATS) as OutputFormat[]).map((f) => (
                    <div key={f}>
                      <input
                        type="radio"
                        id={`${uid}-fmt-${f}`}
                        name={`${uid}-fmt`}
                        value={f}
                        checked={format === f}
                        onChange={() => setFormat(f)}
                        className="peer sr-only"
                      />
                      <label htmlFor={`${uid}-fmt-${f}`} className={PILL}>
                        {OUTPUT_FORMATS[f].label}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>

              {formatInfo.lossy && (
                <div>
                  <label htmlFor={`${uid}-quality`} className={LABEL}>
                    Quality: <span className="tabular-nums">{quality}</span>
                  </label>
                  <input
                    id={`${uid}-quality`}
                    type="range"
                    min={1}
                    max={100}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-11 accent-purple-600 cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Lower quality = smaller file. 75-90 suits most photos.</p>
                </div>
              )}

              {!formatInfo.alpha && (
                <div>
                  <label htmlFor={`${uid}-bg`} className={LABEL}>
                    Background for transparent areas
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id={`${uid}-bg`}
                      type="color"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      className="h-11 w-14 cursor-pointer rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 p-1"
                    />
                    <span className="font-mono text-sm uppercase text-gray-600 dark:text-gray-300">{background}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPEG has no transparency, so it is filled with this colour.</p>
                </div>
              )}

              <fieldset>
                <legend className={LABEL}>Resize</legend>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(
                    [
                      ['dimensions', 'By pixels'],
                      ['percentage', 'By percent'],
                    ] as const
                  ).map(([m, label]) => (
                    <div key={m}>
                      <input
                        type="radio"
                        id={`${uid}-mode-${m}`}
                        name={`${uid}-mode`}
                        value={m}
                        checked={mode === m}
                        onChange={() => setMode(m)}
                        className="peer sr-only"
                      />
                      <label htmlFor={`${uid}-mode-${m}`} className={PILL}>
                        {label}
                      </label>
                    </div>
                  ))}
                </div>

                {mode === 'dimensions' ? (
                  <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                    <div className="min-w-0">
                      <label htmlFor={`${uid}-w`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Width (px)
                      </label>
                      <input
                        id={`${uid}-w`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={widthInput}
                        onChange={(e) => onWidthChange(e.target.value)}
                        className={INPUT}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={toggleLock}
                      aria-pressed={lockAspect}
                      aria-label="Lock aspect ratio"
                      title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
                      className={`${SECONDARY_BTN} px-3 ${lockAspect ? '!bg-purple-100 !text-purple-700 dark:!bg-purple-500/25 dark:!text-purple-100' : ''}`}
                    >
                      <IconWrapper icon={FiLink} className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <label htmlFor={`${uid}-h`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Height (px)
                      </label>
                      <input
                        id={`${uid}-h`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        value={heightInput}
                        onChange={(e) => onHeightChange(e.target.value)}
                        className={INPUT}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`${uid}-pct`} className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Scale (%)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={MIN_PERCENT}
                        max={200}
                        value={Math.min(200, Number(percentInput) || MIN_PERCENT)}
                        onChange={(e) => setPercentInput(e.target.value)}
                        aria-label="Scale slider"
                        className="flex-1 min-w-0 h-11 accent-purple-600 cursor-pointer"
                      />
                      <input
                        id={`${uid}-pct`}
                        type="number"
                        inputMode="numeric"
                        min={MIN_PERCENT}
                        max={MAX_PERCENT}
                        value={percentInput}
                        onChange={(e) => setPercentInput(e.target.value)}
                        className={`${INPUT} w-24 shrink-0`}
                      />
                    </div>
                  </div>
                )}
              </fieldset>

              <p className="text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
                {target?.ok ? (
                  <>
                    Output: <strong className="text-gray-900 dark:text-white">{target.size.width} &times; {target.size.height}px</strong>
                  </>
                ) : (
                  <span className="text-red-600 dark:text-red-400">{target?.error}</span>
                )}
              </p>

              <button type="button" onClick={convert} disabled={busy || !target?.ok} className={`${PRIMARY_BTN} w-full`}>
                <IconWrapper icon={FiRefreshCw} className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
                {busy ? 'Converting...' : `Convert to ${formatInfo.label}`}
              </button>
            </section>

            <section className={`${CARD} lg:col-span-3 min-w-0`} aria-label="Preview">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <figure className="min-w-0">
                  <figcaption className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Original</figcaption>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] dark:bg-[conic-gradient(#374151_25%,#1f2937_0_50%,#374151_0_75%,#1f2937_0)] bg-[length:20px_20px]">
                    <img src={source.url} alt={`Original: ${source.file.name}`} className="max-h-full max-w-full object-contain" />
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {source.size.width} &times; {source.size.height}px &middot; {formatBytes(source.file.size)}
                  </p>
                </figure>
                <figure className="min-w-0">
                  <figcaption className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Converted</figcaption>
                  <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-[conic-gradient(#e5e7eb_25%,#fff_0_50%,#e5e7eb_0_75%,#fff_0)] dark:bg-[conic-gradient(#374151_25%,#1f2937_0_50%,#374151_0_75%,#1f2937_0)] bg-[length:20px_20px]">
                    {output ? (
                      <img src={output.url} alt="Converted result" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <p className="px-4 text-center text-sm text-gray-500 dark:text-gray-400">Choose settings and press Convert.</p>
                    )}
                  </div>
                  <div aria-live="polite">
                    {output && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {output.size.width} &times; {output.size.height}px &middot; {formatBytes(output.blob.size)} &middot;{' '}
                        <span className={change <= 0 ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}>
                          {change <= 0 ? `${Math.abs(change)}% smaller` : `${change}% larger`}
                        </span>
                      </p>
                    )}
                  </div>
                </figure>
              </div>
              {output && (
                <button type="button" onClick={download} className={`${PRIMARY_BTN} mt-5 w-full`}>
                  <IconWrapper icon={FiDownload} className="w-4 h-4" />
                  Download {OUTPUT_FORMATS[output.format].label}
                </button>
              )}
            </section>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-200">
            {error}
          </p>
        )}
      </div>
    </ToolWrapper>
  );
}
