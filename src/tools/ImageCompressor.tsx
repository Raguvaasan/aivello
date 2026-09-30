import React, { useEffect, useId, useRef, useState } from 'react';
import { FaCompressArrowsAlt, FaDownload, FaUpload } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'];
/** iOS Safari refuses canvases above ~16.7 megapixels, so stay under that everywhere. */
const MAX_CANVAS_PIXELS = 16777216;
const RECOMPRESS_DELAY_MS = 200;

type OutputFormat = 'image/jpeg' | 'image/webp';

const FORMATS: ReadonlyArray<{ id: OutputFormat; label: string; ext: string }> = [
  { id: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { id: 'image/webp', label: 'WebP', ext: 'webp' },
];

const MAX_EDGE_OPTIONS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0, label: 'Original size' },
  { value: 3840, label: '3840 px (4K)' },
  { value: 2560, label: '2560 px' },
  { value: 1920, label: '1920 px (Full HD)' },
  { value: 1280, label: '1280 px' },
  { value: 800, label: '800 px' },
];

interface SourceImage {
  file: File;
  url: string;
  img: HTMLImageElement;
  width: number;
  height: number;
}

interface CompressedImage {
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode'));
    img.src = src;
  });

const targetSize = (width: number, height: number, maxEdge: number) => {
  let scale = maxEdge > 0 ? Math.min(1, maxEdge / Math.max(width, height)) : 1;
  if (width * height * scale * scale > MAX_CANVAS_PIXELS) {
    scale = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  }
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

const encode = (source: SourceImage, format: OutputFormat, quality: number, maxEdge: number): Promise<Blob> => {
  const { width, height } = targetSize(source.width, source.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('canvas'));
  if (format === 'image/jpeg') {
    // JPEG has no alpha: paint white first, otherwise transparent areas turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source.img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('encode'));
        // Browsers without a WebP encoder silently return PNG instead.
        else if (blob.type !== format) reject(new Error('unsupported-format'));
        else resolve(blob);
      },
      format,
      quality
    )
  );
};

