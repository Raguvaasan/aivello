import React, { useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  MAX_JSON_INPUT_BYTES,
  formatBytes,
  formatJson,
  getJsonStats,
  getLine,
  isWithinSizeLimit,
  minifyJson,
  parseJson,
  utf8ByteLength,
  type JsonErrorInfo,
  type JsonIndent,
  type JsonStats,
} from '../utils/tools/jsonFormat';

const TOOL_ID = 'json-formatter';
const TOOL_NAME = 'JSON Formatter & Validator';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';

const SAMPLE = '{"name":"Aivello","tools":["json-formatter","base64-converter"],"free":true,"limits":{"maxInputMb":5,"indent":2},"tags":null}';

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

type LastAction = 'format' | 'minify';

export default function JsonFormatter() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const inputId = useId();
  const outputId = useId();
  const indentId = useId();
  const sortId = useId();
  const fileId = useId();
  const errorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<JsonIndent>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState('');
  const [lastAction, setLastAction] = useState<LastAction>('format');
  const [error, setError] = useState<JsonErrorInfo | null>(null);
  const [errorSource, setErrorSource] = useState('');
  const [validInfo, setValidInfo] = useState<JsonStats | null>(null);

  const inputBytes = useMemo(() => utf8ByteLength(input), [input]);
  const outputBytes = useMemo(() => utf8ByteLength(output), [output]);
  const tooLarge = !isWithinSizeLimit(input);

  const errorContext = useMemo(() => {
    if (!error || error.line === null || error.column === null) return null;
    const lineText = getLine(errorSource, error.line).replace(/\t/g, ' ');
    const col = Math.max(0, error.column - 1);
    const start = Math.max(0, col - 40);
    const end = Math.min(lineText.length, col + 40);
    const lead = start > 0 ? '…' : '';
    const snippet = lead + lineText.slice(start, end) + (end < lineText.length ? '…' : '');
    return { snippet, caret: ' '.repeat(col - start + lead.length) + '^' };
  }, [error, errorSource]);

  const handleInputChange = (value: string) => {
    setInput(value);
    if (error) setError(null);
    if (validInfo) setValidInfo(null);
  };

  const showError = (err: JsonErrorInfo) => {
    setError(err);
    setErrorSource(input);
    setValidInfo(null);
  };

  const guardSize = (): boolean => {
    if (tooLarge) {
      toast.error(`Input is larger than ${formatBytes(MAX_JSON_INPUT_BYTES)}`);
      return false;
    }
    return true;
  };

  const runTransform = (action: LastAction) => {
    if (!guardSize()) return;
    const result = action === 'format' ? formatJson(input, { indent, sortKeys }) : minifyJson(input, { sortKeys });
    if (!result.ok) {
      showError(result.error);
      setOutput('');
      return;
    }
    setOutput(result.output);
    setLastAction(action);
    setError(null);
    setValidInfo(getJsonStats(result.value));
    track('convert');
  };

  const handleValidate = () => {
    if (!guardSize()) return;
    const result = parseJson(input);
    if (result.ok) {
      setError(null);
      setValidInfo(getJsonStats(result.value));
      toast.success('Valid JSON');
    } else {
      showError(result.error);
    }
    track('analyze');
  };

  const handleCopy = async () => {
    if (output && (await copyToClipboard(output))) track('copy');
  };

  const handleDownload = () => {
    if (!output) return;
    saveAs(new Blob([output], { type: 'application/json;charset=utf-8' }), lastAction === 'minify' ? 'minified.json' : 'formatted.json');
    track('download');
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_JSON_INPUT_BYTES) {
      toast.error(`File is larger than ${formatBytes(MAX_JSON_INPUT_BYTES)}`);
      return;
    }
    try {
      handleInputChange(await file.text());
      setOutput('');
    } catch {
      toast.error('Could not read that file');
    }
  };

  const jumpToError = () => {
    const ta = textareaRef.current;
    if (!ta || !error || error.position === null) return;
    const pos = Math.min(error.position, ta.value.length);
    ta.focus();
    ta.setSelectionRange(pos, Math.min(pos + 1, ta.value.length));
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    if (error.line !== null) ta.scrollTop = Math.max(0, (error.line - 3) * lineHeight);
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Format, beautify, minify and validate JSON online with exact error line and column. Sort keys, copy or download - 100% in your browser."
      toolCategory="Developer"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            🧩
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            JSON Formatter &amp; Validator
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Beautify, minify and validate JSON with precise error locations. Everything runs locally in your browser.
          </p>
        </div>

        <div className={`${CARD} mb-6`}>
          <div className="flex flex-wrap items-end justify-between gap-2 mb-2">
            <label htmlFor={inputId} className="font-semibold text-gray-900 dark:text-white">
              JSON input
            </label>
            <span className={`text-sm ${tooLarge ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              {formatBytes(inputBytes)} / {formatBytes(MAX_JSON_INPUT_BYTES)}
            </span>
          </div>
          <textarea
            id={inputId}
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            placeholder='{"paste": "your JSON here"}'
            className={`${FIELD} font-mono text-sm h-72 p-4 resize-y`}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor={fileId} className={`${SECONDARY_BTN} cursor-pointer focus-within:ring-2 focus-within:ring-purple-500`}>
              <span aria-hidden="true">📂</span> Open file
              <input id={fileId} type="file" accept=".json,application/json,text/plain" onChange={handleFile} className="sr-only" />
            </label>
            <button type="button" className={SECONDARY_BTN} onClick={() => handleInputChange(SAMPLE)}>
              Load sample
            </button>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => {
                handleInputChange('');
                setOutput('');
              }}
              disabled={!input && !output}
            >
              Clear
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-3">
              <label htmlFor={indentId} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Indentation
              </label>
              <select
                id={indentId}
                value={String(indent)}
                onChange={(e) => setIndent(e.target.value === 'tab' ? 'tab' : (Number(e.target.value) as 2 | 4))}
                className={`${FIELD} w-auto min-h-[44px] px-3 py-2 text-sm`}
              >
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
                <option value="tab">Tab</option>
              </select>
            </div>
            <div className="flex min-h-[44px] items-center gap-2">
              <input
                id={sortId}
                type="checkbox"
                checked={sortKeys}
                onChange={(e) => setSortKeys(e.target.checked)}
                className="h-5 w-5 rounded accent-purple-600"
              />
              <label htmlFor={sortId} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Sort keys (recursive)
              </label>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button type="button" className={PRIMARY_BTN} onClick={() => runTransform('format')} disabled={!input.trim() || tooLarge}>
              Format / Beautify
            </button>
            <button type="button" className={SECONDARY_BTN} onClick={() => runTransform('minify')} disabled={!input.trim() || tooLarge}>
              Minify
            </button>
            <button type="button" className={SECONDARY_BTN} onClick={handleValidate} disabled={!input.trim() || tooLarge}>
              Validate
            </button>
          </div>

          <div aria-live="polite" className="mt-4">
            {validInfo && !error && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
                <span aria-hidden="true">✓ </span>Valid JSON - {validInfo.type}
                {validInfo.type === 'object' || validInfo.type === 'array'
                  ? `, ${validInfo.keys.toLocaleString()} keys, depth ${validInfo.depth}`
                  : ''}
              </p>
            )}
          </div>

          {error && (
            <div
              id={errorId}
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
            >
              <p className="font-semibold">
                Invalid JSON{error.line !== null && error.column !== null ? ` at line ${error.line}, column ${error.column}` : ''}
              </p>
              <p className="mt-1 break-words">{error.message}</p>
              {errorContext && (
                <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2 font-mono text-xs text-gray-900 dark:bg-black/30 dark:text-gray-100">
                  {errorContext.snippet}
                  {'\n'}
                  <span className="text-red-600 dark:text-red-400">{errorContext.caret}</span>
                </pre>
              )}
              {error.position !== null && (
                <button type="button" onClick={jumpToError} className={`${SECONDARY_BTN} mt-3 text-sm`}>
                  Jump to error
                </button>
              )}
            </div>
          )}
        </div>

        <div className={CARD}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label htmlFor={outputId} className="font-semibold text-gray-900 dark:text-white">
              Output
            </label>
            {output && <span className="text-sm text-gray-500 dark:text-gray-400">{formatBytes(outputBytes)}</span>}
          </div>
          <textarea
            id={outputId}
            value={output}
            readOnly
            spellCheck={false}
            placeholder="Formatted or minified JSON appears here"
            className={`${FIELD} font-mono text-sm h-72 p-4 resize-y`}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={SECONDARY_BTN} onClick={handleCopy} disabled={!output}>
              <span aria-hidden="true">📋</span> Copy
            </button>
            <button type="button" className={SECONDARY_BTN} onClick={handleDownload} disabled={!output}>
              <span aria-hidden="true">⬇️</span> Download .json
            </button>
            <button
              type="button"
              className={SECONDARY_BTN}
              onClick={() => {
                handleInputChange(output);
                setOutput('');
              }}
              disabled={!output}
            >
              Use as input
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Your JSON never leaves this device. Inputs up to {formatBytes(MAX_JSON_INPUT_BYTES)}.
        </p>
      </div>
    </ToolWrapper>
  );
}
