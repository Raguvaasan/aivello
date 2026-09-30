import { useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  clampCount,
  generateLorem,
  randomSeed,
  LOREM_MAX_COUNT,
  LOREM_MIN_COUNT,
  type LoremFormat,
  type LoremUnit,
} from '../utils/tools/lorem';
import { countWords } from '../utils/tools/caseConvert';
import { downloadBlob } from '../utils/tools/fileUtils';

const TOOL_ID = 'lorem-ipsum-generator';
const TOOL_NAME = 'Lorem Ipsum Generator';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-5 py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';
const PILL =
  'flex items-center justify-center min-h-[44px] px-3 rounded-xl border text-sm font-medium cursor-pointer transition-colors border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 peer-checked:border-purple-500 peer-checked:bg-purple-50 peer-checked:text-purple-700 dark:peer-checked:bg-purple-500/20 dark:peer-checked:text-purple-100 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50';

const UNITS: { id: LoremUnit; label: string }[] = [
  { id: 'paragraphs', label: 'Paragraphs' },
  { id: 'sentences', label: 'Sentences' },
  { id: 'words', label: 'Words' },
];

const FORMATS: { id: LoremFormat; label: string }[] = [
  { id: 'text', label: 'Plain text' },
  { id: 'html', label: 'HTML <p>' },
];

export default function LoremIpsumGenerator() {
  const uid = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);

  const [unit, setUnit] = useState<LoremUnit>('paragraphs');
  const [countInput, setCountInput] = useState('3');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [format, setFormat] = useState<LoremFormat>('text');
  // A fixed first seed renders a sample immediately; "Generate" draws a fresh one.
  const [seed, setSeed] = useState(20260930);

  const count = clampCount(Number(countInput));
  const countOutOfRange = countInput.trim() !== '' && Number(countInput) !== count;

  const output = useMemo(
    () => generateLorem({ unit, count, startWithLorem, format, seed }),
    [unit, count, startWithLorem, format, seed]
  );
  const stats = useMemo(() => {
    const plain = format === 'html' ? output.replace(/<\/?p>/g, ' ') : output;
    return { words: countWords(plain), characters: output.length };
  }, [output, format]);

  const regenerate = () => {
    setCountInput(String(count));
    setSeed(randomSeed());
    track('generate');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      toast.success('Copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy - your browser blocked clipboard access.');
    }
  };

  const download = () => {
    downloadBlob(new Blob([output], { type: 'text/plain;charset=utf-8' }), 'lorem-ipsum.txt');
    track('download');
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate lorem ipsum placeholder text by paragraphs, sentences or words, as plain text or HTML. Copy or download instantly."
      toolCategory="Writing"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">📃</span> Lorem Ipsum Generator
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Placeholder text for mockups and layouts - as many paragraphs, sentences or words as you need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className={`${CARD} lg:col-span-1 space-y-5`} aria-label="Options">
            <fieldset>
              <legend className="font-semibold text-gray-900 dark:text-white mb-2">Generate</legend>
              <div className="grid grid-cols-3 gap-2">
                {UNITS.map((u) => (
                  <div key={u.id}>
                    <input
                      type="radio"
                      id={`${uid}-unit-${u.id}`}
                      name={`${uid}-unit`}
                      value={u.id}
                      checked={unit === u.id}
                      onChange={() => setUnit(u.id)}
                      className="peer sr-only"
                    />
                    <label htmlFor={`${uid}-unit-${u.id}`} className={PILL}>
                      {u.label}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${uid}-count`} className="block font-semibold text-gray-900 dark:text-white mb-2">
                How many {unit}?
              </label>
              <input
                id={`${uid}-count`}
                type="number"
                inputMode="numeric"
                min={LOREM_MIN_COUNT}
                max={LOREM_MAX_COUNT}
                step={1}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onBlur={() => setCountInput(String(count))}
                aria-describedby={`${uid}-count-hint`}
                className={INPUT}
              />
              <p
                id={`${uid}-count-hint`}
                className={`mt-1 text-sm ${countOutOfRange ? 'text-amber-700 dark:text-amber-300' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {countOutOfRange
                  ? `Using ${count} - choose between ${LOREM_MIN_COUNT} and ${LOREM_MAX_COUNT}.`
                  : `Between ${LOREM_MIN_COUNT} and ${LOREM_MAX_COUNT}.`}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                id={`${uid}-start`}
                type="checkbox"
                checked={startWithLorem}
                onChange={(e) => setStartWithLorem(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-purple-600 accent-purple-600 focus:ring-2 focus:ring-purple-500/50"
              />
              <label htmlFor={`${uid}-start`} className="text-gray-700 dark:text-gray-200">
                Start with &ldquo;Lorem ipsum dolor sit amet&rdquo;
              </label>
            </div>

            <fieldset>
              <legend className="font-semibold text-gray-900 dark:text-white mb-2">Format</legend>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map((f) => (
                  <div key={f.id}>
                    <input
                      type="radio"
                      id={`${uid}-format-${f.id}`}
                      name={`${uid}-format`}
                      value={f.id}
                      checked={format === f.id}
                      onChange={() => setFormat(f.id)}
                      className="peer sr-only"
                    />
                    <label htmlFor={`${uid}-format-${f.id}`} className={PILL}>
                      {f.label}
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>

            <button type="button" onClick={regenerate} className={`${PRIMARY_BTN} w-full`}>
              <IconWrapper icon={FiRefreshCw} className="w-4 h-4" />
              Generate new text
            </button>
          </section>

          <section className={`${CARD} lg:col-span-2 flex flex-col min-w-0`} aria-label="Generated text">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <label htmlFor={`${uid}-output`} className="font-semibold text-gray-900 dark:text-white">
                Your placeholder text
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={copy} className={SECONDARY_BTN} aria-label="Copy text to clipboard">
                  <IconWrapper icon={FiCopy} className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button type="button" onClick={download} className={SECONDARY_BTN} aria-label="Download as .txt file">
                  <IconWrapper icon={FiDownload} className="w-4 h-4" />
                  <span className="hidden sm:inline">.txt</span>
                </button>
              </div>
            </div>
            <textarea
              id={`${uid}-output`}
              readOnly
              value={output}
              rows={14}
              aria-describedby={`${uid}-stats`}
              className={`${INPUT} flex-1 resize-y min-h-[16rem] ${format === 'html' ? 'font-mono text-sm' : ''} leading-relaxed`}
            />
            <p id={`${uid}-stats`} aria-live="polite" className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {count} {count === 1 ? unit.replace(/s$/, '') : unit} &middot; {stats.words.toLocaleString()} words &middot;{' '}
              {stats.characters.toLocaleString()} characters
            </p>
          </section>
        </div>
      </div>
    </ToolWrapper>
  );
}
