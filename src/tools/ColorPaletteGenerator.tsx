import React, { useEffect, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaPalette, FaCopy, FaRandom, FaDownload } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  PALETTE_TYPES,
  PaletteColor,
  PaletteType,
  generatePalette,
  hslToHex,
  normalizeHex,
  paletteToCss,
  readableTextColor,
} from './lib/colorPalette';

const DEFAULT_COLOR = '#3b82f6';

/** Random vivid-ish colour for the "Random" button. Not security sensitive. */
const randomBaseColor = (): string =>
  hslToHex({ h: Math.random() * 360, s: 55 + Math.random() * 35, l: 40 + Math.random() * 25 });

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState(DEFAULT_COLOR);
  // Free-text draft for the hex field, so typing "#3b" does not blank the palette.
  const [hexDraft, setHexDraft] = useState(DEFAULT_COLOR);
  const [paletteType, setPaletteType] = useState<PaletteType>('complementary');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const track = useToolTracking('color-palette-generator', 'Color Palette Generator');

  const baseId = useId();
  const pickerId = `${baseId}-picker`;
  const hexId = `${baseId}-hex`;
  const hexErrorId = `${baseId}-hex-error`;
  const typeId = `${baseId}-type`;

  const palette = useMemo(() => generatePalette(baseColor, paletteType), [baseColor, paletteType]);
  const hexIsValid = normalizeHex(hexDraft) !== null;
  const activeType = PALETTE_TYPES.find((t) => t.id === paletteType);

  // Revoke the previous download blob once a new one replaces it, and on unmount.
  useEffect(() => {
    if (!downloadUrl) return;
    return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  const applyColor = (hex: string) => {
    setBaseColor(hex);
    setHexDraft(hex);
  };

  const handleHexChange = (value: string) => {
    setHexDraft(value);
    const normalized = normalizeHex(value);
    if (normalized) setBaseColor(normalized);
  };

  const handleRandom = () => {
    applyColor(randomBaseColor());
    track('generate');
  };

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(message);
      track('copy');
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  const downloadCss = () => {
    if (palette.length === 0) return;
    const url = URL.createObjectURL(new Blob([paletteToCss(palette)], { type: 'text/css' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-${paletteType}-${baseColor.slice(1)}.css`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Keep the URL alive until the next download or unmount; revoking synchronously
    // can cancel the download in some browsers.
    setDownloadUrl(url);
    track('download');
  };

  return (
    <ToolWrapper
      toolId="color-palette-generator"
      toolName="AI Color Palette Generator"
      toolDescription="Generate beautiful color palettes for your designs. Create harmonious color schemes with complementary, triadic, and monochromatic options"
      toolCategory="Design"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaPalette} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Color Palette Generator</h2>
          </div>

          {/* Controls */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div>
              <label htmlFor={hexId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Base Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={pickerId}
                  type="color"
                  value={baseColor}
                  onChange={(e) => applyColor(e.target.value)}
                  aria-label="Pick base color"
                  className="w-12 h-12 shrink-0 p-1 rounded-lg cursor-pointer bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600"
                />
                <input
                  id={hexId}
                  type="text"
                  value={hexDraft}
                  onChange={(e) => handleHexChange(e.target.value)}
                  onBlur={() => {
                    // Tidy "38F" to "#3388ff" once the user leaves the field.
                    if (hexIsValid) setHexDraft(baseColor);
                  }}
                  spellCheck={false}
                  autoComplete="off"
                  maxLength={7}
                  aria-invalid={!hexIsValid}
                  aria-describedby={hexIsValid ? undefined : hexErrorId}
                  className="flex-1 min-w-0 p-3 rounded-lg font-mono bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              {!hexIsValid && (
                <p id={hexErrorId} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Enter a hex color like #3b82f6 or #38f.
                </p>
              )}
            </div>

            <div>
              <label htmlFor={typeId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Palette Type
              </label>
              <select
                id={typeId}
                value={paletteType}
                onChange={(e) => setPaletteType(e.target.value as PaletteType)}
                className="w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {PALETTE_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-gray-800">
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={handleRandom}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                <IconWrapper icon={FaRandom} />
                Random
              </button>
              <button
                type="button"
                onClick={downloadCss}
                disabled={palette.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <IconWrapper icon={FaDownload} />
                CSS
              </button>
            </div>
          </div>

          {activeType && <p className="-mt-2 mb-4 text-sm text-gray-500 dark:text-gray-400">{activeType.description}</p>}

          {/* Swatches */}
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6" aria-label="Generated palette">
            {palette.map((color: PaletteColor, index) => (
              <li
                key={`${color.hex}-${index}`}
                className="rounded-lg overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:shadow-lg transition-shadow"
              >
                <button
                  type="button"
                  onClick={() => copyText(color.hex, `Copied ${color.hex}`)}
                  aria-label={`Copy ${color.hex}`}
                  className="group w-full h-24 sm:h-32 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500"
                  style={{ backgroundColor: color.hex, color: readableTextColor(color.hex) }}
                >
                  <IconWrapper
                    icon={FaCopy}
                    className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity"
                  />
                </button>
                <div className="p-3 text-xs font-mono text-gray-600 dark:text-gray-300 break-all">
                  <div className="font-bold text-gray-900 dark:text-white">{color.hex}</div>
                  <button
                    type="button"
                    onClick={() => copyText(color.rgb, `Copied ${color.rgb}`)}
                    className="block mt-1 text-left hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {color.rgb}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(color.hsl, `Copied ${color.hsl}`)}
                    className="block text-left hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {color.hsl}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Preview strip */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Preview</h3>
            <div
              className="flex h-16 sm:h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-white/20"
              aria-hidden="true"
            >
              {palette.map((color, index) => (
                <div key={`${color.hex}-${index}`} className="flex-1" style={{ backgroundColor: color.hex }} />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🎨 Palette Types</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                {PALETTE_TYPES.map((t) => (
                  <li key={t.id}>
                    • <strong className="text-gray-900 dark:text-white">{t.label}:</strong> {t.description}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
              <h3 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">💡 Usage Tips</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Click a swatch to copy its hex code, or click the RGB/HSL value to copy that</li>
                <li>• Use the 60-30-10 rule: 60% primary, 30% secondary, 10% accent</li>
                <li>• Check text/background pairs with a contrast checker (WCAG AA is 4.5:1)</li>
                <li>• Download the palette as CSS custom properties</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
