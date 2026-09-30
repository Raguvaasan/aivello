import React, { useDeferredValue, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaClock } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  DEFAULT_READING_WPM,
  DEFAULT_SPEAKING_WPM,
  countCharacters,
  countWords,
  durationSeconds,
  formatDuration,
} from './lib/textStats';

const READING_SPEEDS: ReadonlyArray<{ wpm: number; label: string }> = [
  { wpm: 150, label: 'Slow / careful (150 WPM)' },
  { wpm: 200, label: 'Relaxed (200 WPM)' },
  { wpm: DEFAULT_READING_WPM, label: `Average adult (${DEFAULT_READING_WPM} WPM)` },
  { wpm: 300, label: 'Fast (300 WPM)' },
  { wpm: 400, label: 'Skimming (400 WPM)' },
];

const SPEAKING_SPEEDS: ReadonlyArray<{ wpm: number; label: string }> = [
  { wpm: 110, label: 'Slow presentation (110 WPM)' },
  { wpm: DEFAULT_SPEAKING_WPM, label: `Conversational (${DEFAULT_SPEAKING_WPM} WPM)` },
  { wpm: 160, label: 'Podcast / audiobook (160 WPM)' },
];

export default function ReadTimeEstimator() {
  const [text, setText] = useState('');
  const [readingWpm, setReadingWpm] = useState(DEFAULT_READING_WPM);
  const [speakingWpm, setSpeakingWpm] = useState(DEFAULT_SPEAKING_WPM);
  const deferredText = useDeferredValue(text);
  const track = useToolTracking('read-time', 'Reading Time Calculator');

  const baseId = useId();
  const inputId = `${baseId}-input`;
  const readingId = `${baseId}-reading`;
  const speakingId = `${baseId}-speaking`;

  const words = useMemo(() => countWords(deferredText), [deferredText]);
  const characters = useMemo(() => countCharacters(deferredText), [deferredText]);
  const readingSeconds = durationSeconds(words, readingWpm);
  const speakingSeconds = durationSeconds(words, speakingWpm);

  const copySummary = async () => {
    const summary = `${words.toLocaleString()} words · ${formatDuration(readingSeconds)} read · ${formatDuration(speakingSeconds)} spoken`;
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Summary copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  const selectClass =
    'w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
  const cardClass = 'p-4 rounded-xl text-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10';

  return (
    <ToolWrapper
      toolId="read-time"
      toolName="Reading Time Calculator"
      toolDescription="Calculate reading time for any text. Perfect for blogs, articles, and content planning"
      toolCategory="Writing"
    >
      <div className="relative max-w-3xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaClock} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Read Time Estimator</h2>
          </div>

          <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Your content
          </label>
          <textarea
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-4 rounded-xl mb-4 resize-y bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Paste your article, blog post or script..."
          />

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <label htmlFor={readingId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Reading speed
              </label>
              <select
                id={readingId}
                value={readingWpm}
                onChange={(e) => setReadingWpm(Number(e.target.value))}
                className={selectClass}
              >
                {READING_SPEEDS.map((s) => (
                  <option key={s.wpm} value={s.wpm} className="bg-white dark:bg-gray-800">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={speakingId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Speaking speed
              </label>
              <select
                id={speakingId}
                value={speakingWpm}
                onChange={(e) => setSpeakingWpm(Number(e.target.value))}
                className={selectClass}
              >
                {SPEAKING_SPEEDS.map((s) => (
                  <option key={s.wpm} value={s.wpm} className="bg-white dark:bg-gray-800">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" aria-live="polite">
            {[
              { label: 'Words', value: words.toLocaleString(), color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Characters', value: characters.toLocaleString(), color: 'text-pink-600 dark:text-pink-400' },
              { label: 'Reading time', value: formatDuration(readingSeconds), color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Speaking time', value: formatDuration(speakingSeconds), color: 'text-green-600 dark:text-green-400' },
            ].map((s) => (
              <div key={s.label} className={`${cardClass} flex flex-col-reverse`}>
                <dt className="text-sm text-gray-600 dark:text-gray-400">{s.label}</dt>
                <dd className={`text-xl sm:text-2xl font-bold mb-1 break-words ${s.color}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void copySummary()}
              disabled={words === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy summary
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Average silent reading speed for adults is about {DEFAULT_READING_WPM} words per minute; comfortable speech is
            around {DEFAULT_SPEAKING_WPM}. Technical or unfamiliar material takes longer.
          </p>
        </div>
      </div>
    </ToolWrapper>
  );
}
