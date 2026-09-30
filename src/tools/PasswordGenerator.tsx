import React, { useId, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FaLock, FaCopy, FaRedo, FaEye, FaEyeSlash } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  CharacterSetName,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  PasswordOptions,
  PasswordOptionsError,
  StrengthLevel,
  estimateStrength,
  generatePassword,
} from './lib/passwordGenerator';

const SET_OPTIONS: ReadonlyArray<{ key: CharacterSetName; label: string }> = [
  { key: 'uppercase', label: 'Uppercase (A-Z)' },
  { key: 'lowercase', label: 'Lowercase (a-z)' },
  { key: 'numbers', label: 'Numbers (0-9)' },
  { key: 'symbols', label: 'Symbols (!@#$%)' },
];

const DEFAULT_OPTIONS: PasswordOptions = {
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
};

const STRENGTH_STYLES: Record<StrengthLevel, { bar: string; text: string }> = {
  weak: { bar: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  fair: { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
  good: { bar: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  strong: { bar: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  'very-strong': { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
};

type GenerationResult = { password: string; error: string | null };

const tryGenerate = (options: PasswordOptions): GenerationResult => {
  try {
    return { password: generatePassword(options), error: null };
  } catch (err) {
    return {
      password: '',
      error: err instanceof PasswordOptionsError ? err.message : 'Your browser cannot generate secure random numbers.',
    };
  }
};

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>(DEFAULT_OPTIONS);
  const [result, setResult] = useState<GenerationResult>(() => tryGenerate(DEFAULT_OPTIONS));
  const [showPassword, setShowPassword] = useState(true);
  const track = useToolTracking('password-generator', 'Password Generator');

  const baseId = useId();
  const outputId = `${baseId}-output`;
  const lengthId = `${baseId}-length`;
  const errorId = `${baseId}-error`;

  const strength = useMemo(() => estimateStrength(options), [options]);
  const { password, error } = result;

  // Regenerate in the handler (not an effect) so each option change yields exactly one password.
  const updateOptions = (patch: Partial<PasswordOptions>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    setResult(tryGenerate(next));
  };

  const handleRegenerate = () => {
    const next = tryGenerate(options);
    setResult(next);
    if (next.password) track('generate');
  };

  const copyToClipboard = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy automatically. Select the password and copy it manually.');
    }
  };

  const strengthStyle = STRENGTH_STYLES[strength.level];

  return (
    <ToolWrapper
      toolId="password-generator"
      toolName="Secure Password Generator"
      toolDescription="Generate strong, secure passwords with customizable options. Create unbreakable passwords for ultimate security"
      toolCategory="Security"
    >
      <div className="relative max-w-2xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLock} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Password Generator</h2>
          </div>

          {/* Generated password */}
          <div className="mb-6">
            <label htmlFor={outputId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Generated Password
            </label>
            <div className="flex items-stretch gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  id={outputId}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  spellCheck={false}
                  autoComplete="off"
                  aria-describedby={error ? errorId : undefined}
                  placeholder="Select options to generate"
                  onFocus={(e) => e.currentTarget.select()}
                  className="w-full p-3 sm:p-4 pr-11 rounded-lg font-mono text-base sm:text-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={!showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <IconWrapper icon={showPassword ? FaEyeSlash : FaEye} />
                </button>
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                disabled={!password}
                aria-label="Copy password"
                title="Copy password"
                className="px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <IconWrapper icon={FaCopy} />
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                aria-label="Generate new password"
                title="Generate new password"
                className="px-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <IconWrapper icon={FaRedo} />
              </button>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-3 rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </p>
            )}
          </div>

          {/* Strength */}
          {password && (
            <div className="mb-6" aria-live="polite">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Password Strength</span>
                <span className={`text-sm font-bold ${strengthStyle.text}`}>
                  {strength.label}
                  <span className="font-normal text-gray-500 dark:text-gray-400">
                    {' '}
                    · {Math.round(strength.entropyBits)} bits
                  </span>
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2" aria-hidden="true">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${strengthStyle.bar}`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Entropy of the random generator. 80+ bits is strong against offline attacks.
              </p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-5">
            <div>
              <label htmlFor={lengthId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Password Length: <span className="font-bold text-purple-600 dark:text-purple-400">{options.length}</span>
              </label>
              <input
                id={lengthId}
                type="range"
                min={MIN_PASSWORD_LENGTH}
                max={MAX_PASSWORD_LENGTH}
                value={options.length}
                aria-valuetext={`${options.length} characters`}
                onChange={(e) => updateOptions({ length: Number(e.target.value) })}
                className="w-full h-2 rounded-lg cursor-pointer accent-purple-600 bg-gray-200 dark:bg-white/10"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1" aria-hidden="true">
                <span>{MIN_PASSWORD_LENGTH}</span>
                <span>{MAX_PASSWORD_LENGTH}</span>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Character types</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SET_OPTIONS.map(({ key, label }) => {
                  const id = `${baseId}-${key}`;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        id={id}
                        type="checkbox"
                        checked={options[key]}
                        onChange={(e) => updateOptions({ [key]: e.target.checked })}
                        className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <label htmlFor={id} className="text-gray-700 dark:text-gray-300 cursor-pointer">
                        {label}
                      </label>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3 sm:col-span-2">
                  <input
                    id={`${baseId}-ambiguous`}
                    type="checkbox"
                    checked={Boolean(options.excludeAmbiguous)}
                    onChange={(e) => updateOptions({ excludeAmbiguous: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor={`${baseId}-ambiguous`} className="text-gray-700 dark:text-gray-300 cursor-pointer">
                    Exclude look-alike characters (I, l, 1, O, 0, o, |)
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🔒 Security Tips</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Passwords are generated in your browser with the Web Crypto API and never sent anywhere</li>
              <li>• Use at least 12 characters; 16+ is better</li>
              <li>• Never reuse passwords across accounts</li>
              <li>• Store passwords in a password manager</li>
              <li>• Enable two-factor authentication when available</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
