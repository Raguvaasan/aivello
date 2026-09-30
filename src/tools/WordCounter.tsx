import React, { useDeferredValue, useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  DEFAULT_READING_WPM,
  DEFAULT_SPEAKING_WPM,
  countCharacters,
  countCharactersNoSpaces,
  countLines,
  countParagraphs,
  countSentences,
  countWords,
  durationSeconds,
  formatDuration,
  topKeywords,
} from './lib/textStats';

const cardClass =
  'bg-gray-50 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl p-4';

export default function WordCounter() {
  const [text, setText] = useState('');
  // Stats lag a frame behind on very long text instead of blocking typing.
  const deferredText = useDeferredValue(text);
  const track = useToolTracking('word-counter', 'Word Counter');
  const inputId = useId();

  const stats = useMemo(() => {
    const words = countWords(deferredText);
    const sentences = countSentences(deferredText);
    return {
      words,
      characters: countCharacters(deferredText),
      noSpaces: countCharactersNoSpaces(deferredText),
      sentences,
      paragraphs: countParagraphs(deferredText),
      lines: countLines(deferredText),
      avgWordsPerSentence: sentences > 0 ? words / sentences : 0,
      readingSeconds: durationSeconds(words, DEFAULT_READING_WPM),
      speakingSeconds: durationSeconds(words, DEFAULT_SPEAKING_WPM),
      keywords: topKeywords(deferredText, 10),
    };
  }, [deferredText]);

  const copyStats = async () => {
    const summary = [
      `Words: ${stats.words}`,
      `Characters: ${stats.characters}`,
      `Characters (no spaces): ${stats.noSpaces}`,
      `Sentences: ${stats.sentences}`,
      `Paragraphs: ${stats.paragraphs}`,
      `Reading time: ${formatDuration(stats.readingSeconds)}`,
      `Speaking time: ${formatDuration(stats.speakingSeconds)}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      toast.success('Statistics copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  const primaryStats = [
    { label: 'Words', value: stats.words.toLocaleString(), color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Characters', value: stats.characters.toLocaleString(), color: 'text-pink-600 dark:text-pink-400' },
    { label: 'No Spaces', value: stats.noSpaces.toLocaleString(), color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Reading Time', value: formatDuration(stats.readingSeconds), color: 'text-green-600 dark:text-green-400' },
  ];

  return (
    <ToolWrapper
      toolId="word-counter"
      toolName="Word Counter Tool"
      toolDescription="Count words, characters, paragraphs, and reading time instantly. Free online word counting tool"
      toolCategory="Writing"
    >
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
            📊 Word Counter
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Count words, characters, paragraphs, and reading time instantly
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-2xl">
          <label htmlFor={inputId} className="sr-only">
            Text to count
          </label>
          <textarea
            id={inputId}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 rounded-xl mb-3 resize-y bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Type or paste your content here to get instant word count statistics..."
          />
          <div className="flex flex-wrap justify-end gap-2 mb-6">
            <button
              type="button"
              onClick={() => void copyStats()}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copy statistics
            </button>
            <button
              type="button"
              onClick={() => setText('')}
              disabled={!text}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>

          {/* Statistics */}
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4" aria-live="polite">
            {primaryStats.map((s) => (
              // dt must precede dd in the markup; flex-col-reverse shows the value on top.
              <div key={s.label} className={`${cardClass} text-center flex flex-col-reverse`}>
                <dt className="text-sm text-gray-600 dark:text-gray-400">{s.label}</dt>
                <dd className={`text-xl sm:text-2xl font-bold mb-1 break-words ${s.color}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          {text.trim() && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={cardClass}>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">📝 Text Analysis</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Sentences', stats.sentences.toLocaleString()],
                    ['Paragraphs', stats.paragraphs.toLocaleString()],
                    ['Lines', stats.lines.toLocaleString()],
                    ['Avg. words / sentence', stats.avgWordsPerSentence.toFixed(1)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className={cardClass}>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">⏱️ Reading & Speaking Time</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    ['Slow reader (150 WPM)', formatDuration(durationSeconds(stats.words, 150))],
                    [`Average reader (${DEFAULT_READING_WPM} WPM)`, formatDuration(stats.readingSeconds)],
                    ['Fast reader (300 WPM)', formatDuration(durationSeconds(stats.words, 300))],
                    [`Speaking (${DEFAULT_SPEAKING_WPM} WPM)`, formatDuration(stats.speakingSeconds)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-2">
                      <dt className="text-gray-600 dark:text-gray-400">{label}</dt>
                      <dd className="text-gray-900 dark:text-white font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {stats.keywords.length > 0 && (
                <div className={`${cardClass} md:col-span-2`}>
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-3">🔑 Top Keywords</h3>
                  <ol className="flex flex-wrap gap-2">
                    {stats.keywords.map((k) => (
                      <li
                        key={k.word}
                        className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 break-all"
                      >
                        {k.word}{' '}
                        <span className="text-purple-500 dark:text-purple-400/80">
                          ×{k.count} · {k.density.toFixed(1)}%
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Common words like “the” and “and” are excluded. Percentages are keyword density.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ToolWrapper>
  );
}
