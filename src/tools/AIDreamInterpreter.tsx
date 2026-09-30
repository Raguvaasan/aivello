import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  DREAM_MAX_LENGTH,
  DREAM_MOODS,
  DreamErrors,
  DreamInput,
  DreamInterpretation,
  downloadDreamReport,
  interpretDream,
  todayISO,
  validateDreamInput,
} from './lib/aiDreamInterpreter';

const TOOL_ID = 'ai-dream-interpreter';
const TOOL_NAME = 'AI Dream Interpreter';
const HISTORY_LIMIT = 10;

const EMPTY_INPUT: DreamInput = { description: '', date: '', mood: '', lifeContext: '' };

interface HistoryEntry {
  input: DreamInput;
  result: DreamInterpretation;
}

const cardClass = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6';
const subCardClass = 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl';
const labelClass = 'block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300';
const selectClass =
  'w-full min-h-[44px] px-3 py-2 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const optionClass = 'bg-white dark:bg-gray-800';
const errorTextClass = 'mt-1 text-sm text-red-600 dark:text-red-400';
const invalidClass = 'ring-2 ring-red-500 dark:ring-red-400';

const Meter = ({ label, value, barClass }: { label: string; value: number; barClass: string }) => (
  <div className={`${subCardClass} p-4`}>
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{value}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2" aria-hidden="true">
      <div className={`${barClass} h-3 rounded-full transition-all duration-300`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

const BulletList = ({ items, dotClass }: { items: string[]; dotClass: string }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex items-start gap-2">
        <span className={`${dotClass} mt-0.5`} aria-hidden="true">•</span>
        <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
      </li>
    ))}
  </ul>
);

