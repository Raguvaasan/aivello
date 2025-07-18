import React, { useState, useCallback } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaPalette, FaCopy, FaRedo, FaDownload } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

interface Color {
  hex: string;
  rgb: string;
  hsl: string;
}

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#3B82F6');
  const [paletteType, setPaletteType] = useState('complementary');
  const [palette, setPalette] = useState<Color[]>([]);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const generatePalette = useCallback(() => {
    const { r, g, b } = hexToRgb(baseColor);
    const { h, s, l } = rgbToHsl(r, g, b);
    const colors: Color[] = [];

    const createColor = (newH: number, newS: number, newL: number): Color => {
      const hex = hslToHex(newH, newS, newL);
      const rgb = hexToRgb(hex);
      return {
        hex,
        rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
        hsl: `hsl(${newH}, ${newS}%, ${newL}%)`
      };
    };

    switch (paletteType) {
      case 'complementary':
        colors.push(createColor(h, s, l));
        colors.push(createColor((h + 180) % 360, s, l));
        colors.push(createColor(h, s * 0.7, l + 20));
        colors.push(createColor((h + 180) % 360, s * 0.7, l + 20));
        colors.push(createColor(h, s * 0.4, l + 40));
        break;

      case 'analogous':
        for (let i = -2; i <= 2; i++) {
          colors.push(createColor((h + i * 30) % 360, s, l));
        }
        break;

      case 'triadic':
        colors.push(createColor(h, s, l));
        colors.push(createColor((h + 120) % 360, s, l));
        colors.push(createColor((h + 240) % 360, s, l));
        colors.push(createColor(h, s * 0.6, l + 25));
        colors.push(createColor((h + 60) % 360, s * 0.6, l + 25));
        break;

      case 'monochromatic':
        const lightnesses = [l - 40, l - 20, l, l + 20, l + 30];
        lightnesses.forEach(newL => {
          colors.push(createColor(h, s, Math.max(10, Math.min(90, newL))));
        });
        break;

      case 'tetradic':
        colors.push(createColor(h, s, l));
        colors.push(createColor((h + 90) % 360, s, l));
        colors.push(createColor((h + 180) % 360, s, l));
        colors.push(createColor((h + 270) % 360, s, l));
        colors.push(createColor(h, s * 0.5, l + 30));
        break;

      default:
        colors.push(createColor(h, s, l));
    }

    setPalette(colors);
  }, [baseColor, paletteType]);

  const copyColor = (color: Color) => {
    navigator.clipboard.writeText(color.hex);
    alert(`Color ${color.hex} copied to clipboard!`);
  };

  const downloadPalette = () => {
    const css = palette.map((color, index) => 
      `--color-${index + 1}: ${color.hex}; /* ${color.rgb} */`
    ).join('\n');
    
    const content = `:root {\n${css}\n}`;
    const blob = new Blob([content], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-palette.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  React.useEffect(() => {
    generatePalette();
  }, [generatePalette]);

  return (
    <ToolWrapper
      toolId="color-palette-generator"
      toolName="AI Color Palette Generator"
      toolDescription="Generate beautiful color palettes for your designs. Create harmonious color schemes with complementary, triadic, and monochromatic options"
      toolCategory="Design"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaPalette} className="text-3xl text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Color Palette Generator
            </h2>
          </div>

          {/* Controls */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Palette Type
              </label>
              <select
                value={paletteType}
                onChange={(e) => setPaletteType(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="complementary">Complementary</option>
                <option value="analogous">Analogous</option>
                <option value="triadic">Triadic</option>
                <option value="monochromatic">Monochromatic</option>
                <option value="tetradic">Tetradic</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={generatePalette}
                className="flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <IconWrapper icon={FaRedo} />
                Generate
              </button>
              <button
                onClick={downloadPalette}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <IconWrapper icon={FaDownload} />
                CSS
              </button>
            </div>
          </div>

          {/* Palette Display */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {palette.map((color, index) => (
              <div
                key={index}
                className="group relative bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-32 cursor-pointer relative"
                  style={{ backgroundColor: color.hex }}
                  onClick={() => copyColor(color)}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <IconWrapper icon={FaCopy} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs font-mono text-gray-600 dark:text-gray-300">
                    <div className="font-bold text-gray-900 dark:text-white">{color.hex}</div>
                    <div className="mt-1">{color.rgb}</div>
                    <div>{color.hsl}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Palette Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Preview</h3>
            <div className="flex h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
              {palette.map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color.hex }}
                ></div>
              ))}
            </div>
          </div>

          {/* Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-purple-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">🎨 Palette Types:</h3>
              <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1">
                <li>• <strong>Complementary:</strong> Colors opposite on the color wheel</li>
                <li>• <strong>Analogous:</strong> Colors next to each other</li>
                <li>• <strong>Triadic:</strong> Three colors evenly spaced</li>
                <li>• <strong>Monochromatic:</strong> Variations of a single hue</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">💡 Usage Tips:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                <li>• Click any color to copy its hex code</li>
                <li>• Use 60-30-10 rule: 60% primary, 30% secondary, 10% accent</li>
                <li>• Test accessibility with color contrast checkers</li>
                <li>• Download CSS variables for easy implementation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
