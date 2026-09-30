import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  MAX_MATCHES,
  MAX_MATCH_LOOP_MS,
  MAX_TEST_STRING_LENGTH,
  REGEX_FLAGS,
  REGEX_FLAG_INFO,
  WORKER_TIMEOUT_MS,
  buildFlags,
  buildHighlightSegments,
  createRegexWorkerSource,
  getCaptureGroupNames,
  runRegex,
  type RegexFlag,
  type RegexRunRequest,
  type RegexRunResponse,
} from '../utils/tools/regexTester';

const TOOL_ID = 'regex-tester';
const TOOL_NAME = 'Regex Tester';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';
const MATCH_A = 'bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded-sm';
const MATCH_B = 'bg-amber-300/80 dark:bg-amber-400/40 text-inherit rounded-sm';

const DEBOUNCE_MS = 200;
/** Render at most this many matches in the detail list (all are still highlighted). */
const LIST_LIMIT = 200;

async function copyToClipboard(text: string, message = 'Copied to clipboard'): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error('Copy failed - your browser blocked clipboard access');
    return false;
  }
}

interface RunResult {
  /** The exact inputs the response was computed for (used for rendering highlights). */
  request: RegexRunRequest;
  response: RegexRunResponse;
}

const EXAMPLES: Array<{ label: string; pattern: string; flags: RegexFlag[]; text: string; replacement: string }> = [
  {
    label: 'Email',
    pattern: '(?<user>[\\w.+-]+)@(?<domain>[\\w-]+\\.[\\w.-]+)',
    flags: ['g', 'i'],
    text: 'Contact alice@example.com or bob.smith+news@mail.co.uk for details.',
    replacement: '$<user> at $<domain>',
  },
  {
    label: 'ISO date',
    pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
    flags: ['g'],
    text: 'Released 2024-03-15, patched 2024-04-02.',
    replacement: '$3/$2/$1',
  },
  {
    label: 'Hex color',
    pattern: '#(?:[0-9a-f]{3}){1,2}\\b',
    flags: ['g', 'i'],
    text: 'Primary #7C3AED, accent #ec4899, border #ddd, invalid #12345.',
    replacement: '[$&]',
  },
];

type WorkerState = { worker: Worker; url: string } | null;

