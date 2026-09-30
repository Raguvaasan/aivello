import { useDeferredValue, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiTrash2 } from 'react-icons/fi';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { CASE_CONVERSIONS, countCharacters, countWords } from '../utils/tools/caseConvert';

const TOOL_ID = 'case-converter';
const TOOL_NAME = 'Case Converter';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';

export default function CaseConverter() {
  const inputId = useId();
  const countsId = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const [text, setText] = useState('');
  // Keeps typing responsive on very long input: the 11 conversions render a beat later.
  const deferredText = useDeferredValue(text);

  const outputs = useMemo(
    () => CASE_CONVERSIONS.map((c) => ({ ...c, value: deferredText ? c.convert(deferredText) : '' })),
    [deferredText]
  );
  const characters = useMemo(() => countCharacters(deferredText), [deferredText]);
  const words = useMemo(() => countWords(deferredText), [deferredText]);
  const lines = deferredText ? deferredText.split('\n').length : 0;

  const copy = async (label: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
      track('copy');
    } catch {
      toast.error('Could not copy - your browser blocked clipboard access.');
    }
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Convert text to UPPER, lower, Title, Sentence, camelCase, PascalCase, snake_case, kebab-case and more. Free, private and instant."
      toolCategory="Writing"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">🔠</span> Case Converter
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Paste text once and get it in eleven cases. Everything happens in your browser.
          </p>
        </div>

        <section className={`${CARD} mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor={inputId} className="font-semibold text-gray-900 dark:text-white">
              Your text
            </label>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => setText('')}
              disabled={!text}
              aria-label="Clear text"
            >
              <IconWrapper icon={FiTrash2} className="w-4 h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
          <textarea
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            spellCheck={false}
            aria-describedby={countsId}
            className={`${INPUT} resize-y min-h-[9rem]`}
            placeholder="Type or paste text, e.g. the quick brown fox jumps over the lazy dog"
          />
          <p id={countsId} aria-live="polite" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            <span>
              <strong className="text-gray-900 dark:text-white">{characters.toLocaleString()}</strong> characters
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{words.toLocaleString()}</strong> words
            </span>
            <span>
              <strong className="text-gray-900 dark:text-white">{lines.toLocaleString()}</strong> lines
            </span>
          </p>
        </section>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Converted text">
          {outputs.map((o) => (
            <li key={o.id} className={`${CARD} min-w-0 flex flex-col`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white break-all">{o.label}</h3>
                <button
                  type="button"
                  className={SECONDARY_BTN}
                  onClick={() => copy(o.label, o.value)}
                  disabled={!o.value}
                  aria-label={`Copy ${o.label} result`}
                >
                  <IconWrapper icon={FiCopy} className="w-4 h-4" />
                </button>
              </div>
              <div
                className={`flex-1 min-h-[3rem] max-h-40 overflow-y-auto rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-white/10 px-3 py-2 text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                  o.value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 italic'
                }`}
              >
                {o.value || o.example}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ToolWrapper>
  );
}
