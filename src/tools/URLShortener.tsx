import React, { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { FaLink, FaCopy, FaQrcode, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';

interface ShortLink {
  id: string;
  original: string;
  shortUrl: string;
  createdAt: number;
}

const HISTORY_KEY = 'aivello.urlShortener.history.v1';
const HISTORY_LIMIT = 20;
const MAX_URL_LENGTH = 2048;
const ALIAS_PATTERN = /^[A-Za-z0-9_]{5,30}$/;
const SHORT_URL_PATTERN = /^https:\/\/is\.gd\/[A-Za-z0-9_]+$/;

const isShortLink = (value: unknown): value is ShortLink => {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.original === 'string' &&
    /^https?:\/\//i.test(v.original) &&
    typeof v.shortUrl === 'string' &&
    SHORT_URL_PATTERN.test(v.shortUrl) &&
    typeof v.createdAt === 'number'
  );
};

/** Reads the saved history; storage can be disabled, full, or hold stale data. */
const loadHistory = (): ShortLink[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isShortLink).slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
};

const saveHistory = (links: ShortLink[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(links));
  } catch {
    // Private mode / quota exceeded: history just will not persist.
  }
};

/**
 * Light client-side check so obvious mistakes get instant feedback. The API route
 * performs the authoritative validation (including private-network hosts).
 * A missing scheme is assumed to be https.
 */
const normalizeInputUrl = (input: string): { url: string } | { error: string } => {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Please enter a URL to shorten.' };
  const withScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { error: 'That does not look like a valid URL.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: 'Only http:// and https:// links can be shortened.' };
  }
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || (!host.includes('.') && !host.startsWith('['))) {
    return { error: 'Please enter a public web address, like https://example.com/page.' };
  }
  if (url.href.length > MAX_URL_LENGTH) {
    return { error: `URLs can be at most ${MAX_URL_LENGTH.toLocaleString()} characters long.` };
  }
  return { url: url.href };
};

