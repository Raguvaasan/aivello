import React, { useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaFileAlt, FaCopy, FaMagic, FaList } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  countWords,
  MAX_SUMMARY_INPUT,
  MIN_SUMMARY_SENTENCES,
  splitSentences,
  summarizeText,
  type Keyword,
  type SummaryFormat,
  type SummaryLength,
} from './lib/aiTextSummarizer';

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';

interface SummaryState {
  text: string;
  keywords: Keyword[];
  selected: number;
  total: number;
}

export default function AITextSummarizer() {
  const id = useId();
  const track = useToolTracking('ai-text-summarizer', 'AI Text Summarizer');
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState<SummaryState | null>(null);
  const [summaryType, setSummaryType] = useState<SummaryFormat>('bullet');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [error, setError] = useState<string | null>(null);

  const ids = {
    input: `${id}-input`,
    inputHelp: `${id}-input-help`,
    error: `${id}-error`,
    format: `${id}-format`,
    length: `${id}-length`,
    output: `${id}-output`,
  };

  const wordCount = useMemo(() => countWords(inputText), [inputText]);
  const summaryWordCount = useMemo(() => (summary ? countWords(summary.text) : 0), [summary]);

  const generateSummary = () => {
    const text = inputText.trim();
    if (!text) {
      setError('Paste the text you want to summarize.');
      return;
    }
    if (splitSentences(text).length < MIN_SUMMARY_SENTENCES) {
      setError(`Add a bit more text: at least ${MIN_SUMMARY_SENTENCES} sentences are needed to pick out the key points.`);
      return;
    }
    const result = summarizeText(text, summaryType, summaryLength);
    if (!result.text.trim()) {
      setError('Couldn’t find sentences to summarize. Make sure the text contains full sentences.');
      return;
    }
    setError(null);
    setSummary({ text: result.text, keywords: result.keywords, selected: result.selectedCount, total: result.sentenceCount });
    track('generate');
  };

  const copyToClipboard = async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary.text);
      toast.success('Summary copied to clipboard');
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const compression = summary && wordCount > 0 ? Math.max(0, Math.round((1 - summaryWordCount / wordCount) * 100)) : 0;

  return (
    <ToolWrapper
      toolId="ai-text-summarizer"
      toolName="AI Text Summarizer"
      toolDescription="Summarize long articles, documents, and texts instantly. Extract key points and main ideas with AI-powered text summarization"
      toolCategory="Writing"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaFileAlt} className="text-3xl text-blue-600 dark:text-blue-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Text Summarizer</h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-purple-600 dark:text-purple-400 shrink-0" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className={LABEL} htmlFor={ids.input}>
                  Original text
                </label>
                <textarea
                  id={ids.input}
                  value={inputText}
                  maxLength={MAX_SUMMARY_INPUT}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste your article, document, or long text here…"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`${ids.inputHelp}${error ? ` ${ids.error}` : ''}`}
                  className={`${INPUT} h-80 resize-y`}
                />
                <p id={ids.inputHelp} className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {wordCount} words
                </p>
                {error && (
                  <p id={ids.error} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL} htmlFor={ids.format}>
                    Summary format
                  </label>
                  <select
                    id={ids.format}
                    value={summaryType}
                    onChange={(e) => setSummaryType(e.target.value as SummaryFormat)}
                    className={INPUT}
                  >
                    <option value="bullet" className="bg-white dark:bg-gray-800">
                      Bullet points
                    </option>
                    <option value="paragraph" className="bg-white dark:bg-gray-800">
                      Paragraph
                    </option>
                    <option value="structured" className="bg-white dark:bg-gray-800">
                      Structured (main idea + key points)
                    </option>
                  </select>
                </div>
                <div>
                  <label className={LABEL} htmlFor={ids.length}>
                    Summary length
                  </label>
                  <select
                    id={ids.length}
                    value={summaryLength}
                    onChange={(e) => setSummaryLength(e.target.value as SummaryLength)}
                    className={INPUT}
                  >
                    <option value="short" className="bg-white dark:bg-gray-800">
                      Short (~20% of sentences)
                    </option>
                    <option value="medium" className="bg-white dark:bg-gray-800">
                      Medium (~35%)
                    </option>
                    <option value="long" className="bg-white dark:bg-gray-800">
                      Long (~55%)
                    </option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={generateSummary}
                className="w-full min-h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <IconWrapper icon={FaMagic} />
                {summary ? 'Summarize Again' : 'Generate Summary'}
              </button>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={ids.output}>
                  Summary
                </label>
                {summary && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="min-h-[44px] flex items-center gap-2 px-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  >
                    <IconWrapper icon={FaCopy} />
                    Copy
                  </button>
                )}
              </div>

              <textarea
                id={ids.output}
                value={summary?.text ?? ''}
                readOnly
                placeholder="Your summary will appear here. It is built from the most important sentences of your text."
                className={`${INPUT} h-80 resize-y bg-gray-50 dark:bg-gray-800/60`}
              />

              <div aria-live="polite">
                {summary && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {summaryWordCount} words · {summary.selected} of {summary.total} sentences
                      </span>
                      <span>Reduced by {compression}%</span>
                    </div>
                    {summary.keywords.length > 0 && (
                      <div>
                        <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Top keywords</p>
                        <ul className="flex flex-wrap gap-2">
                          {summary.keywords.map((k) => (
                            <li key={k.term} className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                              {k.term}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features & Tips */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 dark:bg-white/5 border border-blue-100 dark:border-white/10 rounded-xl">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <IconWrapper icon={FaList} />
                How it works
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-disc pl-5">
                <li>Finds the words your text repeats most, ignoring filler words</li>
                <li>Scores every sentence by how many of those key words it contains</li>
                <li>Keeps the best sentences in their original order</li>
                <li>Runs entirely in your browser: your text is never uploaded</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 dark:bg-white/5 border border-green-100 dark:border-white/10 rounded-xl">
              <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Best practices</h3>
              <ul className="text-sm text-green-700 dark:text-green-200 space-y-1 list-disc pl-5">
                <li>Use well-structured text with full sentences</li>
                <li>Longer texts produce better summaries</li>
                <li>Review the summary before sharing it</li>
                <li>Ideal for articles, reports and research papers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