const AIDreamInterpreter = () => {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const uid = useId();

  const [form, setForm] = useState<DreamInput>(EMPTY_INPUT);
  const [errors, setErrors] = useState<DreamErrors>({});
  const [analyzeError, setAnalyzeError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [current, setCurrent] = useState<HistoryEntry | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [status, setStatus] = useState('');

  const timerRef = useRef<number | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  const update = <K extends keyof DreamInput>(key: K, value: DreamInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as keyof DreamErrors];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isAnalyzing) return;
    const nextErrors = validateDreamInput(form);
    setErrors(nextErrors);
    setAnalyzeError('');
    if (nextErrors.description) {
      descriptionRef.current?.focus();
      return;
    }
    if (nextErrors.date) {
      dateRef.current?.focus();
      return;
    }

    setIsAnalyzing(true);
    setStatus('Interpreting your dream…');
    const snapshot = { ...form };
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      try {
        const result = interpretDream(snapshot);
        const entry = { input: snapshot, result };
        setCurrent(entry);
        setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
        setStatus(`Interpretation ready: ${result.dreamType}, ${result.symbolAnalysis.length} symbols found.`);
        track('analyze');
        window.requestAnimationFrame(() => resultsHeadingRef.current?.focus());
      } catch {
        setAnalyzeError('Something went wrong while interpreting your dream. Please try again.');
        setStatus('');
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);
  };

  const handleDownload = () => {
    if (!current) return;
    try {
      downloadDreamReport(current.input, current.result);
      toast.success('Dream report downloaded');
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  const clearForm = () => {
    setForm(EMPTY_INPUT);
    setErrors({});
    setAnalyzeError('');
    setCurrent(null);
    window.requestAnimationFrame(() => descriptionRef.current?.focus());
  };

  const interpretation = current?.result ?? null;

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Unlock the hidden meanings in your dreams with AI-powered analysis and psychological insights."
      toolCategory="AI"
    >
      <div className="relative max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-gray-900 via-purple-700 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            🌙 AI Dream Interpreter
          </h2>
          <p className="text-gray-600 dark:text-gray-300">Explore the symbols, emotions and themes in your dreams</p>
        </div>

        {/* Dream Input Form */}
        <form className={cardClass} onSubmit={handleSubmit} noValidate aria-busy={isAnalyzing}>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">📝 Describe Your Dream</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass} htmlFor={`${uid}-date`}>Dream Date (optional)</label>
              <Input
                id={`${uid}-date`}
                ref={dateRef}
                type="date"
                max={todayISO()}
                value={form.date}
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? `${uid}-date-error` : undefined}
                onChange={(e) => update('date', e.target.value)}
                className={`min-h-[44px] ${errors.date ? invalidClass : ''}`}
              />
              {errors.date && (
                <p id={`${uid}-date-error`} role="alert" className={errorTextClass}>{errors.date}</p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor={`${uid}-mood`}>Your Mood in the Dream</label>
              <select id={`${uid}-mood`} className={selectClass} value={form.mood} onChange={(e) => update('mood', e.target.value)}>
                <option value="" className={optionClass}>Select mood…</option>
                {DREAM_MOODS.map((mood) => (
                  <option key={mood} value={mood} className={optionClass}>{mood}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor={`${uid}-description`}>
              Dream Description <span aria-hidden="true">*</span>
            </label>
            <Textarea
              id={`${uid}-description`}
              ref={descriptionRef}
              placeholder="Describe your dream in detail… include people, places, objects, actions, emotions, and anything that stood out."
              value={form.description}
              maxLength={DREAM_MAX_LENGTH}
              rows={6}
              required
              aria-invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? `${uid}-description-error` : `${uid}-description-hint`}
              onChange={(e) => update('description', e.target.value)}
              className={`resize-y ${errors.description ? invalidClass : ''}`}
            />
            {errors.description ? (
              <p id={`${uid}-description-error`} role="alert" className={errorTextClass}>{errors.description}</p>
            ) : (
              <p id={`${uid}-description-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {form.description.length}/{DREAM_MAX_LENGTH} · analysed in your browser, never uploaded or stored
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className={labelClass} htmlFor={`${uid}-context`}>Recent Life Context (optional)</label>
            <Textarea
              id={`${uid}-context`}
              placeholder="What has been happening in your life lately? e.g. a new job, a move, exams, a breakup…"
              value={form.lifeContext}
              maxLength={1000}
              rows={3}
              onChange={(e) => update('lifeContext', e.target.value)}
              className="resize-y"
            />
          </div>

          {analyzeError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              {analyzeError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isAnalyzing} className="min-h-[48px] sm:flex-1">
              {isAnalyzing ? '🔮 Interpreting…' : '🔮 Interpret Dream'}
            </Button>
            <Button type="button" variant="outline" onClick={clearForm} className="min-h-[48px]">
              🧹 Clear Form
            </Button>
          </div>
        </form>

        <p className="sr-only" aria-live="polite">{status}</p>

        {isAnalyzing && (
          <div className={`${cardClass} text-center`} role="status">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-3" aria-hidden="true" />
            <p className="font-semibold text-gray-900 dark:text-white">Looking for symbols and themes…</p>
          </div>
        )}

        {/* Results */}
        {interpretation && current && !isAnalyzing && (
          <div className="space-y-6">
            <div className={`${cardClass} text-center`}>
              <h3 ref={resultsHeadingRef} tabIndex={-1} className="text-2xl font-bold mb-1 text-gray-900 dark:text-white focus:outline-none">
                {interpretation.dreamType}
                {interpretation.recurring && (
                  <span className="ml-2 align-middle text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                    Recurring
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{interpretation.dreamTypeDescription}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <Meter label="Lucidity cues" value={interpretation.lucidityLevel} barClass="bg-indigo-600 dark:bg-indigo-400" />
                <Meter label="Emotional intensity" value={interpretation.emotionalIntensity} barClass="bg-purple-600 dark:bg-purple-400" />
              </div>
            </div>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">🎯 Main Themes</h3>
              <ul className="flex flex-wrap gap-2">
                {interpretation.mainThemes.map((theme) => (
                  <li key={theme} className="text-sm font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {theme}
                  </li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className={cardClass}>
                <h3 className="text-xl font-semibold mb-3 text-green-700 dark:text-green-300">🧠 Psychological Meaning</h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{interpretation.psychologicalMeaning}</p>
              </section>
              <section className={cardClass}>
                <h3 className="text-xl font-semibold mb-3 text-pink-700 dark:text-pink-300">💗 Emotional State</h3>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{interpretation.emotionalState}</p>
              </section>
            </div>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-amber-700 dark:text-amber-300">🔮 Symbol Analysis</h3>
              {interpretation.symbolAnalysis.length ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interpretation.symbolAnalysis.map((symbol) => (
                    <li key={symbol.symbol} className={`${subCardClass} p-4`}>
                      <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {symbol.symbol}
                        <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">you wrote “{symbol.matched}”</span>
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">{symbol.meaning}</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{symbol.significance}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  No common dream symbols were found. Try adding concrete details - places, objects, animals, people or actions.
                </p>
              )}
            </section>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-300">✨ Spiritual Perspective</h3>
              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{interpretation.spiritualMeaning}</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className={cardClass}>
                <h3 className="text-xl font-semibold mb-4 text-orange-700 dark:text-orange-300">💭 Questions for Reflection</h3>
                <BulletList items={interpretation.lifeReflections} dotClass="text-orange-600 dark:text-orange-400" />
              </section>
              <section className={cardClass}>
                <h3 className="text-xl font-semibold mb-4 text-teal-700 dark:text-teal-300">💡 Actionable Insights</h3>
                <BulletList items={interpretation.actionableInsights} dotClass="text-teal-600 dark:text-teal-400" />
              </section>
            </div>

            <section className={cardClass}>
              <h3 className="text-xl font-semibold mb-4 text-pink-700 dark:text-pink-300">🌟 Recommendations</h3>
              <BulletList items={interpretation.recommendations} dotClass="text-pink-600 dark:text-pink-400" />
            </section>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Dream interpretation is for self-reflection and entertainment, not a medical or psychological assessment. If nightmares are frequent or distressing, consider talking to a healthcare professional.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleDownload}
                className="min-h-[44px] px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                📊 Download Report
              </button>
              <Button type="button" variant="outline" onClick={clearForm} className="min-h-[44px]">
                🔄 New Dream Analysis
              </Button>
            </div>
          </div>
        )}

        {/* Dream History */}
        {history.length > 0 && (
          <section className={cardClass}>
            <h3 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">📚 Recent Dreams</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Kept in this browser tab only - nothing is saved.</p>
            <ul className="space-y-3">
              {history.map((entry) => (
                <li key={entry.result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrent(entry);
                      setStatus(`Showing the interpretation from ${entry.result.dreamDate}.`);
                      window.requestAnimationFrame(() => resultsHeadingRef.current?.focus());
                    }}
                    aria-current={current?.result.id === entry.result.id ? 'true' : undefined}
                    className={`${subCardClass} w-full text-left p-3 hover:border-purple-400 dark:hover:border-purple-400/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                  >
                    <span className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                      <span className="min-w-0">
                        <span className="block font-medium text-gray-900 dark:text-white">{entry.result.dreamType}</span>
                        <span className="block text-sm text-gray-600 dark:text-gray-400 truncate">
                          {entry.result.dreamDate} · {entry.input.description.slice(0, 80)}
                          {entry.input.description.length > 80 ? '…' : ''}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-1 rounded">
                        {entry.result.mainThemes[0]}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIDreamInterpreter;