const newId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export default function URLShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [links, setLinks] = useState<ShortLink[]>(loadHistory);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const track = useToolTracking('url-shortener', 'URL Shortener');

  const baseId = useId();
  const urlId = `${baseId}-url`;
  const aliasId = `${baseId}-alias`;
  const aliasHelpId = `${baseId}-alias-help`;
  const errorId = `${baseId}-error`;

  useEffect(() => saveHistory(links), [links]);

  const aliasInvalid = customAlias.length > 0 && !ALIAS_PATTERN.test(customAlias);

  const shortenUrl = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setError(null);

    const normalized = normalizeInputUrl(originalUrl);
    if ('error' in normalized) {
      setError(normalized.error);
      return;
    }
    if (aliasInvalid) {
      setError('Custom aliases must be 5-30 characters: letters, numbers and underscores only.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized.url, ...(customAlias ? { alias: customAlias } : {}) }),
      });

      let data: { shortUrl?: unknown; error?: unknown } = {};
      try {
        data = (await response.json()) as typeof data;
      } catch {
        // Non-JSON (e.g. the dev server has no /api route); handled below.
      }

      if (!response.ok || typeof data.shortUrl !== 'string' || !SHORT_URL_PATTERN.test(data.shortUrl)) {
        // A 404 without a JSON error means the API route is missing (e.g. a plain
        // Vite dev server; use `vercel dev` locally to serve /api).
        setError(
          typeof data.error === 'string' ? data.error : 'Could not shorten that link right now. Please try again later.'
        );
        return;
      }

      const link: ShortLink = {
        id: newId(),
        original: normalized.url,
        shortUrl: data.shortUrl,
        createdAt: Date.now(),
      };
      setLinks((prev) => [link, ...prev.filter((l) => l.shortUrl !== link.shortUrl)].slice(0, HISTORY_LIMIT));
      setOriginalUrl('');
      setCustomAlias('');
      track('generate');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Short link copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy automatically. Select the link and copy it manually.');
    }
  };

  const deleteLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    if (showQR === id) setShowQR(null);
  };

  const inputClass =
    'w-full p-3 sm:p-4 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50';
  const iconButton =
    'p-2 rounded-lg text-gray-500 hover:text-purple-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50';

  return (
    <ToolWrapper
      toolId="url-shortener"
      toolName="URL Shortener"
      toolDescription="Shorten long URLs into short, shareable is.gd links and generate QR codes. Perfect for social media, marketing campaigns, and print"
      toolCategory="Marketing"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaLink} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">URL Shortener</h2>
          </div>

          <form className="mb-8 space-y-4" onSubmit={(e) => void shortenUrl(e)} noValidate>
            <div>
              <label htmlFor={urlId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Enter your long URL
              </label>
              <input
                id={urlId}
                type="url"
                inputMode="url"
                autoComplete="url"
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://example.com/very/long/url/here"
                maxLength={MAX_URL_LENGTH + 100}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor={aliasId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                Custom alias (optional)
              </label>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm">
                  is.gd/
                </span>
                <input
                  id={aliasId}
                  type="text"
                  value={customAlias}
                  onChange={(e) => setCustomAlias(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))}
                  placeholder="my_link"
                  maxLength={30}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={aliasInvalid}
                  aria-describedby={aliasHelpId}
                  className={`${inputClass} flex-1 min-w-0 rounded-l-none`}
                />
              </div>
              <p
                id={aliasHelpId}
                className={`text-xs mt-1 ${aliasInvalid ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                5-30 letters, numbers or underscores. Leave empty for a random short link.
              </p>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !originalUrl.trim()}
              className="w-full md:w-auto px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden="true" />
                  Shortening…
                </>
              ) : (
                <>
                  <IconWrapper icon={FaLink} />
                  Shorten URL
                </>
              )}
            </button>
          </form>

          {/* History */}
          <section aria-live="polite">
            {links.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Short Links</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setLinks([]);
                      setShowQR(null);
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Saved in this browser only. Removing a link here does not delete it from is.gd.
                </p>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="bg-gray-50 dark:bg-white/5 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <a
                            href={link.shortUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-mono font-semibold text-purple-600 dark:text-purple-400 hover:underline break-all"
                          >
                            {link.shortUrl}
                            <IconWrapper icon={FaExternalLinkAlt} className="text-xs shrink-0" />
                          </a>
                          <p className="text-sm text-gray-600 dark:text-gray-300 truncate" title={link.original}>
                            {link.original}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Created {new Date(link.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(link.shortUrl)}
                            className={iconButton}
                            aria-label={`Copy ${link.shortUrl}`}
                            title="Copy"
                          >
                            <IconWrapper icon={FaCopy} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQR(showQR === link.id ? null : link.id)}
                            className={iconButton}
                            aria-label={showQR === link.id ? 'Hide QR code' : 'Show QR code'}
                            aria-expanded={showQR === link.id}
                            title="QR code"
                          >
                            <IconWrapper icon={FaQrcode} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLink(link.id)}
                            className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            aria-label={`Remove ${link.shortUrl} from history`}
                            title="Remove from history"
                          >
                            <IconWrapper icon={FaTrash} />
                          </button>
                        </div>
                      </div>

                      {showQR === link.id && (
                        <div className="mt-4 p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex flex-col items-center">
                          <div className="bg-white p-2 rounded">
                            <QRCodeSVG value={link.shortUrl} size={150} marginSize={2} title={`QR code for ${link.shortUrl}`} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 break-all text-center">
                            QR code for {link.shortUrl}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {/* Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
              <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">🔗 Features</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Real, permanent short links powered by is.gd</li>
                <li>• Optional custom aliases</li>
                <li>• QR code for every link</li>
                <li>• History saved privately in your browser</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
              <h3 className="font-semibold text-pink-700 dark:text-pink-300 mb-2">📊 Use Cases</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Social media posts and bios</li>
                <li>• Email and SMS campaigns</li>
                <li>• Print materials with QR codes</li>
                <li>• Sharing long document or map links</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
