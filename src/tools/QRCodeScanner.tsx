import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaQrcode, FaCamera, FaUpload, FaCopy, FaExternalLinkAlt, FaHistory, FaStop } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  QRContentType,
  QR_TYPE_LABELS,
  detectQRType,
  parseKeyValueCard,
  parseWifi,
  safeHttpUrl,
} from './lib/qrContent';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
/** Minimum gap between frame decodes; decoding every animation frame burns CPU for no gain. */
const FRAME_INTERVAL_MS = 120;
/** Camera frames are downscaled to this width before jsQR, which is plenty for a QR code. */
const CAMERA_SCAN_WIDTH = 640;
const HISTORY_LIMIT = 10;

type ScanSource = 'camera' | 'image';

interface ScanRecord {
  id: number;
  content: string;
  type: QRContentType;
  source: ScanSource;
  timestamp: Date;
}

type CameraState = 'idle' | 'starting' | 'scanning';

// --- Decoders -------------------------------------------------------------------------

/** The subset of the Shape Detection API we use (not yet in TypeScript's DOM lib). */
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
}

/** Native detector when the browser has one that supports QR codes; it is faster than jsQR. */
const getBarcodeDetector = async (): Promise<BarcodeDetectorLike | null> => {
  const Ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (!Ctor) return null;
  try {
    if (Ctor.getSupportedFormats) {
      const formats = await Ctor.getSupportedFormats();
      if (!formats.includes('qr_code')) return null;
    }
    return new Ctor({ formats: ['qr_code'] });
  } catch {
    return null;
  }
};

type JsQR = typeof import('jsqr').default;
let jsQRPromise: Promise<JsQR> | null = null;

/** Loads jsQR on first use. The UMD bundle's default export can arrive nested, so unwrap it. */
const loadJsQR = (): Promise<JsQR> => {
  if (!jsQRPromise) {
    jsQRPromise = import('jsqr')
      .then((mod) => {
        const candidate: unknown = mod.default;
        if (typeof candidate === 'function') return candidate as JsQR;
        const nested = (candidate as { default?: unknown } | undefined)?.default;
        if (typeof nested === 'function') return nested as JsQR;
        throw new Error('jsQR did not load correctly');
      })
      .catch((err: unknown) => {
        jsQRPromise = null; // allow a retry after a transient network failure
        throw err;
      });
  }
  return jsQRPromise;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image-decode'));
    img.src = src;
  });

/** Draws `source` into `canvas` scaled to `width` x `height` and returns its pixels. */
const readPixels = (
  canvas: HTMLCanvasElement,
  source: CanvasImageSource,
  width: number,
  height: number
): ImageData | null => {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
};

/** Decodes a QR code from an uploaded image, trying the native detector and then jsQR at a few scales. */
const decodeImage = async (img: HTMLImageElement): Promise<string | null> => {
  const detector = await getBarcodeDetector();
  if (detector) {
    try {
      const codes = await detector.detect(img);
      const value = codes.find((c) => c.rawValue)?.rawValue;
      if (value) return value;
    } catch {
      // Fall through to jsQR.
    }
  }

  const jsQR = await loadJsQR();
  const canvas = document.createElement('canvas');
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  // Large photos decode faster and often better when downscaled; small codes need more pixels.
  const edges = Array.from(new Set([1024, 2048, 640].map((edge) => Math.min(edge, longest))));

  for (const edge of edges) {
    const scale = edge / longest;
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const pixels = readPixels(canvas, img, width, height);
    if (!pixels) break;
    const code = jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code?.data) return code.data;
  }
  return null;
};

const cameraErrorMessage = (err: unknown): string => {
  const name = err instanceof Error || err instanceof DOMException ? err.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Camera access was blocked. Allow the camera for this site in your browser settings, or upload an image instead.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'No camera was found on this device. You can upload an image instead.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'The camera is being used by another app. Close it and try again.';
    default:
      return 'Could not start the camera. You can upload an image instead.';
  }
};

// --- Component ------------------------------------------------------------------------

