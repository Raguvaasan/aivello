import React, { useState, useCallback } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaLock, FaCopy, FaRedo, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [showPassword, setShowPassword] = useState(true);
  const [strength, setStrength] = useState(0);

  const generatePassword = useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = '';
    if (includeUppercase) charset += uppercase;
    if (includeLowercase) charset += lowercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (charset === '') {
      alert('Please select at least one character type');
      return;
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(result);
    calculateStrength(result);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const calculateStrength = (pwd: string) => {
    let score = 0;
    
    // Length bonus
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    
    // Character variety
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    setStrength(Math.min(score, 5));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    alert('Password copied to clipboard!');
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  React.useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  return (
    <ToolWrapper
      toolId="password-generator"
      toolName="Secure Password Generator"
      toolDescription="Generate strong, secure passwords with customizable options. Create unbreakable passwords for ultimate security"
      toolCategory="Security"
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLock} className="text-3xl text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Password Generator
            </h2>
          </div>

          {/* Generated Password Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generated Password
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  readOnly
                  className="w-full p-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Click generate to create password"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <IconWrapper icon={showPassword ? FaEyeSlash : FaEye} />
                </button>
              </div>
              <button
                onClick={copyToClipboard}
                disabled={!password}
                className="px-4 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IconWrapper icon={FaCopy} />
              </button>
              <button
                onClick={generatePassword}
                className="px-4 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IconWrapper icon={FaRedo} />
              </button>
            </div>
          </div>

          {/* Password Strength */}
          {password && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Strength
                </span>
                <span className={`text-sm font-bold ${
                  strength <= 2 ? 'text-red-600' : 
                  strength <= 3 ? 'text-yellow-600' : 
                  strength <= 4 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${(strength / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password Length: {length}
              </label>
              <input
                type="range"
                min="4"
                max="100"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>4</span>
                <span>100</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeUppercase}
                  onChange={(e) => setIncludeUppercase(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Uppercase (A-Z)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLowercase}
                  onChange={(e) => setIncludeLowercase(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Lowercase (a-z)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNumbers}
                  onChange={(e) => setIncludeNumbers(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Numbers (0-9)</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Symbols (!@#$%)</span>
              </label>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">🔒 Security Tips:</h3>
            <ul className="text-sm text-green-700 dark:text-green-200 space-y-1">
              <li>• Use passwords that are at least 12 characters long</li>
              <li>• Include a mix of uppercase, lowercase, numbers, and symbols</li>
              <li>• Never reuse passwords across multiple accounts</li>
              <li>• Consider using a password manager to store passwords securely</li>
              <li>• Enable two-factor authentication when available</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