export default function ImageCompressor() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [result, setResult] = useState<CompressedImage | null>(null);
  const [quality, setQuality] = useState(75);
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [maxEdge, setMaxEdge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const track = useToolTracking('image-compressor', 'Image Compressor');
  const baseId = useId();
  const fileId = `${baseId}-file`;
  const qualityId = `${baseId}-quality`;
  const formatId = `${baseId}-format`;
  const sizeId = `${baseId}-size`;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef(0);
  const trackedFileRef = useRef<File | null>(null);

  // Object URLs are revoked when replaced and on unmount.
  useEffect(() => {
    if (!source) return;
    return () => URL.revokeObjectURL(source.url);
  }, [source]);
  useEffect(() => {
    if (!result) return;
    return () => URL.revokeObjectURL(result.url);
  }, [result]);

  // Re-encode (debounced) whenever the image or a setting changes.
  useEffect(() => {
    if (!source) return;
    const job = ++jobRef.current;
    const timer = window.setTimeout(() => {
      setLoading(true);
      encode(source, format, quality / 100, maxEdge)
        .then((blob) => {
          if (job !== jobRef.current) return;
          const { width, height } = targetSize(source.width, source.height, maxEdge);
          setResult({ blob, url: URL.createObjectURL(blob), width, height });
          setError(null);
          if (trackedFileRef.current !== source.file) {
            trackedFileRef.current = source.file;
            track('convert');
          }
        })
        .catch((err: unknown) => {
          if (job !== jobRef.current) return;
          setResult(null);
          setError(
            err instanceof Error && err.message === 'unsupported-format'
              ? 'This browser cannot create WebP images. Choose JPEG instead.'
              : 'Could not compress this image. It may be too large for your device.'
          );
        })
        .finally(() => {
          if (job === jobRef.current) setLoading(false);
        });
    }, RECOMPRESS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [source, format, quality, maxEdge, track]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported file type. Please choose a JPEG, PNG, WebP, GIF, BMP or AVIF image.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`That file is ${formatBytes(file.size)}. The maximum is 20 MB.`);
      return;
    }

    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      jobRef.current++; // discard any encode still running for the previous image
      setResult(null);
      setSource({ file, url, img, width: img.naturalWidth, height: img.naturalHeight });
    } catch {
      URL.revokeObjectURL(url);
      setError('That image could not be opened. It may be corrupt or in a format your browser cannot read.');
    }
  };

  const download = () => {
    if (!source || !result) return;
    const ext = FORMATS.find((f) => f.id === format)?.ext ?? 'jpg';
    const base = source.file.name.replace(/\.[^.]+$/, '') || 'image';
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `${base}-compressed.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    track('download');
  };

  const savedPercent = source && result ? Math.round((1 - result.blob.size / source.file.size) * 100) : 0;
  const labelClass = 'block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2';
  const selectClass =
    'w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';

  return (
    <ToolWrapper
      toolId="image-compressor"
      toolName="Image Compressor"
      toolDescription="Compress and optimize images online. Reduce file size while maintaining quality for faster web loading"
      toolCategory="Media"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaCompressArrowsAlt} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Image Compressor</h2>
          </div>

          {/* Upload */}
          <div
            className={`mb-6 text-center border-2 border-dashed rounded-xl p-6 transition-colors ${
              dragActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' : 'border-gray-300 dark:border-white/20'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              void handleFile(e.dataTransfer.files?.[0]);
            }}
          >
            <IconWrapper icon={FaUpload} className="text-4xl text-pink-600 dark:text-pink-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Drop an image here or choose a file (JPEG, PNG, WebP, GIF, BMP, AVIF; max 20 MB)
            </p>
            <label htmlFor={fileId} className="sr-only">
              Image to compress
            </label>
            <input
              id={fileId}
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = '';
              }}
              className="sr-only"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
            >
              {source ? 'Choose another image' : 'Choose image'}
            </button>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Compression runs entirely in your browser. Your image is never uploaded.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {source && (
            <>
              {/* Settings */}
              <div className="grid gap-4 sm:grid-cols-3 mb-6">
                <div>
                  <label htmlFor={qualityId} className={labelClass}>
                    Quality: <span className="font-bold text-purple-600 dark:text-purple-400">{quality}%</span>
                  </label>
                  <input
                    id={qualityId}
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={quality}
                    aria-valuetext={`${quality} percent`}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full h-2 mt-3 rounded-lg cursor-pointer accent-purple-600 bg-gray-200 dark:bg-white/10"
                  />
                </div>
                <div>
                  <label htmlFor={formatId} className={labelClass}>
                    Output format
                  </label>
                  <select
                    id={formatId}
                    value={format}
                    onChange={(e) => setFormat(e.target.value as OutputFormat)}
                    className={selectClass}
                  >
                    {FORMATS.map((f) => (
                      <option key={f.id} value={f.id} className="bg-white dark:bg-gray-800">
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={sizeId} className={labelClass}>
                    Max width/height
                  </label>
                  <select
                    id={sizeId}
                    value={maxEdge}
                    onChange={(e) => setMaxEdge(Number(e.target.value))}
                    className={selectClass}
                  >
                    {MAX_EDGE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value} className="bg-white dark:bg-gray-800">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Before / after */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <figure className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl min-w-0">
                  <img
                    src={source.url}
                    alt="Original"
                    className="w-full max-h-72 object-contain rounded-lg bg-gray-100 dark:bg-black/20"
                  />
                  <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-900 dark:text-white">Original</span> ·{' '}
                    {formatBytes(source.file.size)} · {source.width}×{source.height}
                  </figcaption>
                </figure>
                <figure className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl min-w-0">
                  {result ? (
                    <img
                      src={result.url}
                      alt="Compressed"
                      className="w-full max-h-72 object-contain rounded-lg bg-gray-100 dark:bg-black/20"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
                      {loading ? 'Compressing…' : 'No result'}
                    </div>
                  )}
                  <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
                    <span className="font-semibold text-gray-900 dark:text-white">Compressed</span>
                    {result && (
                      <>
                        {' '}
                        · {formatBytes(result.blob.size)} · {result.width}×{result.height}
                      </>
                    )}
                    {loading && result && <span className="ml-1 text-gray-500 dark:text-gray-400">(updating…)</span>}
                  </figcaption>
                </figure>
              </div>

              {result && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                  <p className="text-sm" aria-live="polite">
                    {savedPercent > 0 ? (
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {savedPercent}% smaller ({formatBytes(source.file.size - result.blob.size)} saved)
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-300">
                        The result is not smaller than the original. Try a lower quality, a smaller size, or WebP.
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={download}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors disabled:opacity-60"
                  >
                    <IconWrapper icon={FaDownload} />
                    Download
                  </button>
                </div>
              )}
              {source.file.type === 'image/gif' && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Animated GIFs are converted using their first frame only.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}
