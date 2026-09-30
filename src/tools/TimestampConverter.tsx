import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  UNIT_LABELS,
  describeTimestamp,
  epochToZonedInputValue,
  getLocalTimeZone,
  getSupportedTimeZones,
  parseTimestamp,
  zonedDateTimeToEpoch,
  type TimestampUnit,
  type TimestampUnitOption,
} from '../utils/tools/timestamp';

const TOOL_ID = 'timestamp-converter';
const TOOL_NAME = 'Timestamp Converter';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const FIELD =
  'w-full bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50';
const PRIMARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2 font-medium text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';
const ICON_BTN =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-100 dark:hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';

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

const UNIT_OPTIONS: Array<{ value: TimestampUnitOption; label: string }> = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'seconds', label: 'Seconds' },
  { value: 'milliseconds', label: 'Milliseconds' },
  { value: 'microseconds', label: 'Microseconds' },
  { value: 'nanoseconds', label: 'Nanoseconds' },
];

interface ResultRowProps {
  label: string;
  value: string;
  onCopy: (value: string, label: string) => void;
  mono?: boolean;
}

function ResultRow({ label, value, onCopy, mono = true }: ResultRowProps) {
  return (
    <div className="flex items-start gap-2 border-b border-gray-100 py-2 last:border-0 dark:border-white/10">
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className={`mt-0.5 break-all text-sm text-gray-900 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>{value}</dd>
      </div>
      <button type="button" className={ICON_BTN} aria-label={`Copy ${label}`} onClick={() => onCopy(value, `${label} copied`)}>
        <span aria-hidden="true">📋</span>
      </button>
    </div>
  );
}

export default function TimestampConverter() {
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const baseId = useId();
  const firstUseRef = useRef(false);

  const localZone = useMemo(() => getLocalTimeZone(), []);
  const zones = useMemo(() => getSupportedTimeZones(), []);

  const [now, setNow] = useState(() => Date.now());
  const [timeZone, setTimeZone] = useState(localZone);
  const [tsInput, setTsInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [unit, setUnit] = useState<TimestampUnitOption>('auto');
  const [dateInput, setDateInput] = useState(() => epochToZonedInputValue(Date.now(), localZone));

  const ids = {
    zone: `${baseId}-zone`,
    ts: `${baseId}-ts`,
    unit: `${baseId}-unit`,
    date: `${baseId}-date`,
    tsError: `${baseId}-ts-error`,
  };

  // Live clock; the interval is cleared on unmount.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const markUsed = () => {
    if (!firstUseRef.current) {
      firstUseRef.current = true;
      track('convert');
    }
  };

  const parsed = useMemo(() => parseTimestamp(tsInput, unit), [tsInput, unit]);
  const details = useMemo(() => {
    if (!parsed.ok) return null;
    try {
      return describeTimestamp(parsed.ms, timeZone, now);
    } catch {
      return null;
    }
  }, [parsed, timeZone, now]);
  const localDetails = useMemo(() => {
    if (!parsed.ok || timeZone === localZone) return null;
    try {
      return describeTimestamp(parsed.ms, localZone, now);
    } catch {
      return null;
    }
  }, [parsed, timeZone, localZone, now]);

  const pickedMs = useMemo(() => (dateInput ? zonedDateTimeToEpoch(dateInput, timeZone) : null), [dateInput, timeZone]);

  const copyAndTrack = async (value: string, message?: string) => {
    if (await copyToClipboard(value, message)) track('copy');
  };

  const handleTsChange = (value: string) => {
    setTsInput(value);
    if (parseTimestamp(value, unit).ok) markUsed();
  };

  const handleNow = () => {
    const current = Date.now();
    setNow(current);
    setTsInput(unit === 'milliseconds' ? String(current) : String(Math.floor(current / 1000)));
    if (unit !== 'auto' && unit !== 'seconds' && unit !== 'milliseconds') setUnit('auto');
    track('convert');
  };

  const handleDateNow = () => {
    setDateInput(epochToZonedInputValue(Date.now(), timeZone));
    track('convert');
  };

  const handleDateChange = (value: string) => {
    setDateInput(value);
    if (value && zonedDateTimeToEpoch(value, timeZone) !== null) markUsed();
  };

  const nowSeconds = Math.floor(now / 1000);
  const detectedUnit: TimestampUnit | null = parsed.ok ? parsed.unit : null;

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Convert Unix timestamps (seconds or milliseconds) to human dates and back - local time, UTC, ISO 8601, RFC 2822, relative time and any time zone."
      toolCategory="Developer"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div aria-hidden="true" className="text-4xl mb-2">
            ⏰
          </div>
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
            Timestamp Converter
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Unix epoch ↔ human-readable dates in any time zone. Seconds and milliseconds are detected automatically.
          </p>
        </div>

        <div className={`${CARD} mb-6`}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Unix time</h3>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Seconds</p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300 break-all" aria-live="off">
                  {nowSeconds}
                </p>
              </div>
              <button type="button" className={ICON_BTN} aria-label="Copy current Unix time in seconds" onClick={() => copyAndTrack(String(nowSeconds), 'Seconds copied')}>
                <span aria-hidden="true">📋</span>
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-gray-50 p-3 dark:bg-white/5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Milliseconds</p>
                <p className="font-mono text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-300 break-all" aria-live="off">
                  {now}
                </p>
              </div>
              <button type="button" className={ICON_BTN} aria-label="Copy current Unix time in milliseconds" onClick={() => copyAndTrack(String(now), 'Milliseconds copied')}>
                <span aria-hidden="true">📋</span>
              </button>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor={ids.zone} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Time zone
            </label>
            <select
              id={ids.zone}
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className={`${FIELD} mt-1 min-h-[44px] px-3 py-2 text-sm`}
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                  {z === localZone ? ' (your time zone)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className={CARD} aria-labelledby={`${baseId}-ts-title`}>
            <h3 id={`${baseId}-ts-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
              Timestamp → Date
            </h3>
            <label htmlFor={ids.ts} className="mt-3 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Unix timestamp
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={ids.ts}
                type="text"
                inputMode="decimal"
                value={tsInput}
                onChange={(e) => handleTsChange(e.target.value)}
                spellCheck={false}
                autoComplete="off"
                placeholder="1700000000"
                aria-invalid={!parsed.ok && tsInput.trim() !== '' ? true : undefined}
                aria-describedby={!parsed.ok && tsInput.trim() !== '' ? ids.tsError : undefined}
                className={`${FIELD} min-h-[44px] min-w-0 flex-1 px-3 py-2 font-mono`}
              />
              <button type="button" className={SECONDARY_BTN} onClick={handleNow}>
                Now
              </button>
            </div>
            <label htmlFor={ids.unit} className="mt-3 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Unit
            </label>
            <select
              id={ids.unit}
              value={unit}
              onChange={(e) => setUnit(e.target.value as TimestampUnitOption)}
              className={`${FIELD} mt-1 min-h-[44px] px-3 py-2 text-sm`}
            >
              {UNIT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {!parsed.ok && tsInput.trim() !== '' && (
              <p id={ids.tsError} role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                {parsed.error}
              </p>
            )}

            {/* Announce only the stable conversion, not the relative time that ticks every second. */}
            <p className="sr-only" aria-live="polite">
              {details ? `${details.human}. ${details.iso}` : ''}
            </p>
            <div>
              {details && detectedUnit && (
                <>
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {parsed.ok && parsed.detected ? 'Detected as ' : 'Interpreted as '}
                    <span className="font-semibold text-purple-700 dark:text-purple-300">{UNIT_LABELS[detectedUnit].toLowerCase()}</span> ·{' '}
                    <span className="font-semibold">{details.relative}</span>
                  </p>
                  <dl className="mt-2">
                    <ResultRow label={`${timeZone === localZone ? 'Local' : 'Selected zone'} (${timeZone})`} value={details.human} onCopy={copyAndTrack} mono={false} />
                    {localDetails && <ResultRow label={`Local (${localZone})`} value={localDetails.human} onCopy={copyAndTrack} mono={false} />}
                    <ResultRow label="UTC" value={details.humanUtc} onCopy={copyAndTrack} mono={false} />
                    <ResultRow label="ISO 8601 (UTC)" value={details.iso} onCopy={copyAndTrack} />
                    <ResultRow label={`ISO 8601 (${details.offset})`} value={details.isoZoned} onCopy={copyAndTrack} />
                    <ResultRow label="RFC 2822" value={details.rfc2822} onCopy={copyAndTrack} />
                    <ResultRow label="Relative" value={details.relative} onCopy={copyAndTrack} mono={false} />
                    <ResultRow label="Unix seconds" value={details.units.seconds} onCopy={copyAndTrack} />
                    <ResultRow label="Unix milliseconds" value={details.units.milliseconds} onCopy={copyAndTrack} />
                  </dl>
                </>
              )}
            </div>
          </section>

          <section className={CARD} aria-labelledby={`${baseId}-date-title`}>
            <h3 id={`${baseId}-date-title`} className="text-lg font-semibold text-gray-900 dark:text-white">
              Date → Timestamp
            </h3>
            <label htmlFor={ids.date} className="mt-3 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Date and time in {timeZone.replace(/_/g, ' ')}
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id={ids.date}
                type="datetime-local"
                step={1}
                value={dateInput}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`${FIELD} min-h-[44px] min-w-0 flex-1 px-3 py-2 font-mono [color-scheme:light] dark:[color-scheme:dark]`}
              />
              <button type="button" className={SECONDARY_BTN} onClick={handleDateNow}>
                Now
              </button>
            </div>

            <div aria-live="polite">
              {dateInput && pickedMs === null && (
                <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                  That date and time is not valid.
                </p>
              )}
              {pickedMs !== null && (
                <dl className="mt-3">
                  <ResultRow label="Unix seconds" value={String(Math.floor(pickedMs / 1000))} onCopy={copyAndTrack} />
                  <ResultRow label="Unix milliseconds" value={String(pickedMs)} onCopy={copyAndTrack} />
                  <ResultRow label="ISO 8601 (UTC)" value={new Date(pickedMs).toISOString()} onCopy={copyAndTrack} />
                </dl>
              )}
            </div>
            <button
              type="button"
              className={`${PRIMARY_BTN} mt-4 w-full`}
              disabled={pickedMs === null}
              onClick={() => {
                if (pickedMs === null) return;
                setTsInput(String(Math.floor(pickedMs / 1000)));
                setUnit('auto');
                track('convert');
              }}
            >
              Use in timestamp converter
            </button>
          </section>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Values below 100,000,000,000 are read as seconds, larger ones as milliseconds (then micro- and nanoseconds).
        </p>
      </div>
    </ToolWrapper>
  );
}
