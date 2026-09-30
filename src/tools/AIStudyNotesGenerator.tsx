import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaBook, FaCopy, FaDownload, FaTrash, FaMagic, FaLightbulb } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { countWords, splitSentences } from './lib/aiTextSummarizer';
import {
  generateStudyNotes,
  MAX_STUDY_INPUT,
  MIN_STUDY_SENTENCES,
  MIN_STUDY_WORDS,
  type NotesType,
} from './lib/aiStudyNotes';

const NOTE_TYPES: Record<NotesType, { icon: string; label: string; desc: string }> = {
  summary: { icon: '\u{1F4CB}', label: 'Summary', desc: 'The key sentences, key terms in context, and a main takeaway' },
  detailed: { icon: '\u{1F4D6}', label: 'Detailed', desc: 'Your material organized into titled sections with key ideas' },
  flashcards: { icon: '\u{1F5C2}️', label: 'Flashcards', desc: 'Q&A cards built from definitions and key terms in the text' },
  mindmap: { icon: '\u{1F9E0}', label: 'Mind map', desc: 'Key terms as branches, with the sentences that explain them' },
  quiz: { icon: '\u{1F4DD}', label: 'Quiz', desc: 'Multiple-choice fill-in-the-blank questions with an answer key' },
};

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors';
const SMALL_BUTTON =
  'min-h-[44px] flex items-center gap-1.5 text-sm px-3 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 ' +
  'border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

const AIStudyNotesGenerator: React.FC = () => {
  const id = useId();
  const track = useToolTracking('ai-study-notes', 'AI Study Notes Generator');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [notesType, setNotesType] = useState<NotesType>('summary');
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | undefined>(undefined);
  const revokeTimerRef = useRef<number | undefined>(undefined);

  const ids = {
    subject: `${id}-subject`,
    format: `${id}-format`,
    formatDesc: `${id}-format-desc`,
    content: `${id}-content`,
    contentHelp: `${id}-content-help`,
    error: `${id}-error`,
    output: `${id}-output`,
  };

  useEffect(
    () => () => {
      window.clearTimeout(copyTimerRef.current);
      window.clearTimeout(revokeTimerRef.current);
    },
    []
  );

  const wordCount = useMemo(() => countWords(content), [content]);

  const generateNotes = () => {
    const text = content.trim();
    if (countWords(text) < MIN_STUDY_WORDS || splitSentences(text).length < MIN_STUDY_SENTENCES) {
      setError(`Paste at least ${MIN_STUDY_SENTENCES} full sentences (about ${MIN_STUDY_WORDS}+ words) of study material.`);
      return;
    }
    const result = generateStudyNotes(text, subject, notesType);
    if (!result.text) {
      setError(
        `There isn’t enough distinct material to build ${NOTE_TYPES[notesType].label.toLowerCase()} from this text. Add more content or try the Summary format.`
      );
      return;
    }
    setError(null);
    setGeneratedNotes(result.text);
    if (!subject.trim()) setSubject(result.subject);
    track('generate');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedNotes);
      setCopied(true);
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy. Select the text and press Ctrl+C instead.');
    }
  };

  const downloadNotes = () => {
    const blob = new Blob([generatedNotes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = (subject.trim() || 'study-notes').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'study-notes';
    a.download = `${name}-${notesType}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.clearTimeout(revokeTimerRef.current);
    revokeTimerRef.current = window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const clearAll = () => {
    setContent('');
    setSubject('');
    setGeneratedNotes('');
    setError(null);
  };

  return (
    <ToolWrapper
      toolId="ai-study-notes"
      toolName="AI Study Notes Generator"
      toolDescription="Transform your study material into organized, easy-to-learn notes"
      toolCategory="Education"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl shrink-0">
              <IconWrapper icon={FaBook} className="text-2xl text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Study Notes Generator</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Transform study material into organized notes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-5">
              <div>
                <label className={LABEL} htmlFor={ids.subject}>
                  Subject <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                </label>
                <input
                  id={ids.subject}
                  type="text"
                  className={INPUT}
                  value={subject}
                  maxLength={80}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Biology, World History, Physics…"
                />
              </div>

              <div role="group" aria-labelledby={ids.format} aria-describedby={ids.formatDesc}>
                <p id={ids.format} className={LABEL}>
                  Notes format
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(NOTE_TYPES) as NotesType[]).map((type) => {
                    const selected = notesType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setNotesType(type)}
                        className={`min-h-[44px] p-2.5 rounded-xl text-sm font-medium transition-all border-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                          selected
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-500'
                            : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-100 dark:hover:bg-white/10'
                        }`}
                      >
                        <span className="text-lg" aria-hidden="true">
                          {NOTE_TYPES[type].icon}
                        </span>
                        <span className="block mt-1">{NOTE_TYPES[type].label}</span>
                      </button>
                    );
                  })}
                </div>
                <p id={ids.formatDesc} className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                  <IconWrapper icon={FaLightbulb} className="text-yellow-500 shrink-0" />
                  {NOTE_TYPES[notesType].desc}
                </p>
              </div>

              <div>
                <label className={LABEL} htmlFor={ids.content}>
                  Study material
                </label>
                <textarea
                  id={ids.content}
                  className={`${INPUT} h-[200px] resize-y`}
                  value={content}
                  maxLength={MAX_STUDY_INPUT}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste your study material, textbook content, or lecture notes here…"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={`${ids.contentHelp}${error ? ` ${ids.error}` : ''}`}
                />
                <div id={ids.contentHelp} className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {wordCount} words
                </div>
                {error && (
                  <p id={ids.error} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-emerald-500/25 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  onClick={generateNotes}
                >
                  <IconWrapper icon={FaMagic} />
                  Generate Notes
                </button>
                <button
                  type="button"
                  className="min-h-[44px] min-w-[44px] px-4 py-3 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/20 rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  onClick={clearAll}
                  aria-label="Clear all fields"
                  title="Clear all fields"
                >
                  <IconWrapper icon={FaTrash} />
                </button>
              </div>
            </div>

            {/* Output Section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor={ids.output}>
                  Generated notes
                </label>
                {generatedNotes && (
                  <div className="flex gap-2">
                    <button type="button" onClick={copyToClipboard} className={SMALL_BUTTON}>
                      <IconWrapper icon={FaCopy} />
                      <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button type="button" onClick={downloadNotes} className={SMALL_BUTTON}>
                      <IconWrapper icon={FaDownload} />
                      Download
                    </button>
                  </div>
                )}
              </div>
              <div aria-live="polite">
                <textarea
                  id={ids.output}
                  className={`${INPUT} h-[480px] font-mono text-sm resize-y bg-gray-50 dark:bg-gray-800/60`}
                  value={generatedNotes}
                  onChange={(e) => setGeneratedNotes(e.target.value)}
                  readOnly={!generatedNotes}
                  placeholder="Your study notes will appear here. Everything is built from the material you paste."
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
};

export default AIStudyNotesGenerator;
