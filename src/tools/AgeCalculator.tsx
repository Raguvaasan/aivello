import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  addToDate,
  calculateAge,
  dateDifference,
  formatISODate,
  formatLongDate,
  parseISODate,
  pluralize,
  todayLocal,
  DATE_UNITS,
  MAX_YEAR,
  MIN_YEAR,
  type AgeResult,
  type DateDifference,
  type DateUnit,
  type SimpleDate,
} from '../utils/tools/dateCalc';

const TOOL_ID = 'age-calculator';
const TOOL_NAME = 'Age & Date Calculator';

const CARD = 'bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg';
const INPUT =
  'w-full min-w-0 min-h-[44px] bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:[color-scheme:dark]';
const PRIMARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl px-5 py-3 font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900';
const SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-white/20 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50';
const LABEL = 'block font-semibold text-gray-900 dark:text-white mb-2';
const DATE_MIN = `${String(MIN_YEAR).padStart(4, '0')}-01-01`;
const DATE_MAX = `${MAX_YEAR}-12-31`;

type TabId = 'age' | 'difference' | 'add';
const TABS: { id: TabId; label: string }[] = [
  { id: 'age', label: 'Age' },
  { id: 'difference', label: 'Date difference' },
  { id: 'add', label: 'Add / subtract' },
];

const todayIso = () => formatISODate(todayLocal());

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-4 text-center min-w-0">
      <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300 tabular-nums break-words">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-xl border border-red-200 dark:border-red-400/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-200">
      {children}
    </p>
  );
}

const ymd = (d: { years: number; months: number; days: number }) =>
  `${pluralize(d.years, 'year')}, ${pluralize(d.months, 'month')}, ${pluralize(d.days, 'day')}`;

function TotalsGrid({ diff }: { diff: Omit<DateDifference, 'isNegative'> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Total months" value={diff.totalMonths.toLocaleString()} />
      <Stat
        label="Total weeks"
        value={diff.remainderDays ? `${diff.totalWeeks.toLocaleString()} + ${diff.remainderDays}d` : diff.totalWeeks.toLocaleString()}
      />
      <Stat label="Total days" value={diff.totalDays.toLocaleString()} />
      <Stat label="Total hours" value={diff.totalHours.toLocaleString()} />
    </div>
  );
}

/* ---------------------------------------------------------------- Age tab */

