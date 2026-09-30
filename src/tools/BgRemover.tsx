import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaDownload, FaTrash, FaSpinner, FaMagic, FaImage, FaLock } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';
import ApiService from '../services/apiService';
import { MAX_UPLOAD_SIZE } from '../constants/limits';
import { useAuth } from '../context/AuthContext';
import { useToolTracking } from '../hooks/useToolTracking';
import {
  ACCEPT_ATTRIBUTE,
  getErrorDetails,
  isAuthError,
  resultFileName,
  validateImageFile,
} from './lib/bgRemover';

type Quality = 'regular' | 'hd';

const cardClass = 'rounded-2xl bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-sm';
const selectClass =
  'w-full px-3 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50';

/** Checkerboard behind the result so transparent areas are visible in either theme. */
const CHECKERBOARD: React.CSSProperties = {
  backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, #f9fafb 0% 50%)',
  backgroundSize: '20px 20px',
};

const MAX_MB = Math.round(MAX_UPLOAD_SIZE / (1024 * 1024));

export default function BgRemover() {
  const { user, loading: authLoading, ensureAuth } = useAuth();
  const location = useLocation();
  const track = useToolTracking('bg-remover', 'AI Background Remover');
  const inputId = useId();
  const qualityId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [quality, setQuality] = useState<Quality>('regular');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // This tool needs an account (it spends a paid API quota), so it is one of the few
  // places that starts the auth SDK for a visitor without a remembered session.
  useEffect(() => {
    ensureAuth();
  }, [ensureAuth]);
  /** Incremented to discard the result of a request the user has moved on from. */
  const requestId = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestId.current += 1;
    };
  }, []);

  // Each object URL is revoked when it is replaced and when the tool unmounts.
  useEffect(() => () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
  }, [originalUrl]);
  useEffect(() => () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  }, [resultUrl]);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const selectFile = useCallback((next: File) => {
    const problem = validateImageFile(next);
    if (problem) {
      setError(problem);
      clearFileInput();
      return;
    }
    requestId.current += 1;
    setError('');
    setSessionExpired(false);
    setLoading(false);
    setFile(next);
    setOriginalUrl(URL.createObjectURL(next));
    setResultUrl(null);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (next) selectFile(next);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (loading) return;
    const next = event.dataTransfer.files?.[0];
    if (next) selectFile(next);
  };

  const removeBackground = async () => {
    if (!file || loading) return;
    if (!user) {
      setSessionExpired(true);
      return;
    }

    requestId.current += 1;
    const id = requestId.current;
    setLoading(true);
    setError('');
    setSessionExpired(false);
    setResultUrl(null);

    try {
      // The File goes straight into the upload: no data-URL round trip, which the
      // CSP's connect-src would block anyway.
      const blob = await ApiService.removeBg(file, quality === 'hd' ? 'full' : 'regular');
      if (!mounted.current || id !== requestId.current) return;

      if (!(blob instanceof Blob) || blob.size === 0 || !blob.type.startsWith('image/')) {
        throw new Error('The service returned an unexpected response. Please try again.');
      }
      setResultUrl(URL.createObjectURL(blob));
      track('convert');
    } catch (err) {
      if (!mounted.current || id !== requestId.current) return;
      const details = getErrorDetails(err);
      if (isAuthError(details)) {
        setSessionExpired(true);
        setError(details.message || 'Please sign in again to continue.');
      } else {
        setError(details.message || 'Failed to remove the background. Please try again.');
      }
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  };

  const resetTool = () => {
    requestId.current += 1;
    setFile(null);
    setOriginalUrl(null);
    setResultUrl(null);
    setError('');
    setSessionExpired(false);
    setLoading(false);
    clearFileInput();
  };

  const signInLink = (
    <Link
      to="/login"
      state={{ from: location }}
      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
    >
      Sign in
    </Link>
  );

  const renderUploader = () => (
    <div className={`${cardClass} p-4 sm:p-6`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Upload image</h3>

      <div
        className="mb-4"
        onDragOver={(e) => {
          e.preventDefault();
          if (!loading) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          onChange={handleInputChange}
          disabled={loading}
          className="sr-only peer"
        />
        <label
          htmlFor={inputId}
          className={`flex flex-col items-center justify-center gap-2 w-full px-4 py-8 rounded-xl border-2 border-dashed text-center transition-colors
            peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500/50
            ${loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            ${
              dragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                : 'border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
        >
          <IconWrapper icon={FaImage} className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600">
            {file ? 'Choose a different image' : 'Choose an image'}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300">or drag and drop it here</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">JPEG, PNG or WebP, up to {MAX_MB}MB</span>
        </label>
      </div>

      <div className="max-w-xs">
        <label htmlFor={qualityId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Quality
        </label>
        <select
          id={qualityId}
          value={quality}
          onChange={(e) => setQuality(e.target.value === 'hd' ? 'hd' : 'regular')}
          disabled={loading}
          className={selectClass}
        >
          <option value="regular" className="bg-white dark:bg-gray-800">
            Regular (fast)
          </option>
          <option value="hd" className="bg-white dark:bg-gray-800">
            High definition
          </option>
        </select>
      </div>
    </div>
  );

  return (
    <ToolWrapper
      toolId="bg-remover"
      toolName="AI Background Remover"
      toolDescription="Remove backgrounds from images instantly using AI technology"
      toolCategory="Image Tools"
    >
      <div className="relative max-w-5xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Background Remover</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Remove backgrounds from images instantly using AI technology
          </p>
        </div>

        {authLoading ? (
          <div className={`${cardClass} p-6 flex items-center justify-center gap-3 text-gray-600 dark:text-gray-300`} aria-live="polite">
            <IconWrapper icon={FaSpinner} className="animate-spin text-purple-600 dark:text-purple-400" />
            Checking your session…
          </div>
        ) : !user ? (
          <div className={`${cardClass} p-6 sm:p-8 text-center`}>
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              <IconWrapper icon={FaLock} className="text-xl" />
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Sign in to use Background Remover
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
              It uses a paid API, so it is available to signed-in users. Signing in is free and takes a few
              seconds with Google or GitHub.
            </p>
            {signInLink}
          </div>
        ) : (
          renderUploader()
        )}

        {(error || sessionExpired) && (
          <div
            role="alert"
            className="p-4 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between"
          >
            <p>{error || 'Please sign in to remove backgrounds.'}</p>
            {sessionExpired && <div className="shrink-0">{signInLink}</div>}
          </div>
        )}

        {/* Images */}
        {originalUrl && user && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`${cardClass} p-4`}>
              <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Original</h4>
              <div className="flex items-center justify-center min-h-[200px] rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                <img
                  src={originalUrl}
                  alt={file ? `Original: ${file.name}` : 'Original upload'}
                  className="w-full h-auto max-h-72 object-contain"
                />
              </div>
            </div>

            <div className={`${cardClass} p-4`}>
              <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Background removed</h4>
              <div
                aria-live="polite"
                aria-busy={loading}
                className="relative min-h-[200px] flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-white/20 overflow-hidden"
                style={resultUrl ? CHECKERBOARD : undefined}
              >
                {loading ? (
                  <div className="text-center">
                    <IconWrapper icon={FaSpinner} className="h-8 w-8 mx-auto text-purple-600 dark:text-purple-400 animate-spin mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300">Removing background…</p>
                  </div>
                ) : resultUrl ? (
                  <img src={resultUrl} alt={file ? `${file.name} with the background removed` : 'Result with the background removed'} className="w-full h-auto max-h-72 object-contain" />
                ) : (
                  <p className="px-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    The result will appear here
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {originalUrl && user && (
          <div className="flex flex-wrap gap-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={removeBackground}
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
            >
              <IconWrapper icon={loading ? FaSpinner : FaMagic} className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Processing…' : resultUrl ? 'Run again' : 'Remove background'}
            </motion.button>

            {resultUrl && !loading && file && (
              <a
                href={resultUrl}
                download={resultFileName(file.name)}
                className="inline-flex items-center px-6 py-2.5 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
              >
                <IconWrapper icon={FaDownload} className="h-4 w-4 mr-2" />
                Download PNG
              </a>
            )}

            <button
              type="button"
              onClick={resetTool}
              className="inline-flex items-center px-6 py-2.5 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
            >
              <IconWrapper icon={FaTrash} className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>
        )}

        {/* Usage info */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <h4 className="text-base font-medium text-purple-700 dark:text-purple-300 mb-2">How to use</h4>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
            <li>Upload a JPEG, PNG or WebP image (up to {MAX_MB}MB) with a clear subject.</li>
            <li>Pick a quality - high definition takes a little longer.</li>
            <li>Click “Remove background”.</li>
            <li>Download the result as a PNG with a transparent background.</li>
          </ul>
        </div>
      </div>
    </ToolWrapper>
  );
}
