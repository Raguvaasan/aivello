import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { FaDownload, FaCopy, FaQrcode } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { contrastRatio, hexToRgb, relativeLuminance } from './lib/colorPalette';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

/** Byte-mode capacity of a version-40 QR code at each error-correction level. */
const LEVELS: ReadonlyArray<{ id: ErrorLevel; label: string; capacity: number }> = [
  { id: 'L', label: 'Low (7% recovery)', capacity: 2953 },
  { id: 'M', label: 'Medium (15% recovery)', capacity: 2331 },
  { id: 'Q', label: 'Quartile (25% recovery)', capacity: 1663 },
  { id: 'H', label: 'High (30% recovery)', capacity: 1273 },
];

const MIN_SIZE = 128;
const MAX_SIZE = 1024;
/** The QR spec asks for a 4-module quiet zone; many scanners fail without one. */
const QUIET_ZONE_MODULES = 4;

const utf8Length = (text: string): number => new TextEncoder().encode(text).length;

const canvasToPngBlob = (source: HTMLCanvasElement, size: number): Promise<Blob | null> => {
  // QRCodeCanvas renders at devicePixelRatio for sharpness; export at exactly `size` px.
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, size, size);
  return new Promise((resolve) => out.toBlob(resolve, 'image/png'));
};

