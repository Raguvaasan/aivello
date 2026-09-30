import React, { useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  MAX_BASE64_FILE_BYTES,
  Base64Error,
  base64ToBytes,
  bytesToBase64,
  decodeBase64Text,
  encodeBase64Text,
  extensionForMime,
  parseDataUrl,
  sniffMimeType,
  toDataUrl,
  toUrlSafe,
} from '../utils/tools/base64';
import { formatBytes } from '../utils/tools/jsonFormat';

const TOOL_ID = 'base64-converter';
const TOOL_NAME = 'Base64 Encoder / Decoder';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';
const ERROR_BOX =
  'mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 break-words';

/** Output longer than this is shown truncated; copy/download still use the full value. */
const PREVIEW_LIMIT = 200000;

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

const errorText = (err: unknown): string =>
  err instanceof Base64Error || err instanceof Error ? err.message : 'Something went wrong';

type Mode = 'text' | 'file';
const MODES: Array<{ id: Mode; label: string }> = [
  { id: 'text', label: 'Text' },
  { id: 'file', label: 'File' },
];

interface EncodedFile {
  name: string;
  size: number;
  mime: string;
  base64: string;
}

export default function Base64Converter() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [mode, setMode] = useState<Mode>('text');

  // Text mode
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');
  const [urlSafe, setUrlSafe] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textStatus, setTextStatus] = useState('');

  // File -> Base64
  const [encoded, setEncoded] = useState<EncodedFile | null>(null);
  const [asDataUrl, setAsDataUrl] = useState(false);
  const [fileUrlSafe, setFileUrlSafe] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  // Base64 -> File
  const [decodeInput, setDecodeInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodeInfo, setDecodeInfo] = useState<string | null>(null);

  const ids = {
    textIn: `${baseId}-text-in`,
    textOut: `${baseId}-text-out`,
    urlSafe: `${baseId}-url-safe`,
    file: `${baseId}-file`,
    dataUrl: `${baseId}-data-url`,
    fileUrlSafe: `${baseId}-file-url-safe`,
    fileOut: `${baseId}-file-out`,
    decodeIn: `${baseId}-decode-in`,
    fileName: `${baseId}-file-name`,
  };

  const fileOutput = useMemo(() => {
    if (!encoded) return '';
    if (asDataUrl) return toDataUrl(encoded.base64, encoded.mime);
    return fileUrlSafe ? toUrlSafe(encoded.base64) : encoded.base64;
  }, [encoded, asDataUrl, fileUrlSafe]);

  const imagePreview = useMemo(
    () => (encoded && encoded.mime.startsWith('image/') ? toDataUrl(encoded.base64, encoded.mime) : null),
    [encoded]
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

  const handleEncode = () => {
    try {
      const out = encodeBase64Text(textInput, urlSafe);
      setTextOutput(out);
      setTextStatus(`Encoded to ${out.length.toLocaleString()} Base64 characters`);
      setTextError(null);
      track('convert');
    } catch (err) {
      setTextError(errorText(err));
    }
  };

  const handleDecode = () => {
    try {
      const out = decodeBase64Text(textInput);
      setTextOutput(out);
      setTextStatus(`Decoded to ${out.length.toLocaleString()} characters of text`);
      setTextError(null);
      track('convert');
    } catch (err) {
      setTextOutput('');
      setTextStatus('');
      setTextError(errorText(err));
    }
  };

  const handleSwap = () => {
    setTextInput(textOutput);
    setTextOutput('');
    setTextError(null);
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setFileError(null);
    if (file.size > MAX_BASE64_FILE_BYTES) {
      setEncoded(null);
      setFileError(`"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_BASE64_FILE_BYTES)}.`);
      return;
    }
    setReading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = file.type || sniffMimeType(bytes) || 'application/octet-stream';
      setEncoded({ name: file.name, size: file.size, mime, base64: bytesToBase64(bytes) });
      track('convert');
    } catch {
      setEncoded(null);
      setFileError('Could not read that file');
    } finally {
      setReading(false);
    }
  };

  const handleDownloadFile = () => {
    try {
      const bytes = base64ToBytes(decodeInput);
      if (bytes.length === 0) {
        setDecodeError('Paste some Base64 data first');
        return;
      }
      const dataUrl = parseDataUrl(decodeInput);
      const mime = dataUrl?.mime ?? sniffMimeType(bytes) ?? 'application/octet-stream';
      const name = fileName.trim() || `decoded.${extensionForMime(mime)}`;
      saveAs(new Blob([bytes], { type: mime }), name);
      setDecodeError(null);
      setDecodeInfo(`Decoded ${formatBytes(bytes.length)} (${mime}) and saved as "${name}"`);
      track('download');
    } catch (err) {
      setDecodeInfo(null);
      setDecodeError(errorText(err));
    }
  };

  const copyAndTrack = async (text: string) => {
    if (text && (await copyToClipboard(text))) track('copy');
  };

  const previewText = (text: string) => (text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text);

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Encode and decode Base64 online - UTF-8 safe text, URL-safe Base64, files to Base64 or data URLs, and Base64 back to files. Runs in your browser."
      toolCategory="Developer"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            🔁
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Base64 Encoder / Decoder
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            UTF-8 safe text encoding, URL-safe variant, and file ↔ Base64 conversion - all offline in your browser.
          </p>
        </div>

        <div role="tablist" aria-label="Conversion mode" className="mb-6 flex gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/10">
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
              aria-controls={`${baseId}-panel-${m.id}`}
              tabIndex={mode === m.id ? 0 : -1}
              onClick={() => setMode(m.id)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
              className={`flex-1 min-h-[44px] rounded-xl px-4 py-2 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                mode === m.id
                  ? 'bg-white text-purple-700 shadow dark:bg-white/20 dark:text-white'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'text' && (
          <div role="tabpanel" id={`${baseId}-panel-text`} aria-labelledby={`${baseId}-tab-text`} className={CARD}>
            <label htmlFor={ids.textIn} className="mb-2 block font-semibold text-gray-900 dark:text-white">
              Input
            </label>
            <textarea
              id={ids.textIn}
              value={textInput}
              onChange={(e) => {
                setTextInput(e.target.value);
                setTextError(null);
              }}
              spellCheck={false}
              placeholder="Type text to encode, or paste Base64 to decode"
              className={`${FIELD} font-mono text-sm h-40 p-4 resize-y`}
            />

            <div className="mt-3 flex min-h-[44px] items-center gap-2">
              <input
                id={ids.urlSafe}
                type="checkbox"
                checked={urlSafe}
                onChange={(e) => setUrlSafe(e.target.checked)}
                className="h-5 w-5 rounded accent-purple-600"
              />
              <label htmlFor={ids.urlSafe} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                URL-safe output (<code className="font-mono">-</code> and <code className="font-mono">_</code>, no padding)
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Decoding accepts both standard and URL-safe Base64, with or without padding.</p>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button type="button" className={PRIMARY_BTN} onClick={handleEncode} disabled={!textInput}>
                Encode
              </button>
              <button type="button" className={PRIMARY_BTN} onClick={handleDecode} disabled={!textInput.trim()}>
                Decode
              </button>
              <button type="button" className={SECONDARY_BTN} onClick={handleSwap} disabled={!textOutput}>
                <span aria-hidden="true">⇅</span> Swap
              </button>
              <button
                type="button"
                className={SECONDARY_BTN}
                onClick={() => {
                  setTextInput('');
                  setTextOutput('');
                  setTextError(null);
                }}
                disabled={!textInput && !textOutput}
              >
                Clear
              </button>
            </div>

            {textError && (
              <p role="alert" className={ERROR_BOX}>
                {textError}
              </p>
            )}
            <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-gray-500 dark:text-gray-400">
              {textError ? '' : textStatus}
            </p>

            <div className="mt-5 flex items-center justify-between gap-2">
              <label htmlFor={ids.textOut} className="font-semibold text-gray-900 dark:text-white">
                Output
              </label>
              <button type="button" className={SECONDARY_BTN} onClick={() => copyAndTrack(textOutput)} disabled={!textOutput}>
                <span aria-hidden="true">📋</span> Copy
              </button>
            </div>
            <textarea
              id={ids.textOut}
              value={textOutput}
              readOnly
              spellCheck={false}
              placeholder="Result appears here"
              className={`${FIELD} mt-2 font-mono text-sm h-40 p-4 resize-y`}
            />
          </div>
        )}

        {mode === 'file' && (
          <div role="tabpanel" id={`${baseId}-panel-file`} aria-labelledby={`${baseId}-tab-file`} className="space-y-6">
            <section className={CARD} aria-labelledby={`${baseId}-enc-title`}>
              <h3 id={`${baseId}-enc-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
                File → Base64
              </h3>
              <label htmlFor={ids.file} className="mt-3 block text-sm text-gray-600 dark:text-gray-300">
                Choose a file (up to {formatBytes(MAX_BASE64_FILE_BYTES)})
              </label>
              <input
                id={ids.file}
                type="file"
                onChange={handleFile}
                className="mt-2 block w-full text-sm text-gray-700 dark:text-gray-200 file:mr-4 file:min-h-[44px] file:cursor-pointer file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:opacity-90"
              />

              <div aria-live="polite">
                {reading && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Reading file…</p>}
              </div>
              {fileError && (
                <p role="alert" className={ERROR_BOX}>
                  {fileError}
                </p>
              )}

              {encoded && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                    <span className="font-semibold text-gray-900 dark:text-white">{encoded.name}</span> · {formatBytes(encoded.size)} ·{' '}
                    {encoded.mime} → {fileOutput.length.toLocaleString()} characters
                  </p>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt={`Preview of ${encoded.name}`}
                      className="mt-3 max-h-40 max-w-full rounded-lg border border-gray-200 dark:border-white/20 object-contain"
                    />
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-6">
                    <div className="flex min-h-[44px] items-center gap-2">
                      <input
                        id={ids.dataUrl}
                        type="checkbox"
                        checked={asDataUrl}
                        onChange={(e) => setAsDataUrl(e.target.checked)}
                        className="h-5 w-5 rounded accent-purple-600"
                      />
                      <label htmlFor={ids.dataUrl} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Data URL (<code className="font-mono">data:{encoded.mime};base64,…</code>)
                      </label>
                    </div>
                    <div className="flex min-h-[44px] items-center gap-2">
                      <input
                        id={ids.fileUrlSafe}
                        type="checkbox"
                        checked={fileUrlSafe && !asDataUrl}
                        disabled={asDataUrl}
                        onChange={(e) => setFileUrlSafe(e.target.checked)}
                        className="h-5 w-5 rounded accent-purple-600 disabled:opacity-50"
                      />
                      <label htmlFor={ids.fileUrlSafe} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        URL-safe
                      </label>
                    </div>
                  </div>
                  <label htmlFor={ids.fileOut} className="sr-only">
                    Base64 output
                  </label>
                  <textarea
                    id={ids.fileOut}
                    value={previewText(fileOutput)}
                    readOnly
                    spellCheck={false}
                    className={`${FIELD} mt-2 font-mono text-xs h-40 p-3 resize-y break-all`}
                  />
                  {fileOutput.length > PREVIEW_LIMIT && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Preview shows the first {PREVIEW_LIMIT.toLocaleString()} characters. Copy or download for the full output.
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={SECONDARY_BTN} onClick={() => copyAndTrack(fileOutput)}>
                      <span aria-hidden="true">📋</span> Copy
                    </button>
                    <button
                      type="button"
                      className={SECONDARY_BTN}
                      onClick={() => {
                        saveAs(new Blob([fileOutput], { type: 'text/plain;charset=utf-8' }), `${encoded.name}.base64.txt`);
                        track('download');
                      }}
                    >
                      <span aria-hidden="true">⬇️</span> Download .txt
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className={CARD} aria-labelledby={`${baseId}-dec-title`}>
              <h3 id={`${baseId}-dec-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
                Base64 → File
              </h3>
              <label htmlFor={ids.decodeIn} className="mt-3 block text-sm text-gray-600 dark:text-gray-300">
                Paste Base64 or a data URL
              </label>
              <textarea
                id={ids.decodeIn}
                value={decodeInput}
                onChange={(e) => {
                  setDecodeInput(e.target.value);
                  setDecodeError(null);
                  setDecodeInfo(null);
                }}
                spellCheck={false}
                placeholder="data:image/png;base64,iVBORw0KGgo…"
                className={`${FIELD} mt-2 font-mono text-xs h-32 p-3 resize-y break-all`}
              />
              <label htmlFor={ids.fileName} className="mt-3 block text-sm text-gray-600 dark:text-gray-300">
                File name (optional - the extension is detected automatically)
              </label>
              <input
                id={ids.fileName}
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="decoded.png"
                className={`${FIELD} mt-2 min-h-[44px] px-3 py-2 text-sm`}
              />
              <button type="button" className={`${PRIMARY_BTN} mt-4 w-full sm:w-auto`} onClick={handleDownloadFile} disabled={!decodeInput.trim()}>
                <span aria-hidden="true">⬇️</span> Decode &amp; download
              </button>
              {decodeError && (
                <p role="alert" className={ERROR_BOX}>
                  {decodeError}
                </p>
              )}
              <div aria-live="polite">
                {decodeInfo && <p className="mt-3 text-sm text-green-700 dark:text-green-300 break-words">{decodeInfo}</p>}
              </div>
            </section>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing is uploaded - encoding happens on your device.</p>
      </div>
    </ToolWrapper>
  );
}
