import React, { useId, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import type { IconType } from 'react-icons';
import {
  FaBolt,
  FaCalculator,
  FaClock,
  FaCopy,
  FaDatabase,
  FaExchangeAlt,
  FaFlask,
  FaRuler,
  FaTachometerAlt,
  FaThermometerHalf,
  FaVectorSquare,
  FaWeight,
} from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  CATEGORIES,
  CATEGORY_IDS,
  CategoryId,
  convert,
  formatResult,
  parseNumericInput,
  temperatureInKelvin,
} from './lib/unitConverter';

const CATEGORY_ICONS: Record<CategoryId, IconType> = {
  length: FaRuler,
  weight: FaWeight,
  temperature: FaThermometerHalf,
  volume: FaFlask,
  area: FaVectorSquare,
  time: FaClock,
  speed: FaTachometerAlt,
  energy: FaBolt,
  data: FaDatabase,
};

type Side = 'from' | 'to';

const firstTwoUnits = (category: CategoryId): [string, string] => {
  const keys = Object.keys(CATEGORIES[category].units);
  return [keys[0], keys[1] ?? keys[0]];
};

export default function UnitConverter() {
  const [category, setCategory] = useState<CategoryId>('length');
  const [fromUnit, setFromUnit] = useState(() => firstTwoUnits('length')[0]);
  const [toUnit, setToUnit] = useState(() => firstTwoUnits('length')[1]);
  /** Raw text of whichever field the user last typed in; the other field is derived. */
  const [input, setInput] = useState('');
  const [activeSide, setActiveSide] = useState<Side>('from');

  const track = useToolTracking('unit-converter', 'Unit Converter');
  const trackedRef = useRef(false);

  const baseId = useId();
  const fromUnitId = `${baseId}-from-unit`;
  const toUnitId = `${baseId}-to-unit`;
  const fromValueId = `${baseId}-from-value`;
  const toValueId = `${baseId}-to-value`;
  const messageId = `${baseId}-message`;

  const units = CATEGORIES[category].units;
  const parsed = useMemo(() => parseNumericInput(input), [input]);
  const invalid = input.trim() !== '' && parsed === null;

  // Value expressed in the "from" unit, whichever side was typed in.
  const fromNumber = useMemo(() => {
    if (parsed === null) return null;
    return activeSide === 'from' ? parsed : convert(parsed, category, toUnit, fromUnit);
  }, [parsed, activeSide, category, fromUnit, toUnit]);

  const toNumber = useMemo(
    () => (fromNumber === null ? null : convert(fromNumber, category, fromUnit, toUnit)),
    [fromNumber, category, fromUnit, toUnit]
  );

  const fromDisplay = activeSide === 'from' ? input : fromNumber === null ? '' : formatResult(fromNumber);
  const toDisplay = activeSide === 'to' ? input : toNumber === null ? '' : formatResult(toNumber);

  const belowAbsoluteZero =
    category === 'temperature' && fromNumber !== null && temperatureInKelvin(fromNumber, fromUnit) < -1e-9;

  const handleInput = (side: Side, value: string) => {
    setActiveSide(side);
    setInput(value);
    if (!trackedRef.current && parseNumericInput(value) !== null) {
      trackedRef.current = true;
      track('convert');
    }
  };

  const changeCategory = (next: CategoryId) => {
    if (next === category) return;
    const [a, b] = firstTwoUnits(next);
    setCategory(next);
    setFromUnit(a);
    setToUnit(b);
    setInput('');
    setActiveSide('from');
  };

  // Swapping units and the active side keeps each number attached to its unit, with no rounding.
  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setActiveSide((s) => (s === 'from' ? 'to' : 'from'));
  };

  const copyResult = async () => {
    if (fromNumber === null || toNumber === null) return;
    const line = `${fromDisplay} ${units[fromUnit].symbol} = ${toDisplay} ${units[toUnit].symbol}`;
    try {
      await navigator.clipboard.writeText(line);
      toast.success('Conversion copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  const labelClass = 'block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2';
  const fieldClass =
    'w-full p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
  const unitOptions = Object.entries(units).map(([key, unit]) => (
    <option key={key} value={key} className="bg-white dark:bg-gray-800">
      {unit.name} ({unit.symbol})
    </option>
  ));

  return (
    <ToolWrapper
      toolId="unit-converter"
      toolName="Unit Converter"
      toolDescription="Convert between different units of measurement. Length, weight, temperature, volume, area, time, speed, energy and data conversions"
      toolCategory="Utility"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaCalculator} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Unit Converter</h2>
          </div>

          {/* Category */}
          <fieldset className="mb-6">
            <legend className={labelClass}>Category</legend>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {CATEGORY_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeCategory(id)}
                  aria-pressed={category === id}
                  className={`p-2 sm:p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
                    category === id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                      : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-400'
                  }`}
                >
                  <IconWrapper icon={CATEGORY_ICONS[id]} className="text-lg mx-auto mb-1" />
                  <span className="block text-xs font-medium">{CATEGORIES[id].name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Converter */}
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
            <div className="space-y-3 min-w-0">
              <div>
                <label htmlFor={fromUnitId} className={labelClass}>
                  From
                </label>
                <select id={fromUnitId} value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={fieldClass}>
                  {unitOptions}
                </select>
              </div>
              <div>
                <label htmlFor={fromValueId} className="sr-only">
                  Value in {units[fromUnit].name}
                </label>
                <input
                  id={fromValueId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={fromDisplay}
                  onChange={(e) => handleInput('from', e.target.value)}
                  placeholder="Enter value..."
                  aria-invalid={invalid && activeSide === 'from'}
                  aria-describedby={messageId}
                  className={`${fieldClass} text-lg p-4`}
                />
              </div>
            </div>

            <div className="flex lg:flex-col items-center justify-center gap-3 lg:pb-2">
              <button
                type="button"
                onClick={swapUnits}
                aria-label="Swap units"
                title="Swap units"
                className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <IconWrapper icon={FaExchangeAlt} className="text-xl rotate-90 lg:rotate-0" />
              </button>
              <button
                type="button"
                onClick={() => setInput('')}
                disabled={!input}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <div className="space-y-3 min-w-0">
              <div>
                <label htmlFor={toUnitId} className={labelClass}>
                  To
                </label>
                <select id={toUnitId} value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={fieldClass}>
                  {unitOptions}
                </select>
              </div>
              <div>
                <label htmlFor={toValueId} className="sr-only">
                  Value in {units[toUnit].name}
                </label>
                <input
                  id={toValueId}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={toDisplay}
                  onChange={(e) => handleInput('to', e.target.value)}
                  placeholder="Result..."
                  aria-invalid={invalid && activeSide === 'to'}
                  aria-describedby={messageId}
                  className={`${fieldClass} text-lg p-4 bg-gray-50 dark:bg-gray-800/60`}
                />
              </div>
            </div>
          </div>

          <div id={messageId} className="mt-3 min-h-[1.5rem]" aria-live="polite">
            {invalid ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                Enter a number, like 12, -3.5 or 1.2e6.
              </p>
            ) : belowAbsoluteZero ? (
              <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
                That is below absolute zero (0 K), which is not physically possible.
              </p>
            ) : fromNumber !== null && toNumber !== null ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-gray-600 dark:text-gray-300 break-all">
                  <strong className="text-gray-900 dark:text-white">
                    {fromDisplay} {units[fromUnit].symbol}
                  </strong>{' '}
                  ={' '}
                  <strong className="text-purple-600 dark:text-purple-400">
                    {toDisplay} {units[toUnit].symbol}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => void copyResult()}
                  aria-label="Copy conversion"
                  title="Copy conversion"
                  className="p-1.5 rounded text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  <IconWrapper icon={FaCopy} />
                </button>
              </div>
            ) : null}
          </div>

          {/* All units */}
          {fromNumber !== null && !belowAbsoluteZero && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {fromDisplay} {units[fromUnit].symbol} in every {CATEGORIES[category].name.toLowerCase()} unit
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(units)
                  .filter(([key]) => key !== fromUnit)
                  .map(([key, unit]) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setToUnit(key)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          key === toUnit
                            ? 'bg-purple-100 border-purple-300 dark:bg-purple-500/20 dark:border-purple-400/40'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-400'
                        }`}
                      >
                        <span className="block font-mono text-gray-900 dark:text-white break-all">
                          {formatResult(convert(fromNumber, category, fromUnit, key))}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {unit.name} ({unit.symbol})
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🔄 About these conversions</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Uses exact defined factors (international yard and pound, US customary volume, IT BTU).</li>
              <li>• Temperature is converted through Kelvin, so offsets like °C ↔ °F are handled correctly.</li>
              <li>• Months and years are averages of the Gregorian calendar (365.2425 days per year).</li>
              <li>• Data: kB/MB/GB are powers of 1000; KiB/MiB/GiB are powers of 1024.</li>
              <li>• Type in either field; the swap button keeps each value with its unit.</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
