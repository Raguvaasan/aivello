import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  HASH_ALGORITHMS,
  MAX_HASH_FILE_BYTES,
  compareWithExpected,
  hashAll,
  hmacSha256Hex,
  isSubtleCryptoAvailable,
  normalizeHash,
  readFileWithProgress,
  textToBytes,
  type HashComparison,
  type HashResults,
} from '../utils/tools/hash';
import { formatBytes } from '../utils/tools/jsonFormat';

const TOOL_ID = 'hash-generator';
const TOOL_NAME = 'Hash Generator';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';
const ICON_BTN =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';
const ERROR_BOX =
  'mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 break-words';

const DEBOUNCE_MS = 250;

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

type Mode = 'text' | 'file' | 'hmac';
const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'text', label: 'Text' },
  { id: 'file', label: 'File' },
  { id: 'hmac', label: 'HMAC' },
];

interface HashListProps {
  results: HashResults;
  uppercase: boolean;
  onCopy: (value: string, label: string) => void;
}

function HashList({ results, uppercase, onCopy }: HashListProps) {
  return (
    <dl className="mt-4 space-y-3">
      {HASH_ALGORITHMS.map((alg) => {
        const value = uppercase ? results[alg].toUpperCase() : results[alg];
        return (
          <div key={alg} className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
            <dt className="text-sm font-semibold text-purple-700 dark:text-purple-300">{alg}</dt>
            <dd className="mt-1 flex items-start gap-2">
              <code className="flex-1 break-all font-mono text-sm text-gray-900 dark:text-gray-100">{value}</code>
              <button type="button" className={ICON_BTN} aria-label={`Copy ${alg} hash`} onClick={() => onCopy(value, `${alg} copied`)}>
                <span aria-hidden="true">📋</span>
              </button>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function ComparisonMessage({ comparison }: { comparison: HashComparison }) {
  if (comparison.status === 'empty') return null;
  if (comparison.status === 'invalid') {
    return <p className="mt-2 text-sm text-red-700 dark:text-red-300">{comparison.message}</p>;
  }
  if (comparison.status === 'match') {
    return (
      <p className="mt-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
        <span aria-hidden="true">✓ </span>Match - identical to the {comparison.algorithm} hash
      </p>
    );
  }
  return (
    <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <span aria-hidden="true">✗ </span>No match
      {comparison.guessed === 'MD5'
        ? ' - that looks like an MD5 hash, which this tool cannot compute'
        : comparison.guessed
          ? ` - the expected value has the length of a ${comparison.guessed} hash`
          : ' - the expected value does not have the length of any supported hash'}
    </p>
  );
}

export default function HashGenerator() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const firstUseRef = useRef(false);
  const fileJobRef = useRef<{ id: number; abort: () => void } | null>(null);
  const jobCounter = useRef(0);

  const [mode, setMode] = useState<Mode>('text');
  const [uppercase, setUppercase] = useState(false);
  const [expected, setExpected] = useState('');
  const [cryptoError, setCryptoError] = useState<string | null>(
    isSubtleCryptoAvailable() ? null : 'Web Crypto is unavailable. Open this page over HTTPS in a modern browser.'
  );

  // Text
  const [text, setText] = useState('');
  const [textResults, setTextResults] = useState<HashResults | null>(null);

  // File
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [fileResults, setFileResults] = useState<HashResults | null>(null);
  const [fileStage, setFileStage] = useState<'idle' | 'reading' | 'hashing' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  // HMAC
  const [hmacKey, setHmacKey] = useState('');
  const [hmacMessage, setHmacMessage] = useState('');
  const [hmacResult, setHmacResult] = useState<string | null>(null);
  const [hmacExpected, setHmacExpected] = useState('');

  const ids = {
    upper: `${baseId}-upper`,
    expected: `${baseId}-expected`,
    text: `${baseId}-text`,
    file: `${baseId}-file`,
    key: `${baseId}-key`,
    message: `${baseId}-message`,
    hmacExpected: `${baseId}-hmac-expected`,
  };

  const trackFirstUse = useCallback(() => {
    if (!firstUseRef.current) {
      firstUseRef.current = true;
      track('generate');
    }
  }, [track]);

  // Live text hashing (debounced). Stale results are ignored via the `cancelled` flag.
  useEffect(() => {
    if (text === '') return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      hashAll(textToBytes(text))
        .then((results) => {
          if (cancelled) return;
          setTextResults(results);
          trackFirstUse();
        })
        .catch((err: unknown) => {
          if (!cancelled) setCryptoError(err instanceof Error ? err.message : 'Hashing failed');
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, trackFirstUse]);

  // Live HMAC (debounced).
  useEffect(() => {
    if (hmacKey === '' && hmacMessage === '') return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      hmacSha256Hex(hmacKey, hmacMessage)
        .then((result) => {
          if (cancelled) return;
          setHmacResult(result);
          trackFirstUse();
        })
        .catch((err: unknown) => {
          if (!cancelled) setCryptoError(err instanceof Error ? err.message : 'HMAC failed');
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hmacKey, hmacMessage, trackFirstUse]);

  // Abort any in-flight file read when leaving the page.
  useEffect(
    () => () => {
      fileJobRef.current?.abort();
    },
    []
  );

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % MODES.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + MODES.length) % MODES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = MODES.length - 1;
    if (next >= 0) {
      event.preventDefault();
      setMode(MODES[next].id);
      tabRefs.current[next]?.focus();
    }
  };

  const copyAndTrack = async (value: string, message?: string) => {
    if (await copyToClipboard(value, message)) track('copy');
  };

  const cancelFile = () => {
    fileJobRef.current?.abort();
    fileJobRef.current = null;
    setFileStage('idle');
    setProgress(0);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    fileJobRef.current?.abort();
    setFileResults(null);
    setFileError(null);
    setFileName(file.name);
    setFileSize(file.size);
    if (file.size > MAX_HASH_FILE_BYTES) {
      setFileStage('idle');
      setFileError(`"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_HASH_FILE_BYTES)}.`);
      return;
    }

    const id = ++jobCounter.current;
    const job = readFileWithProgress(file, (fraction) => {
      if (fileJobRef.current?.id === id) setProgress(fraction);
    });
    fileJobRef.current = { id, abort: job.abort };
    setProgress(0);
    setFileStage('reading');
    try {
      const buffer = await job.promise;
      if (fileJobRef.current?.id !== id) return;
      setFileStage('hashing');
      const results = await hashAll(buffer);
      if (fileJobRef.current?.id !== id) return;
      setFileResults(results);
      setFileStage('done');
      track('generate');
    } catch (err) {
      if (fileJobRef.current?.id !== id) return;
      setFileStage('idle');
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setFileError(err instanceof Error ? err.message : 'Could not hash that file');
      }
    } finally {
      if (fileJobRef.current?.id === id) fileJobRef.current = null;
    }
  };

  const activeResults = mode === 'text' ? (text ? textResults : null) : mode === 'file' ? fileResults : null;
  const comparison: HashComparison = activeResults ? compareWithExpected(expected, activeResults) : { status: 'empty' };

  const hmacDisplay = hmacResult && (hmacKey !== '' || hmacMessage !== '') ? (uppercase ? hmacResult.toUpperCase() : hmacResult) : null;
  const hmacNormalizedExpected = normalizeHash(hmacExpected);
  const hmacMatch = hmacDisplay && hmacNormalizedExpected ? hmacNormalizedExpected === hmacDisplay.toLowerCase() : null;

  const uppercaseToggle = (
    <div className="flex min-h-[44px] items-center gap-2">
      <input
        id={ids.upper}
        type="checkbox"
        checked={uppercase}
        onChange={(e) => setUppercase(e.target.checked)}
        className="h-5 w-5 rounded accent-purple-600"
      />
      <label htmlFor={ids.upper} className="text-sm font-medium text-gray-700 dark:text-gray-200">
        Uppercase hex
      </label>
    </div>
  );

  const expectedField = (
    <div className="mt-6">
      <label htmlFor={ids.expected} className="block text-sm font-semibold text-gray-900 dark:text-white">
        Compare with expected hash (optional)
      </label>
      <input
        id={ids.expected}
        type="text"
        value={expected}
        onChange={(e) => setExpected(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        placeholder="Paste a checksum to verify"
        className={`${FIELD} mt-2 min-h-[44px] px-3 py-2 font-mono text-sm`}
      />
      <div aria-live="polite">
        <ComparisonMessage comparison={comparison} />
      </div>
    </div>
  );

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes and HMAC-SHA256 for text and files, and verify checksums - privately in your browser."
      toolCategory="Security"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            #️⃣
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Hash Generator
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            SHA-1, SHA-256, SHA-384, SHA-512 and HMAC-SHA256 using your browser&apos;s Web Crypto API. Files are hashed locally and never uploaded.
          </p>
        </div>

        {cryptoError && (
          <p role="alert" className={`${ERROR_BOX} mb-6`}>
            {cryptoError}
          </p>
        )}

        <div role="tablist" aria-label="Input type" className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/10">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${m.id}`}
              aria-selected={mode === m.id}
              aria-controls={`${baseId}-panel`}
              tabIndex={mode === m.id ? 0 : -1}
              onClick={() => setMode(m.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`flex-1 min-h-[44px] rounded-xl px-3 py-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                mode === m.id
                  ? 'bg-white text-purple-700 shadow dark:bg-white/20 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${mode}`} className={CARD}>
          {mode === 'text' && (
            <>
              <label htmlFor={ids.text} className="mb-2 block font-semibold text-gray-900 dark:text-white">
                Text to hash
              </label>
              <textarea
                id={ids.text}
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                placeholder="Type or paste text - hashes update as you type"
                className={`${FIELD} h-36 p-4 font-mono text-sm resize-y`}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                {uppercaseToggle}
                <span className="text-xs text-gray-500 dark:text-gray-400">Text is hashed as UTF-8 bytes.</span>
              </div>
              <div aria-live="polite">
                {text && textResults ? (
                  <HashList results={textResults} uppercase={uppercase} onCopy={copyAndTrack} />
                ) : (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Enter some text to see its hashes.</p>
                )}
              </div>
              {expectedField}
            </>
          )}

          {mode === 'file' && (
            <>
              <label htmlFor={ids.file} className="block font-semibold text-gray-900 dark:text-white">
                File to hash (up to {formatBytes(MAX_HASH_FILE_BYTES)})
              </label>
              <input
                id={ids.file}
                type="file"
                onChange={handleFile}
                className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:min-h-[44px] file:cursor-pointer file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
              />
              <div className="mt-2">{uppercaseToggle}</div>

              <div aria-live="polite">
                {fileStage === 'reading' && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span className="break-all">Reading {fileName}…</span>
                      <span>{Math.round(progress * 100)}%</span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label="File read progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(progress * 100)}
                      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
                    >
                      <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <button type="button" className={`${SECONDARY_BTN} mt-3`} onClick={cancelFile}>
                      Cancel
                    </button>
                  </div>
                )}
                {fileStage === 'hashing' && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" aria-hidden="true" />
                    Hashing {formatBytes(fileSize)}…
                  </p>
                )}
                {fileStage === 'done' && fileResults && (
                  <>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 break-all">
                      <span className="font-semibold text-gray-900 dark:text-white">{fileName}</span> · {formatBytes(fileSize)}
                    </p>
                    <HashList results={fileResults} uppercase={uppercase} onCopy={copyAndTrack} />
                  </>
                )}
              </div>
              {fileError && (
                <p role="alert" className={ERROR_BOX}>
                  {fileError}
                </p>
              )}
              {expectedField}
            </>
          )}

          {mode === 'hmac' && (
            <>
              <label htmlFor={ids.key} className="block font-semibold text-gray-900 dark:text-white">
                Secret key
              </label>
              <input
                id={ids.key}
                type="text"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="Your HMAC secret (UTF-8)"
                className={`${FIELD} mt-2 min-h-[44px] px-3 py-2 font-mono text-sm`}
              />
              <label htmlFor={ids.message} className="mt-4 block font-semibold text-gray-900 dark:text-white">
                Message
              </label>
              <textarea
                id={ids.message}
                value={hmacMessage}
                onChange={(e) => setHmacMessage(e.target.value)}
                spellCheck={false}
                placeholder="Payload to sign"
                className={`${FIELD} mt-2 h-32 p-4 font-mono text-sm resize-y`}
              />
              <div className="mt-2">{uppercaseToggle}</div>
              <div aria-live="polite">
                {hmacDisplay ? (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">HMAC-SHA256 (hex)</p>
                    <div className="mt-1 flex items-start gap-2">
                      <code className="flex-1 break-all font-mono text-sm text-gray-900 dark:text-gray-100">{hmacDisplay}</code>
                      <button type="button" className={ICON_BTN} aria-label="Copy HMAC-SHA256" onClick={() => copyAndTrack(hmacDisplay, 'HMAC copied')}>
                        <span aria-hidden="true">📋</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Enter a key and message to compute the signature.</p>
                )}
              </div>
              <label htmlFor={ids.hmacExpected} className="mt-6 block text-sm font-semibold text-gray-900 dark:text-white">
                Verify against expected signature (optional)
              </label>
              <input
                id={ids.hmacExpected}
                type="text"
                value={hmacExpected}
                onChange={(e) => setHmacExpected(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="Hex signature, e.g. from a webhook header"
                className={`${FIELD} mt-2 min-h-[44px] px-3 py-2 font-mono text-sm`}
              />
              <div aria-live="polite">
                {hmacMatch !== null && (
                  <p
                    className={`mt-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                      hmacMatch
                        ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300'
                        : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                    }`}
                  >
                    {hmacMatch ? '✓ Signature matches' : '✗ Signature does not match'}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <p>
            <strong>Why no MD5?</strong> Browsers&apos; built-in Web Crypto API (SubtleCrypto) does not implement MD5 because it is
            cryptographically broken. Use SHA-256 or stronger for integrity checks. SHA-1 is included for legacy checksums only.
          </p>
        </div>
      </div>
    </ToolWrapper>
  );
}