function AgeTab({ onCalculated }: { onCalculated: () => void }) {
  const id = useId();
  const [birth, setBirth] = useState('');
  const [target, setTarget] = useState(todayIso);
  const [result, setResult] = useState<{ age: AgeResult; target: SimpleDate } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const b = parseISODate(birth);
    const t = parseISODate(target);
    if (!b) return fail('Enter a valid date of birth.');
    if (!t) return fail('Enter a valid "age on" date.');
    const age = calculateAge(b, t);
    if (!age) return fail('The date of birth is after the "age on" date.');
    setError(null);
    setResult({ age, target: t });
    onCalculated();
  };

  const fail = (message: string) => {
    setError(message);
    setResult(null);
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-birth`} className={LABEL}>
            Date of birth
          </label>
          <input id={`${id}-birth`} type="date" required min={DATE_MIN} max={DATE_MAX} value={birth} onChange={(e) => setBirth(e.target.value)} className={INPUT} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-target`} className={LABEL}>
            Age on
          </label>
          <div className="flex gap-2">
            <input id={`${id}-target`} type="date" required min={DATE_MIN} max={DATE_MAX} value={target} onChange={(e) => setTarget(e.target.value)} className={INPUT} />
            <button type="button" className={SECONDARY_BTN} onClick={() => setTarget(todayIso())}>
              Today
            </button>
          </div>
        </div>
        <button type="submit" className={`${PRIMARY_BTN} sm:col-span-2`}>
          Calculate age
        </button>
      </form>

      {error && <ErrorText>{error}</ErrorText>}

      <div aria-live="polite">
        {result && (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">Age on {formatLongDate(result.target)}</p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{ymd(result.age)}</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Born on a <strong className="text-gray-900 dark:text-white">{result.age.weekdayBorn}</strong>
              </p>
            </div>

            <TotalsGrid diff={result.age} />

            <div className="rounded-xl border border-purple-200 dark:border-purple-400/30 bg-purple-50 dark:bg-purple-500/10 p-4 text-center">
              {result.age.isBirthdayToday ? (
                <p className="text-lg font-semibold text-purple-800 dark:text-purple-100">
                  <span aria-hidden="true">🎉 </span>Happy birthday! Turning {result.age.nextBirthdayAge} today.
                </p>
              ) : (
                <p className="text-gray-800 dark:text-gray-100">
                  <span aria-hidden="true">🎂 </span>
                  Next birthday: <strong>{formatLongDate(result.age.nextBirthday)}</strong> - turning{' '}
                  <strong>{result.age.nextBirthdayAge}</strong> in <strong>{pluralize(result.age.daysUntilNextBirthday, 'day')}</strong>.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------- Difference tab */

function DifferenceTab({ onCalculated }: { onCalculated: () => void }) {
  const id = useId();
  const [start, setStart] = useState(todayIso);
  const [end, setEnd] = useState('');
  const [result, setResult] = useState<{ diff: DateDifference; start: SimpleDate; end: SimpleDate } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = parseISODate(start);
    const en = parseISODate(end);
    if (!s || !en) {
      setError('Enter two valid dates.');
      setResult(null);
      return;
    }
    setError(null);
    setResult({ diff: dateDifference(s, en), start: s, end: en });
    onCalculated();
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
        <div className="min-w-0">
          <label htmlFor={`${id}-start`} className={LABEL}>
            Start date
          </label>
          <input id={`${id}-start`} type="date" required min={DATE_MIN} max={DATE_MAX} value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-end`} className={LABEL}>
            End date
          </label>
          <input id={`${id}-end`} type="date" required min={DATE_MIN} max={DATE_MAX} value={end} onChange={(e) => setEnd(e.target.value)} className={INPUT} />
        </div>
        <button type="submit" className={`${PRIMARY_BTN} sm:col-span-2`}>
          Calculate difference
        </button>
      </form>

      {error && <ErrorText>{error}</ErrorText>}

      <div aria-live="polite">
        {result && (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                From {formatLongDate(result.start)} to {formatLongDate(result.end)}
              </p>
              <p className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{ymd(result.diff)}</p>
              {result.diff.isNegative && (
                <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">The end date is before the start date - showing the time between them.</p>
              )}
            </div>
            <TotalsGrid diff={result.diff} />
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              The end date is not counted. Hours assume 24-hour days (daylight-saving changes are ignored).
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------- Add/subtract tab */

function AddTab({ onCalculated }: { onCalculated: () => void }) {
  const id = useId();
  const [start, setStart] = useState(todayIso);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('30');
  const [unit, setUnit] = useState<DateUnit>('days');
  const [result, setResult] = useState<{ date: SimpleDate; summary: string; clamped: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const s = parseISODate(start);
    const n = Number(amount);
    if (!s) return fail('Enter a valid start date.');
    if (amount.trim() === '' || !Number.isInteger(n) || n < 0) return fail('Enter a whole number of 0 or more.');
    if (n > 3_650_000) return fail('That amount is too large.');
    const date = addToDate(s, operation === 'add' ? n : -n, unit);
    if (!date) return fail(`The result falls outside the supported range (years ${MIN_YEAR}-${MAX_YEAR}).`);
    const clamped = (unit === 'months' || unit === 'years') && date.day < s.day;
    setError(null);
    setResult({
      date,
      summary: `${formatLongDate(s)} ${operation === 'add' ? '+' : '-'} ${pluralize(n, unit.replace(/s$/, ''))}`,
      clamped,
    });
    onCalculated();
  };

  const fail = (message: string) => {
    setError(message);
    setResult(null);
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:items-end">
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-start`} className={LABEL}>
            Start date
          </label>
          <input id={`${id}-start`} type="date" required min={DATE_MIN} max={DATE_MAX} value={start} onChange={(e) => setStart(e.target.value)} className={INPUT} />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-op`} className={LABEL}>
            Operation
          </label>
          <select id={`${id}-op`} value={operation} onChange={(e) => setOperation(e.target.value === 'subtract' ? 'subtract' : 'add')} className={INPUT}>
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
          </select>
        </div>
        <div className="min-w-0">
          <label htmlFor={`${id}-amount`} className={LABEL}>
            Amount
          </label>
          <input
            id={`${id}-amount`}
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={INPUT}
          />
        </div>
        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${id}-unit`} className={LABEL}>
            Unit
          </label>
          <select
            id={`${id}-unit`}
            value={unit}
            onChange={(e) => setUnit(DATE_UNITS.find((u) => u === e.target.value) ?? 'days')}
            className={`${INPUT} capitalize`}
          >
            {DATE_UNITS.map((u) => (
              <option key={u} value={u}>
                {u[0].toUpperCase() + u.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={`${PRIMARY_BTN} sm:col-span-2 lg:col-span-4`}>
          Calculate date
        </button>
      </form>

      {error && <ErrorText>{error}</ErrorText>}

      <div aria-live="polite">
        {result && (
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">{result.summary} =</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{formatLongDate(result.date)}</p>
            <p className="font-mono text-gray-600 dark:text-gray-300">{formatISODate(result.date)}</p>
            {result.clamped && (
              <p className="text-sm text-amber-700 dark:text-amber-300">
                That month is shorter, so the date was moved to its last day.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ Page */

export default function AgeCalculator() {
  const uid = useId();
  const track = useToolTracking(TOOL_ID, TOOL_NAME);
  const [activeTab, setActiveTab] = useState<TabId>('age');
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({ age: null, difference: null, add: null });

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const tab = TABS[next].id;
    setActiveTab(tab);
    tabRefs.current[tab]?.focus();
  };

  const onCalculated = () => track('analyze');

  return (
    <ToolWrapper
      toolId={TOOL_ID}
      toolName={TOOL_NAME}
      toolDescription="Calculate your exact age in years, months and days, count the days between two dates, or add and subtract days, weeks, months and years."
      toolCategory="Utility"
    >
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
            <span aria-hidden="true">🎂</span> Age &amp; Date Calculator
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Exact age, the time between two dates, or a date plus or minus any number of days, weeks, months or years.
          </p>
        </div>

        <div className={CARD}>
          <div role="tablist" aria-label="Calculator mode" className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 dark:bg-gray-900/40 p-1 mb-6">
            {TABS.map((tab, index) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${uid}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${uid}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => onTabKeyDown(e, index)}
                  className={`min-h-[44px] rounded-lg px-2 text-sm sm:text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 ${
                    selected
                      ? 'bg-white dark:bg-white/15 text-purple-700 dark:text-white shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {TABS.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${uid}-panel-${tab.id}`}
              aria-labelledby={`${uid}-tab-${tab.id}`}
              hidden={activeTab !== tab.id}
              tabIndex={0}
              className="focus:outline-none"
            >
              {tab.id === 'age' && <AgeTab onCalculated={onCalculated} />}
              {tab.id === 'difference' && <DifferenceTab onCalculated={onCalculated} />}
              {tab.id === 'add' && <AddTab onCalculated={onCalculated} />}
            </div>
          ))}
        </div>
      </div>
    </ToolWrapper>
  );
}
