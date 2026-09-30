import React, { useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  MAX_BULK,
  MIN_BULK,
  clampCount,
  formatUuid,
  generateUuids,
  inspectUuid,
  type UuidFormatOptions,
  type UuidVersionOption,
} from '../utils/tools/uuid';

const TOOL_ID = 'uuid-generator';
const TOOL_NAME = 'UUID Generator';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';

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

const VERSIONS: Array<{ id: UuidVersionOption; label: string; hint: string }> = [
  { id: 'v4', label: 'Version 4', hint: 'Random - the everyday choice' },
  { id: 'v7', label: 'Version 7', hint: 'Time-ordered - sorts by creation time, great for database keys' },
];

const FORMAT_FLAGS: Array<{ key: 'uppercase' | 'noHyphens' | 'braces'; label: string }> = [
  { key: 'uppercase', label: 'Uppercase' },
  { key: 'noHyphens', label: 'No hyphens' },
  { key: 'braces', label: '{Braces}' },
];

export default function UuidGenerator() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const firstValidateRef = useRef(false);

  const [version, setVersion] = useState<UuidVersionOption>('v4');
  const [countInput, setCountInput] = useState('1');
  const [flags, setFlags] = useState({ uppercase: false, noHyphens: false, braces: false });
  // Canonical UUIDs; formatting is applied at render so toggles re-format existing output.
  const [raw, setRaw] = useState<string[]>(() => generateUuids(1, 'v4'));
  const [rawVersion, setRawVersion] = useState<UuidVersionOption>('v4');
  const [validateInput, setValidateInput] = useState('');

  const ids = {
    count: `${baseId}-count`,
    output: `${baseId}-output`,
    validate: `${baseId}-validate`,
  };

  const format: UuidFormatOptions = { uppercase: flags.uppercase, hyphens: !flags.noHyphens, braces: flags.braces };
  const formatted = useMemo(
    () => raw.map((u) => formatUuid(u, { uppercase: flags.uppercase, hyphens: !flags.noHyphens, braces: flags.braces })),
    [raw, flags.uppercase, flags.noHyphens, flags.braces]
  );
  const joined = useMemo(() => formatted.join('\n'), [formatted]);

  const parsedCount = Number(countInput);
  const countValid = countInput.trim() !== '' && Number.isInteger(parsedCount) && parsedCount >= MIN_BULK && parsedCount <= MAX_BULK;

  const inspection = useMemo(() => (validateInput.trim() ? inspectUuid(validateInput) : null), [validateInput]);

  const handleGenerate = () => {
    const n = clampCount(countValid ? parsedCount : 1);
    setRaw(generateUuids(n, version));
    setRawVersion(version);
    setCountInput(String(n));
    track('generate');
  };

  const handleCopyAll = async () => {
    if (await copyToClipboard(joined, formatted.length === 1 ? 'UUID copied' : `${formatted.length} UUIDs copied`)) track('copy');
  };

  const handleDownload = () => {
    saveAs(new Blob([`${joined}\n`], { type: 'text/plain;charset=utf-8' }), `uuids-${rawVersion}-${formatted.length}.txt`);
    track('download');
  };

  const handleValidateChange = (value: string) => {
    setValidateInput(value);
    if (!firstValidateRef.current && inspectUuid(value).valid) {
      firstValidateRef.current = true;
      track('analyze');
    }
  };

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Generate UUID v4 and time-ordered UUID v7 in bulk (up to 1,000), with uppercase, no-hyphen and brace formats, plus a UUID validator."
      toolCategory="Developer"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            🆔
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            UUID Generator
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Cryptographically random v4 and sortable v7 UUIDs, generated in your browser. Validate any UUID and see its version.
          </p>
        </div>

        <div className={`${CARD} mb-6`}>
          <fieldset>
            <legend className="font-semibold text-gray-900 dark:text-white">UUID version</legend>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VERSIONS.map((v) => {
                const id = `${baseId}-version-${v.id}`;
                const selected = version === v.id;
                return (
                  <div key={v.id} className="relative">
                    <input
                      id={id}
                      type="radio"
                      name={`${baseId}-version`}
                      value={v.id}
                      checked={selected}
                      onChange={() => setVersion(v.id)}
                      className="peer sr-only"
                    />
                    <label
                      htmlFor={id}
                      className={`block min-h-[44px] cursor-pointer rounded-xl border p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 ${
                        selected
                          ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-500/20'
                          : 'border-gray-300 bg-white hover:border-purple-300 dark:border-gray-600 dark:bg-gray-800/60 dark:hover:border-purple-400/60'
                      }`}
                    >
                      <span className="block font-semibold text-gray-900 dark:text-white">{v.label}</span>
                      <span className="block text-sm text-gray-600 dark:text-gray-300">{v.hint}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <label htmlFor={ids.count} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                How many ({MIN_BULK}–{MAX_BULK.toLocaleString()})
              </label>
              <input
                id={ids.count}
                type="number"
                inputMode="numeric"
                min={MIN_BULK}
                max={MAX_BULK}
                step={1}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
                aria-invalid={!countValid}
                className={`${FIELD} mt-1 w-32 min-h-[44px] px-3 py-2 font-mono`}
              />
            </div>
            {FORMAT_FLAGS.map((f) => {
              const id = `${baseId}-${f.key}`;
              return (
                <div key={f.key} className="flex min-h-[44px] items-center gap-2">
                  <input
                    id={id}
                    type="checkbox"
                    checked={flags[f.key]}
                    onChange={(e) => setFlags((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                    className="h-5 w-5 rounded accent-purple-600"
                  />
                  <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {f.label}
                  </label>
                </div>
              );
            })}
          </div>
          {!countValid && (
            <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
              Enter a whole number from {MIN_BULK} to {MAX_BULK.toLocaleString()}.
            </p>
          )}

          <button type="button" className={`${PRIMARY_BTN} mt-5 w-full sm:w-auto`} onClick={handleGenerate}>
            <span aria-hidden="true">⚡</span> Generate {version === 'v7' ? 'v7' : 'v4'} UUID{countValid && parsedCount > 1 ? 's' : ''}
          </button>
        </div>

        <div className={`${CARD} mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor={ids.output} className="font-semibold text-gray-900 dark:text-white">
              Result
            </label>
            <span aria-live="polite" className="text-sm text-gray-500 dark:text-gray-400">
              {formatted.length.toLocaleString()} × UUID {rawVersion}
            </span>
          </div>
          {formatted.length === 1 ? (
            <output
              id={ids.output}
              className="mt-2 block rounded-xl border border-gray-300 bg-white p-4 text-center font-mono text-base sm:text-lg text-gray-900 break-all dark:border-gray-600 dark:bg-gray-800/60 dark:text-white"
            >
              {formatted[0]}
            </output>
          ) : (
            <textarea
              id={ids.output}
              value={joined}
              readOnly
              spellCheck={false}
              rows={Math.min(12, formatted.length)}
              className={`${FIELD} mt-2 p-4 font-mono text-sm resize-y`}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={SECONDARY_BTN} onClick={handleCopyAll}>
              <span aria-hidden="true">📋</span> {formatted.length === 1 ? 'Copy' : 'Copy all'}
            </button>
            <button type="button" className={SECONDARY_BTN} onClick={handleDownload}>
              <span aria-hidden="true">⬇️</span> Download .txt
            </button>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Format: {format.uppercase ? 'uppercase' : 'lowercase'}, {format.hyphens ? 'with hyphens' : 'no hyphens'}
            {format.braces ? ', in braces' : ''}.
          </p>
        </div>

        <div className={CARD}>
          <label htmlFor={ids.validate} className="block font-semibold text-gray-900 dark:text-white">
            Validate a UUID
          </label>
          <input
            id={ids.validate}
            type="text"
            value={validateInput}
            onChange={(e) => handleValidateChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            placeholder="e.g. 017f22e2-79b0-7cc3-98c4-dc0c0c07398f"
            className={`${FIELD} mt-2 min-h-[44px] px-3 py-2 font-mono text-sm`}
          />
          <div aria-live="polite">
            {inspection && !inspection.valid && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <span aria-hidden="true">✗ </span>
                {inspection.error}
              </p>
            )}
            {inspection && inspection.valid && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-200">
                <p className="font-semibold">
                  <span aria-hidden="true">✓ </span>Valid UUID - {inspection.description}
                </p>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <dt className="text-green-800/80 dark:text-green-300/80">Canonical</dt>
                  <dd className="font-mono break-all">{inspection.canonical}</dd>
                  {inspection.variant && (
                    <>
                      <dt className="text-green-800/80 dark:text-green-300/80">Variant</dt>
                      <dd>{inspection.variant}</dd>
                    </>
                  )}
                  {inspection.timestamp && (
                    <>
                      <dt className="text-green-800/80 dark:text-green-300/80">Created</dt>
                      <dd className="break-words">
                        {inspection.timestamp.toISOString()} ({inspection.timestamp.toLocaleString()})
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