export default function QrCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState<ErrorLevel>('M');
  const [quietZone, setQuietZone] = useState(true);
  const track = useToolTracking('qr-generator', 'QR Code Generator');

  const baseId = useId();
  const textId = `${baseId}-text`;
  const sizeId = `${baseId}-size`;
  const fgId = `${baseId}-fg`;
  const bgId = `${baseId}-bg`;
  const levelId = `${baseId}-level`;
  const marginId = `${baseId}-margin`;
  const statusId = `${baseId}-status`;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    },
    []
  );

  const bytes = useMemo(() => utf8Length(text), [text]);
  const capacity = LEVELS.find((l) => l.id === level)?.capacity ?? 2331;
  const tooLong = bytes > capacity;
  const canRender = text.length > 0 && !tooLong;

  const contrastWarning = useMemo(() => {
    const fg = hexToRgb(fgColor);
    const bg = hexToRgb(bgColor);
    if (!fg || !bg) return null;
    if (contrastRatio(fg, bg) < 3) return 'Low contrast between colors: scanners may not be able to read this code.';
    if (relativeLuminance(fg) > relativeLuminance(bg)) {
      return 'Light-on-dark codes are not supported by every scanner. Dark on light is safest.';
    }
    return null;
  }, [fgColor, bgColor]);

  const triggerDownload = (blob: Blob, filename: string) => {
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    const url = URL.createObjectURL(blob);
    lastUrlRef.current = url;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canRender) return;
    const blob = await canvasToPngBlob(canvas, size);
    if (!blob) {
      toast.error('Could not create the PNG in this browser.');
      return;
    }
    triggerDownload(blob, 'qr-code.png');
    track('download');
  };

  const downloadSvg = () => {
    const svg = svgRef.current;
    if (!svg || !canRender) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // The preview is scaled with CSS; the file should use its real pixel size.
    clone.removeAttribute('style');
    clone.removeAttribute('class');
    clone.setAttribute('width', String(size));
    clone.setAttribute('height', String(size));
    const markup = `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(clone)}`;
    triggerDownload(new Blob([markup], { type: 'image/svg+xml' }), 'qr-code.svg');
    track('download');
  };

  const clipboardImageSupported =
    typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write);

  const copyPng = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canRender) return;
    try {
      const blob = await canvasToPngBlob(canvas, size);
      if (!blob) throw new Error('no-blob');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      toast.success('QR code copied as an image');
      track('copy');
    } catch {
      toast.error('Could not copy the image. Use Download instead.');
    }
  };

  const inputClass =
    'w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
  const labelClass = 'block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2';
  const secondaryButton =
    'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const qrProps = {
    value: text,
    size,
    level,
    fgColor,
    bgColor,
    marginSize: quietZone ? QUIET_ZONE_MODULES : 0,
  };

  return (
    <ToolWrapper
      toolId="qr-generator"
      toolName="QR Code Generator"
      toolDescription="Generate QR codes instantly for any text or URL. Free, fast, and easy-to-use QR code generator tool"
      toolCategory="Utilities"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaQrcode} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Generator</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Settings */}
            <div className="space-y-5 min-w-0">
              <div>
                <label htmlFor={textId} className={labelClass}>
                  Text or URL
                </label>
                <textarea
                  id={textId}
                  rows={4}
                  placeholder="https://example.com"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-invalid={tooLong}
                  aria-describedby={statusId}
                  className={`${inputClass} resize-y`}
                />
                <p
                  id={statusId}
                  className={`mt-1 text-xs ${tooLong ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
                  role={tooLong ? 'alert' : undefined}
                >
                  {tooLong
                    ? `Too long for a QR code at this error-correction level: ${bytes.toLocaleString()} of ${capacity.toLocaleString()} bytes. Shorten the text or choose a lower level.`
                    : `${bytes.toLocaleString()} / ${capacity.toLocaleString()} bytes`}
                </p>
              </div>

              <div>
                <label htmlFor={sizeId} className={labelClass}>
                  Size: <span className="font-bold text-purple-600 dark:text-purple-400">{size}px</span>
                </label>
                <input
                  id={sizeId}
                  type="range"
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  step={32}
                  value={size}
                  aria-valuetext={`${size} pixels`}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 rounded-lg cursor-pointer accent-purple-600 bg-gray-200 dark:bg-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor={fgId} className={labelClass}>
                    Foreground
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={fgId}
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="h-10 w-12 shrink-0 p-1 rounded-lg cursor-pointer bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600"
                    />
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{fgColor}</span>
                  </div>
                </div>
                <div>
                  <label htmlFor={bgId} className={labelClass}>
                    Background
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={bgId}
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="h-10 w-12 shrink-0 p-1 rounded-lg cursor-pointer bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600"
                    />
                    <span className="font-mono text-sm text-gray-600 dark:text-gray-300">{bgColor}</span>
                  </div>
                </div>
              </div>
              {contrastWarning && (
                <p role="alert" className="text-xs text-amber-700 dark:text-amber-300">
                  ⚠️ {contrastWarning}
                </p>
              )}

              <div>
                <label htmlFor={levelId} className={labelClass}>
                  Error correction
                </label>
                <select
                  id={levelId}
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ErrorLevel)}
                  className={inputClass}
                >
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id} className="bg-white dark:bg-gray-800">
                      {l.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Higher levels survive damage or a logo overlay, but hold less data.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id={marginId}
                  type="checkbox"
                  checked={quietZone}
                  onChange={(e) => setQuietZone(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor={marginId} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  Include quiet-zone margin (recommended)
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 min-w-0">
              {canRender ? (
                <>
                  <div className="w-full max-w-[256px] rounded-lg overflow-hidden shadow-sm">
                    <QRCodeSVG
                      {...qrProps}
                      ref={svgRef}
                      title="Generated QR code"
                      role="img"
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                  {/* Full-resolution canvas used only for PNG export and copy. */}
                  <QRCodeCanvas {...qrProps} ref={canvasRef} className="hidden" aria-hidden="true" />

                  <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => void downloadPng()}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
                    >
                      <IconWrapper icon={FaDownload} />
                      PNG
                    </button>
                    <button type="button" onClick={downloadSvg} className={secondaryButton}>
                      <IconWrapper icon={FaDownload} />
                      SVG
                    </button>
                    {clipboardImageSupported && (
                      <button type="button" onClick={() => void copyPng()} className={`${secondaryButton} col-span-2`}>
                        <IconWrapper icon={FaCopy} />
                        Copy image
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
                    PNG exports at {size}×{size}px. SVG scales to any size without blurring.
                  </p>
                </>
              ) : (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                  <IconWrapper icon={FaQrcode} className="text-5xl mx-auto mb-3 opacity-40" />
                  <p>{tooLong ? 'Shorten the text to generate a QR code' : 'Enter text or a URL to generate a QR code'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
