import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { logger } from '../utils/logger';

/** The subset of a LanguageTool /v2/check match that we use. */
interface GrammarMatch {
  message?: string;
  shortMessage?: string;
  /** Position of the issue in the submitted text. */
  offset: number;
  length: number;
  replacements: Array<{ value: string }>;
  rule?: { id?: string; issueType?: string; category?: { name?: string } };
}

// The public LanguageTool endpoint rejects requests above 20k characters, and allows
// roughly 20 requests per minute per IP.
const MAX_TEXT_LENGTH = 20000;
const AUTO_CHECK_DELAY_MS = 1500;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000;
const MAX_SUGGESTIONS_SHOWN = 5;

const isGrammarMatch = (value: unknown): value is GrammarMatch => {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return typeof m.offset === 'number' && typeof m.length === 'number' && Array.isArray(m.replacements);
};

class CheckError extends Error {}

export default function GrammarChecker() {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState<GrammarMatch[]>([]);
  /** The exact text the current `matches` describe; null when nothing has been checked. */
  const [checkedText, setCheckedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoCheck, setAutoCheck] = useState(true);

  const track = useToolTracking('grammar-checker', 'Grammar Checker');
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const counterId = `${baseId}-counter`;
  const autoId = `${baseId}-auto`;

  const abortRef = useRef<AbortController | null>(null);
  const cooldownUntilRef = useRef(0);
  const trackedAutoRef = useRef(false);

  const tooLong = text.length > MAX_TEXT_LENGTH;
  const upToDate = checkedText === text;

  // Abort any in-flight request on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  const runCheck = useCallback(
    async (value: string, manual: boolean) => {
      if (!value.trim() || value.length > MAX_TEXT_LENGTH) return;
      if (Date.now() < cooldownUntilRef.current) {
        if (manual) setError('Too many checks in a short time. Please wait a minute and try again.');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('https://api.languagetool.org/v2/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
          body: new URLSearchParams({ text: value, language: 'en-US' }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          cooldownUntilRef.current = Date.now() + RATE_LIMIT_COOLDOWN_MS;
          throw new CheckError('Too many checks in a short time. Please wait a minute and try again.');
        }
        if (res.status === 413) {
          throw new CheckError('This text is too large for the grammar service. Try checking a shorter section.');
        }
        if (!res.ok) throw new Error(`LanguageTool responded with ${res.status}`);

        const data: unknown = await res.json();
        const raw = (data as { matches?: unknown })?.matches;
        setMatches(Array.isArray(raw) ? raw.filter(isGrammarMatch) : []);
        setCheckedText(value);

        if (manual || !trackedAutoRef.current) {
          trackedAutoRef.current = true;
          track('analyze');
        }
      } catch (err) {
        if (controller.signal.aborted) return; // superseded by a newer check or unmounted
        if (err instanceof CheckError) {
          setError(err.message);
        } else {
          logger.error('Grammar check failed', err);
          setError('Could not check grammar right now. Please check your connection and try again.');
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setLoading(false);
        }
      }
    },
    [track]
  );

  // Debounced auto-check: runs once the user pauses typing.
  useEffect(() => {
    if (!autoCheck || upToDate || tooLong || !text.trim()) return;
    const timer = window.setTimeout(() => void runCheck(text, false), AUTO_CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoCheck, text, upToDate, tooLong, runCheck]);

  const handleTextChange = (value: string) => {
    setText(value);
    setError(null);
  };

  /**
   * Replaces one issue with a suggestion and shifts the offsets of the issues after it,
   * so the remaining suggestions stay valid without another round trip.
   */
  const applySuggestion = (match: GrammarMatch, replacement: string) => {
    if (!upToDate) return;
    const next = text.slice(0, match.offset) + replacement + text.slice(match.offset + match.length);
    const delta = replacement.length - match.length;
    const matchEnd = match.offset + match.length;

    const remaining = matches
      .filter((m) => m !== match && (m.offset >= matchEnd || m.offset + m.length <= match.offset))
      .map((m) => (m.offset >= matchEnd ? { ...m, offset: m.offset + delta } : m));

    setText(next);
    setMatches(remaining);
    setCheckedText(next);
    track('use');
  };

  const ignoreMatch = (match: GrammarMatch) => setMatches((prev) => prev.filter((m) => m !== match));

  const visibleMatches = upToDate ? matches : [];

  return (
    <ToolWrapper
      toolId="grammar-checker"
      toolName="AI Grammar Checker"
      toolDescription="Check and fix grammar, spelling, and punctuation errors instantly with our free AI-powered grammar checker"
      toolCategory="Writing"
    >
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
            ✏️ Grammar Checker
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Check and fix grammar, spelling, and punctuation errors instantly
          </p>
        </div>

        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6">
          <label htmlFor={inputId} className="sr-only">
            Text to check for grammar errors
          </label>
          <textarea
            id={inputId}
            className="w-full p-4 rounded-xl mb-2 h-48 resize-y bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Enter your text here to check for grammar, spelling, and punctuation errors..."
            value={text}
            spellCheck={false}
            aria-invalid={tooLong}
            aria-describedby={counterId}
            onChange={(e) => handleTextChange(e.target.value)}
          />
          <div
            id={counterId}
            className={`flex flex-wrap justify-between gap-2 text-xs mb-4 ${
              tooLong ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span>
              {tooLong
                ? `Text is over the ${MAX_TEXT_LENGTH.toLocaleString()}-character limit. Shorten it to check.`
                : loading
                  ? 'Checking…'
                  : upToDate
                    ? 'Up to date'
                    : autoCheck && text.trim()
                      ? 'Checks automatically when you pause typing'
                      : ''}
            </span>
            <span>
              {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => void runCheck(text, true)}
              disabled={loading || !text.trim() || tooLong}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 dark:disabled:from-gray-600 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-purple-500/25 transition-all w-full sm:w-auto"
            >
              {loading ? '🔍 Checking...' : '✨ Check Grammar'}
            </button>
            <div className="flex items-center gap-2">
              <input
                id={autoId}
                type="checkbox"
                checked={autoCheck}
                onChange={(e) => setAutoCheck(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor={autoId} className="text-sm text-gray-600 dark:text-gray-300">
                Check as I type
              </label>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Text is sent to the LanguageTool public API for checking.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <div aria-live="polite">
            {visibleMatches.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  📝 {visibleMatches.length} {visibleMatches.length === 1 ? 'Suggestion' : 'Suggestions'}
                </h3>
                <ul className="space-y-3">
                  {visibleMatches.map((item) => {
                    const flagged = text.slice(item.offset, item.offset + item.length);
                    const suggestions = item.replacements.slice(0, MAX_SUGGESTIONS_SHOWN);
                    return (
                      <li
                        key={`${item.offset}-${item.length}-${item.rule?.id ?? ''}`}
                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap items-start gap-2">
                            <span className="text-red-600 dark:text-red-400 font-semibold text-sm">
                              {item.rule?.category?.name ?? 'Issue'}:
                            </span>
                            <span className="text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded text-sm break-all">
                              “{flagged || '…'}”
                            </span>
                          </div>
                          {item.message && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm">💡 {item.message}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            {suggestions.length > 0 && (
                              <span className="text-green-600 dark:text-green-400 font-semibold text-sm">Replace with:</span>
                            )}
                            {suggestions.map((r) => (
                              <button
                                key={r.value}
                                type="button"
                                onClick={() => applySuggestion(item, r.value)}
                                className="px-2 py-1 rounded text-sm bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/50"
                                aria-label={`Replace “${flagged}” with “${r.value || '(remove)'}”`}
                              >
                                {r.value || '(remove)'}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => ignoreMatch(item)}
                              className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-white/10 transition-colors"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {upToDate && visibleMatches.length === 0 && !loading && !error && text.trim() && (
              <div className="mt-6 text-center bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/20 rounded-xl p-6">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-green-700 dark:text-green-300 font-semibold mb-2">Great job!</h3>
                <p className="text-gray-600 dark:text-gray-300">No grammar errors found in your text.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