export default function RegexTester() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const firstUseRef = useRef(false);
  const workerRef = useRef<WorkerState>(null);
  const workerBrokenRef = useRef(false);
  const requestIdRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<Record<RegexFlag, boolean>>({ g: true, i: false, m: false, s: false, u: false, y: false });
  const [text, setText] = useState('');
  const [truncatedInput, setTruncatedInput] = useState(false);
  const [replaceEnabled, setReplaceEnabled] = useState(false);
  const [replacement, setReplacement] = useState('');
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [killed, setKilled] = useState(false);

  const ids = {
    pattern: `${baseId}-pattern`,
    text: `${baseId}-text`,
    replaceToggle: `${baseId}-replace-toggle`,
    replacement: `${baseId}-replacement`,
  };

  const flagString = buildFlags(flags);

  const terminateWorker = useCallback(() => {
    const state = workerRef.current;
    if (state) {
      state.worker.terminate();
      URL.revokeObjectURL(state.url);
      workerRef.current = null;
    }
  }, []);

  const clearWatchdog = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const getWorker = useCallback((): Worker | null => {
    if (workerBrokenRef.current || typeof Worker === 'undefined' || typeof Blob === 'undefined') return null;
    if (workerRef.current) return workerRef.current.worker;
    try {
      const url = URL.createObjectURL(new Blob([createRegexWorkerSource()], { type: 'text/javascript' }));
      const worker = new Worker(url);
      workerRef.current = { worker, url };
      return worker;
    } catch {
      workerBrokenRef.current = true;
      return null;
    }
  }, []);

  const markUsed = useCallback(() => {
    if (!firstUseRef.current) {
      firstUseRef.current = true;
      track('analyze');
    }
  }, [track]);

  const execute = useCallback(
    (request: RegexRunRequest) => {
      const id = ++requestIdRef.current;
      const finish = (response: RegexRunResponse) => {
        if (id !== requestIdRef.current) return;
        clearWatchdog();
        setRunning(false);
        setKilled(false);
        setResult({ request, response });
        if (response.ok) markUsed();
      };
      const runInline = () => finish(runRegex(request));

      let worker = getWorker();
      if (worker && timeoutRef.current !== null) {
        // A previous request may still be stuck in a slow pattern: start from a fresh worker.
        clearWatchdog();
        terminateWorker();
        worker = getWorker();
      }
      if (!worker) {
        runInline();
        return;
      }

      setRunning(true);
      worker.onmessage = (event: MessageEvent<{ id: number; response: RegexRunResponse }>) => {
        if (event.data && event.data.id === id) finish(event.data.response);
      };
      worker.onerror = (event) => {
        event.preventDefault();
        // The worker could not start (e.g. blocked by policy): fall back to the main thread.
        workerBrokenRef.current = true;
        terminateWorker();
        clearWatchdog();
        runInline();
      };
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        if (id !== requestIdRef.current) return;
        terminateWorker();
        setRunning(false);
        setKilled(true);
        setResult(null);
      }, WORKER_TIMEOUT_MS);
      worker.postMessage({ id, request });
    },
    [clearWatchdog, getWorker, markUsed, terminateWorker]
  );

  // Debounced evaluation whenever the inputs change.
  useEffect(() => {
    if (pattern === '') {
      // Invalidate anything in flight and stop a worker that may be stuck.
      requestIdRef.current++;
      if (timeoutRef.current !== null) {
        clearWatchdog();
        terminateWorker();
      }
      return undefined;
    }
    const request: RegexRunRequest = {
      pattern,
      flags: flagString,
      text,
      replacement: replaceEnabled ? replacement : null,
      maxMatches: MAX_MATCHES,
      maxTimeMs: MAX_MATCH_LOOP_MS,
    };
    const timer = window.setTimeout(() => execute(request), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [pattern, flagString, text, replaceEnabled, replacement, execute, clearWatchdog, terminateWorker]);

  // Clean up the worker and watchdog on unmount.
  useEffect(
    () => () => {
      clearWatchdog();
      terminateWorker();
    },
    [clearWatchdog, terminateWorker]
  );

  const handleTextChange = (value: string) => {
    if (value.length > MAX_TEST_STRING_LENGTH) {
      setText(value.slice(0, MAX_TEST_STRING_LENGTH));
      setTruncatedInput(true);
    } else {
      setText(value);
      setTruncatedInput(false);
    }
  };

  const active = pattern !== '' && result !== null;
  const response = active ? result.response : null;
  const shownText = active ? result.request.text : text;

  const segments = useMemo(
    () => (response && response.ok ? buildHighlightSegments(shownText, response.matches) : null),
    [response, shownText]
  );
  const groupNames = useMemo(() => (result ? getCaptureGroupNames(result.request.pattern) : []), [result]);

  const copyAndTrack = async (value: string, message?: string) => {
    if (await copyToClipboard(value, message)) track('copy');
  };

  const loadExample = (index: number) => {
    const ex = EXAMPLES[index];
    setPattern(ex.pattern);
    setFlags({ g: false, i: false, m: false, s: false, u: false, y: false, ...Object.fromEntries(ex.flags.map((f) => [f, true])) });
    handleTextChange(ex.text);
    setReplaceEnabled(true);
    setReplacement(ex.replacement);
  };

  const matchCount = response && response.ok ? response.matches.length : 0;
  const statusText = (() => {
    if (pattern === '') return 'Enter a pattern to start matching.';
    if (killed) return '';
    if (!response) return running ? 'Matching…' : '';
    if (!response.ok) return '';
    const count = `${matchCount.toLocaleString()}${response.truncated ? '+' : ''} match${matchCount === 1 ? '' : 'es'}`;
    return `${count} · ${response.elapsedMs} ms`;
  })();

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Test JavaScript regular expressions live with highlighted matches, capture and named groups, flags and replace preview - safely in your browser."
      toolCategory="Developer"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            🔍
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Regex Tester
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Build and debug JavaScript regular expressions with live highlighting, groups and replacement preview.
          </p>
        </div>

        <div className={`${CARD} mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={ids.pattern} className="font-semibold text-gray-900 dark:text-white">
              Regular expression
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Examples:</span>
              {EXAMPLES.map((ex, i) => (
                <button key={ex.label} type="button" className={`${SECONDARY_BTN} px-3 text-sm`} onClick={() => loadExample(i)}>
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-stretch rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-purple-500/50 dark:border-gray-600 dark:bg-gray-800/60">
            <span className="flex items-center pl-3 font-mono text-lg text-gray-400 dark:text-gray-500" aria-hidden="true">
              /
            </span>
            <input
              id={ids.pattern}
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              placeholder="e.g. (\d{3})-(\d{4})"
              aria-invalid={response !== null && !response.ok ? true : undefined}
              className="min-h-[44px] min-w-0 flex-1 bg-transparent px-1 py-2 font-mono text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
            />
            <span className="flex items-center pr-3 font-mono text-lg text-gray-400 dark:text-gray-500" aria-hidden="true">
              /<span className="text-purple-600 dark:text-purple-300">{flagString}</span>
            </span>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">Flags</legend>
            <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4">
              {REGEX_FLAGS.map((f) => {
                const id = `${baseId}-flag-${f}`;
                return (
                  <div key={f} className="flex min-h-[44px] items-center gap-2">
                    <input
                      id={id}
                      type="checkbox"
                      checked={flags[f]}
                      onChange={(e) => setFlags((prev) => ({ ...prev, [f]: e.target.checked }))}
                      className="h-5 w-5 rounded accent-purple-600"
                    />
                    <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-200" title={REGEX_FLAG_INFO[f]}>
                      <code className="font-mono font-bold text-purple-700 dark:text-purple-300">{f}</code>{' '}
                      <span className="text-gray-500 dark:text-gray-400">{REGEX_FLAG_INFO[f].split(' - ')[0]}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
            <label htmlFor={ids.text} className="font-semibold text-gray-900 dark:text-white">
              Test string
            </label>
            <span className={`text-xs ${truncatedInput ? 'text-red-700 dark:text-red-300 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              {text.length.toLocaleString()} / {MAX_TEST_STRING_LENGTH.toLocaleString()}
            </span>
          </div>
          <textarea
            id={ids.text}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            spellCheck={false}
            placeholder="Paste the text to test against"
            className={`${FIELD} mt-2 h-40 p-3 font-mono text-sm resize-y`}
          />
          {truncatedInput && (
            <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-300">
              The test string was cut to {MAX_TEST_STRING_LENGTH.toLocaleString()} characters.
            </p>
          )}

          <div className="mt-3 flex min-h-[44px] items-center gap-2">
            <input
              id={ids.replaceToggle}
              type="checkbox"
              checked={replaceEnabled}
              onChange={(e) => setReplaceEnabled(e.target.checked)}
              className="h-5 w-5 rounded accent-purple-600"
            />
            <label htmlFor={ids.replaceToggle} className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Replace preview
            </label>
          </div>
          {replaceEnabled && (
            <div>
              <label htmlFor={ids.replacement} className="block text-sm text-gray-600 dark:text-gray-300">
                Replacement (<code className="font-mono">$1</code>, <code className="font-mono">$&lt;name&gt;</code>,{' '}
                <code className="font-mono">$&amp;</code> supported)
              </label>
              <input
                id={ids.replacement}
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                className={`${FIELD} mt-1 min-h-[44px] px-3 py-2 font-mono text-sm`}
              />
            </div>
          )}
        </div>

        <div className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">Matches</h3>
            <div className="flex items-center gap-2">
              <span aria-live="polite" className="text-sm text-gray-600 dark:text-gray-300">
                {statusText}
              </span>
              <button
                type="button"
                className={`${SECONDARY_BTN} px-3 text-sm`}
                onClick={() => copyAndTrack(`/${pattern}/${flagString}`, 'Regex copied')}
                disabled={pattern === ''}
              >
                Copy regex
              </button>
            </div>
          </div>

          {killed && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              Matching was stopped after {(WORKER_TIMEOUT_MS / 1000).toFixed(1)} s. The pattern is probably backtracking catastrophically (for
              example nested quantifiers like <code className="font-mono">(a+)+</code>). Simplify the pattern or shorten the test string.
            </p>
          )}
          {response && !response.ok && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 break-words"
            >
              {response.error}
            </p>
          )}
          {response && response.ok && response.truncated && (
            <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">Only the first {MAX_MATCHES.toLocaleString()} matches are shown.</p>
          )}
          {response && response.ok && response.timedOut && (
            <p className="mt-3 text-sm text-amber-800 dark:text-amber-200">Matching took too long and stopped early; results are partial.</p>
          )}

          {segments && (
            <pre
              aria-label="Test string with matches highlighted"
              className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-gray-100"
            >
              {shownText === ''
                ? ' '
                : segments.map((seg, i) =>
                    seg.matchIndex === null ? (
                      <React.Fragment key={i}>{seg.text}</React.Fragment>
                    ) : seg.text === '' ? (
                      <span
                        key={i}
                        className="mx-px inline-block h-4 w-0.5 translate-y-0.5 bg-yellow-500 dark:bg-yellow-400"
                        title={`Empty match #${seg.matchIndex + 1}`}
                      />
                    ) : (
                      <mark key={i} className={seg.matchIndex % 2 === 0 ? MATCH_A : MATCH_B} title={`Match #${seg.matchIndex + 1}`}>
                        {seg.text}
                      </mark>
                    )
                  )}
            </pre>
          )}

          {response && response.ok && response.matches.length > 0 && (
            <ol className="mt-4 max-h-96 space-y-2 overflow-auto">
              {response.matches.slice(0, LIST_LIMIT).map((m, i) => (
                <li key={`${m.index}-${i}`} className="rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold text-gray-900 dark:text-white">#{i + 1}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      index {m.index}–{m.end}
                    </span>
                    <code className={`break-all font-mono ${MATCH_A} px-1`}>{m.text === '' ? '(empty)' : m.text}</code>
                  </div>
                  {m.groups.length > 0 && (
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                      {m.groups.map((g, gi) => (
                        <React.Fragment key={gi}>
                          <dt className="font-mono text-xs text-purple-700 dark:text-purple-300">
                            ${gi + 1}
                            {groupNames[gi] ? ` <${groupNames[gi]}>` : ''}
                          </dt>
                          <dd className="break-all font-mono text-xs text-gray-800 dark:text-gray-200">
                            {g === null ? <span className="italic text-gray-400 dark:text-gray-500">undefined</span> : g === '' ? '""' : g}
                          </dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          )}
          {response && response.ok && response.matches.length > LIST_LIMIT && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Details are listed for the first {LIST_LIMIT} matches; all {response.matches.length.toLocaleString()} are highlighted above.
            </p>
          )}

          {replaceEnabled && response && response.ok && response.replaced !== null && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Replace result</h3>
                <button type="button" className={`${SECONDARY_BTN} px-3 text-sm`} onClick={() => copyAndTrack(response.replaced ?? '', 'Result copied')}>
                  <span aria-hidden="true">📋</span> Copy
                </button>
              </div>
              <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-sm text-gray-900 dark:border-white/10 dark:bg-black/20 dark:text-gray-100">
                {response.replaced === '' ? ' ' : response.replaced}
              </pre>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Uses your browser&apos;s JavaScript regex engine. Patterns run in a background worker and are stopped if they hang.
        </p>
      </div>
    </ToolWrapper>
  );
}
