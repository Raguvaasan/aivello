import { useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiCopy, FiRepeat, FiX, FiZap } from 'react-icons/fi';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  contrastRatioHex,
  evaluateContrast,
  formatRatio,
  normalizeHex,
  suggestPassingColor,
  WCAG_CHECKS,
} from '../utils/tools/contrast';

const TOOL_ID = 'color-contrast-checker';
const TOOL_NAME = 'Color Contrast Checker';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full min-w-0 bg-white dark:bg-gray-800/60 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-5 py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  onCopy: (hex: string) => void;
}

/** A native colour picker paired with a hex text box that only commits valid values. */
function ColorField({ label, value, onChange, onCopy }: ColorFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Sync the text box when the colour changes from outside (picker, swap, suggestion).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  const invalid = normalizeHex(draft) === null;

  const handleText = (text: string) => {
    setDraft(text);
    const hex = normalizeHex(text);
    if (hex) {
      setLastValue(hex);
      onChange(hex);
    }
  };

  return (
    <div className="min-w-0">
      <label htmlFor={`${id}-hex`} className="block font-semibold text-gray-900 dark:text-white mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          aria-label={`${label} colour picker`}
          className="h-12 w-14 shrink-0 cursor-pointer rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/60 p-1"
        />
        <input
          id={`${id}-hex`}
          type="text"
          value={draft}
          onChange={(e) => handleText(e.target.value)}
          onBlur={() => setDraft(value)}
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          className={`${INPUT} ${invalid ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
          placeholder="#RRGGBB"
        />
        <button type="button" className={SECONDARY_BTN} onClick={() => onCopy(value)} aria-label={`Copy ${label.toLowerCase()} hex`}>
          <IconWrapper icon={FiCopy} className="w-4 h-4" />
        </button>
      </div>
      {invalid && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
          Use #RGB or #RRGGBB, e.g. #7C3AED. Showing the last valid colour.
        </p>
      )}
    </div>
  );
}

function ratingLabel(ratio: number): string {
  if (ratio >= 7) return 'Excellent';
  if (ratio >= 4.5) return 'Good';
  if (ratio >= 3) return 'Large text only';
  return 'Poor';
}

export default function ColorContrastChecker() {
  const uid = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const [foreground, setForeground] = useState('#6b7280');
  const [background, setBackground] = useState('#ffffff');

  const ratio = useMemo(() => contrastRatioHex(foreground, background) ?? 1, [foreground, background]);
  const results = evaluateContrast(ratio);

  const swap = () => {
    setForeground(background);
    setBackground(foreground);
  };

  const suggest = (target: number, levelName: string) => {
    const suggestion = suggestPassingColor(foreground, background, target);
    if (!suggestion) {
      toast.error(`No colour with this hue reaches ${levelName} on that background.`);
      return;
    }
    if (suggestion === foreground) {
      toast.success(`Already passes ${levelName}.`);
      return;
    }
    setForeground(suggestion);
    toast.success(`Text colour changed to ${suggestion.toUpperCase()} to pass ${levelName}.`);
    track('analyze');
  };

  const copy = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex.toUpperCase());
      toast.success(`${hex.toUpperCase()} copied`);
      track('copy');
    } catch {
      toast.error('Could not copy - your browser blocked clipboard access.');
    }
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Check WCAG 2.x colour contrast ratios for AA and AAA, preview text on your colours and get a passing colour suggestion."
      toolCategory="Design"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">🌗</span> Color Contrast Checker
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test text and background colours against WCAG 2.x AA and AAA contrast requirements.
          </p>
        </div>

        <section className={`${CARD} mb-6`} aria-label="Colours">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:items-end">
            <ColorField label="Text colour" value={foreground} onChange={setForeground} onCopy={copy} />
            <button
              type="button"
              onClick={swap}
              className={`${SECONDARY_BTN} justify-self-center md:mb-0.5`}
              aria-label="Swap text and background colours"
            >
              <IconWrapper icon={FiRepeat} className="w-5 h-5" />
            </button>
            <ColorField label="Background colour" value={background} onChange={setBackground} onCopy={copy} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={CARD} aria-labelledby={`${uid}-result`}>
            <h3 id={`${uid}-result`} className="font-semibold text-gray-900 dark:text-white mb-4">
              Contrast ratio
            </h3>
            <div aria-live="polite" aria-atomic="true" className="text-center mb-6">
              <p className="text-5xl font-bold text-gray-900 dark:text-white tabular-nums">{formatRatio(ratio)}</p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">{ratingLabel(ratio)}</p>
            </div>

            <ul className="space-y-2">
              {WCAG_CHECKS.map((check) => {
                const pass = results[check.id];
                return (
                  <li
                    key={check.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {check.label} <span className="text-gray-500 dark:text-gray-400 font-normal">({check.threshold}:1)</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{check.description}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                        pass
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200'
                      }`}
                    >
                      <IconWrapper icon={pass ? FiCheck : FiX} className="w-4 h-4" />
                      {pass ? 'Pass' : 'Fail'}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-6 flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={() => suggest(4.5, 'AA')} className={`${PRIMARY_BTN} flex-1`}>
                <IconWrapper icon={FiZap} className="w-4 h-4" />
                Suggest a passing colour (AA)
              </button>
              <button type="button" onClick={() => suggest(7, 'AAA')} className={`${SECONDARY_BTN} flex-1`}>
                Fix for AAA
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Keeps the text colour&apos;s hue and nudges its lightness just enough to pass.
            </p>
          </section>

          <section className={CARD} aria-labelledby={`${uid}-preview`}>
            <h3 id={`${uid}-preview`} className="font-semibold text-gray-900 dark:text-white mb-4">
              Live preview
            </h3>
            <div
              className="rounded-xl border border-gray-200 dark:border-white/10 p-5 space-y-4 break-words"
              style={{ backgroundColor: background, color: foreground }}
            >
              <p className="text-2xl font-bold">Large text (24px bold)</p>
              <p className="text-[18.66px] font-bold">Large bold text (14pt)</p>
              <p className="text-base">
                Normal body text at 16px. The quick brown fox jumps over the lazy dog, and good contrast makes this easy to read for
                everyone.
              </p>
              <p className="text-sm">Small print at 14px - hardest to read with low contrast.</p>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-lg border-2 px-4 py-2 font-semibold"
                  style={{ borderColor: foreground }}
                >
                  <IconWrapper icon={FiCheck} className="w-4 h-4" />
                  Button outline
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: foreground }}>
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: background }} />
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Preview only - buttons and icons here are illustrations of UI components (3:1 rule).
            </p>
          </section>
        </div>
      </div>
    </ToolWrapper>
  );
}