export default function QRCodeScanner() {
  const [current, setCurrent] = useState<ScanRecord | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [decodingImage, setDecodingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  const track = useToolTracking('qr-code-scanner', 'QR Code Scanner');
  const uploadId = useId();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  /** Incremented on every start/stop so async work from an old camera session can tell it is stale. */
  const sessionRef = useRef(0);
  const nextIdRef = useRef(1);

  /** Stops the camera without touching React state (safe to call during unmount). */
  const releaseCamera = useCallback(() => {
    sessionRef.current += 1;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopCamera = useCallback(() => {
    releaseCamera();
    setCameraState('idle');
  }, [releaseCamera]);

  useEffect(() => releaseCamera, [releaseCamera]);

  // Revoke the uploaded-image preview when it is replaced and on unmount.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const recordResult = useCallback(
    (content: string, source: ScanSource) => {
      const record: ScanRecord = {
        id: nextIdRef.current++,
        content,
        type: detectQRType(content),
        source,
        timestamp: new Date(),
      };
      setCurrent(record);
      setShowWifiPassword(false);
      setHistory((prev) => [record, ...prev].slice(0, HISTORY_LIMIT));
      track('analyze');
      if ('vibrate' in navigator) navigator.vibrate?.(100);
    },
    [track]
  );

  const startCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        window.isSecureContext
          ? 'This browser does not support camera access. Upload an image instead.'
          : 'Camera access requires a secure (HTTPS) connection.'
      );
      return;
    }

    releaseCamera();
    const session = sessionRef.current;
    setCameraState('starting');

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (err) {
      if (session === sessionRef.current) {
        setCameraState('idle');
        setError(cameraErrorMessage(err));
      }
      return;
    }

    // Stopped or unmounted while the permission prompt was open.
    if (session !== sessionRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    streamRef.current = stream;

    const video = videoRef.current;
    if (!video) {
      stopCamera();
      return;
    }
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // Autoplay can reject if interrupted; frames still arrive once the stream is live.
    }
    if (session !== sessionRef.current) return;
    setCameraState('scanning');

    let detector = await getBarcodeDetector();
    let jsQR: JsQR | null = null;
    if (!detector) {
      try {
        jsQR = await loadJsQR();
      } catch {
        if (session === sessionRef.current) {
          stopCamera();
          setError('The QR decoder failed to load. Check your connection and try again.');
        }
        return;
      }
    }

    const canvas = document.createElement('canvas');
    let lastScan = 0;

    const tick = async (now: number) => {
      if (session !== sessionRef.current) return;
      if (now - lastScan >= FRAME_INTERVAL_MS && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        lastScan = now;
        let value: string | null = null;

        if (detector) {
          try {
            const codes = await detector.detect(video);
            value = codes.find((c) => c.rawValue)?.rawValue ?? null;
          } catch {
            detector = null; // Some implementations fail on video; fall back to jsQR.
            try {
              jsQR = await loadJsQR();
            } catch {
              // Try the detector-less path again next frame.
            }
          }
        } else if (jsQR) {
          const scale = Math.min(1, CAMERA_SCAN_WIDTH / video.videoWidth);
          const width = Math.round(video.videoWidth * scale);
          const height = Math.round(video.videoHeight * scale);
          const pixels = readPixels(canvas, video, width, height);
          const code = pixels ? jsQR(pixels.data, width, height, { inversionAttempts: 'dontInvert' }) : null;
          value = code?.data || null;
        }

        if (session !== sessionRef.current) return;
        if (value) {
          stopCamera();
          recordResult(value, 'camera');
          return;
        }
      }
      rafRef.current = requestAnimationFrame((t) => void tick(t));
    };

    rafRef.current = requestAnimationFrame((t) => void tick(t));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPEG, WebP, GIF...).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That image is larger than 20 MB. Please choose a smaller one.');
      return;
    }

    if (cameraState !== 'idle') stopCamera();
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setDecodingImage(true);

    try {
      const img = await loadImage(url);
      const value = await decodeImage(img);
      if (value) {
        recordResult(value, 'image');
      } else {
        setError(
          'No QR code found in that image. Try a sharper, well-lit photo where the code fills more of the frame.'
        );
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'image-decode'
          ? 'That image could not be opened. It may be corrupt or in an unsupported format (e.g. HEIC).'
          : 'The QR decoder failed to load. Check your connection and try again.'
      );
    } finally {
      setDecodingImage(false);
    }
  };

  const copyToClipboard = async (text: string, label = 'Copied to clipboard') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(label);
      track('copy');
    } catch {
      toast.error('Could not copy automatically. Select the text and copy it manually.');
    }
  };

  const renderContent = (record: ScanRecord) => {
    const { content, type } = record;
    const chip = (
      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
        {QR_TYPE_LABELS[type]}
      </span>
    );

    if (type === 'url') {
      const href = safeHttpUrl(content);
      if (href) {
        const host = new URL(href).host;
        return (
          <div className="space-y-3">
            {chip}
            <p className="text-blue-600 dark:text-blue-400 break-all">{content}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Opens <strong className="text-gray-900 dark:text-white">{host}</strong>. Check the address before you
              continue; QR codes are a common phishing trick.
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <IconWrapper icon={FaExternalLinkAlt} />
              Open link
            </a>
          </div>
        );
      }
    }

    if (type === 'wifi') {
      const wifi = parseWifi(content);
      if (wifi) {
        return (
          <div className="space-y-3">
            {chip}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-gray-500 dark:text-gray-400">Network</dt>
              <dd className="text-gray-900 dark:text-white break-all">{wifi.ssid}</dd>
              <dt className="text-gray-500 dark:text-gray-400">Security</dt>
              <dd className="text-gray-900 dark:text-white">{wifi.security || 'None'}</dd>
              {wifi.password && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Password</dt>
                  <dd className="text-gray-900 dark:text-white font-mono break-all">
                    {showWifiPassword ? wifi.password : '•'.repeat(Math.min(wifi.password.length, 16))}
                  </dd>
                </>
              )}
              {wifi.hidden && (
                <>
                  <dt className="text-gray-500 dark:text-gray-400">Hidden</dt>
                  <dd className="text-gray-900 dark:text-white">Yes</dd>
                </>
              )}
            </dl>
            {wifi.password && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowWifiPassword((v) => !v)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20"
                >
                  {showWifiPassword ? 'Hide password' : 'Show password'}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(wifi.password, 'Wi-Fi password copied')}
                  className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20"
                >
                  Copy password
                </button>
              </div>
            )}
          </div>
        );
      }
    }

    if (type === 'contact' || type === 'event') {
      const rows = parseKeyValueCard(content);
      if (rows.length > 0) {
        return (
          <div className="space-y-3">
            {chip}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {rows.map((row, i) => (
                <React.Fragment key={`${row.key}-${i}`}>
                  <dt className="text-gray-500 dark:text-gray-400">{row.key}</dt>
                  <dd className="text-gray-900 dark:text-white break-all">{row.value}</dd>
                </React.Fragment>
              ))}
            </dl>
          </div>
        );
      }
    }

    // Everything else (mailto:, tel:, sms:, geo:, plain text, non-http "URLs") is shown as
    // text only; decoded payloads are never turned into links or navigated to.
    const display =
      type === 'email' || type === 'phone' || type === 'sms' || type === 'geo'
        ? content.replace(/^(mailto|tel|smsto|sms|geo):/i, '')
        : content;
    return (
      <div className="space-y-3">
        {chip}
        <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words">{display}</p>
      </div>
    );
  };

  const cameraActive = cameraState !== 'idle';

  return (
    <ToolWrapper
      toolId="qr-code-scanner"
      toolName="QR Code Scanner"
      toolDescription="Scan QR codes using your camera or upload images. Decode URLs, contacts, WiFi passwords, and more instantly"
      toolCategory="Utility"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaQrcode} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Scanner</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Camera */}
            <div className="text-center border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-4 sm:p-6">
              <IconWrapper icon={FaCamera} className="text-4xl text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Scan with Camera</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Point your camera at a QR code</p>

              <div className={cameraActive ? 'relative mb-4 overflow-hidden rounded-lg bg-black aspect-video' : 'hidden'}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  aria-label="Camera preview"
                />
                {cameraState === 'scanning' && (
                  <div
                    className="pointer-events-none absolute inset-1/4 border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]"
                    aria-hidden="true"
                  />
                )}
              </div>

              {cameraActive ? (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors"
                >
                  <IconWrapper icon={FaStop} />
                  {cameraState === 'starting' ? 'Starting camera…' : 'Stop camera'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void startCamera()}
                  className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
                >
                  <IconWrapper icon={FaCamera} />
                  Start camera
                </button>
              )}
              {cameraState === 'scanning' && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400" role="status">
                  Looking for a QR code…
                </p>
              )}
            </div>

            {/* Upload */}
            <div
              className={`text-center border-2 border-dashed rounded-xl p-4 sm:p-6 transition-colors ${
                dragActive
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                  : 'border-gray-300 dark:border-white/20'
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Image</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Choose or drop an image containing a QR code (max 20 MB)
              </p>
              <label htmlFor={uploadId} className="sr-only">
                Image containing a QR code
              </label>
              <input
                id={uploadId}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  void handleFile(e.target.files?.[0]);
                  e.target.value = ''; // allow re-selecting the same file
                }}
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={decodingImage}
                className="w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors disabled:opacity-60 disabled:cursor-wait"
              >
                {decodingImage ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" aria-hidden="true" />
                    Reading image…
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaUpload} />
                    Choose image
                  </>
                )}
              </button>
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Uploaded QR code"
                  className="mt-4 mx-auto max-h-40 rounded-lg border border-gray-200 dark:border-white/10 object-contain"
                />
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {/* Result */}
          <div aria-live="polite">
            {current && (
              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scan Result</h3>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(current.content)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors"
                  >
                    <IconWrapper icon={FaCopy} />
                    Copy
                  </button>
                </div>
                <div className="p-4 sm:p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                  {renderContent(current)}
                </div>
              </div>
            )}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <IconWrapper icon={FaHistory} className="text-xl text-gray-500 dark:text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Scans</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Kept on this page only and cleared when you leave.</p>
              <ul className="space-y-3">
                {history.map((scan) => (
                  <li
                    key={scan.id}
                    className="p-3 sm:p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        {QR_TYPE_LABELS[scan.type]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {scan.source === 'camera' ? 'Camera' : 'Image'} · {scan.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-all line-clamp-2">{scan.content}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrent(scan);
                          setShowWifiPassword(false);
                        }}
                        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 transition-colors"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(scan.content)}
                        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Supported types */}
          <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🔍 Supported QR Code Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div>🔗 Website URLs</div>
              <div>📧 Email addresses</div>
              <div>📞 Phone numbers</div>
              <div>📶 Wi-Fi credentials</div>
              <div>👤 Contact cards</div>
              <div>📅 Calendar events</div>
              <div>💬 SMS messages</div>
              <div>📝 Plain text</div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Images and camera frames are decoded on your device and never uploaded.
            </p>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
