import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaDownload, FaYoutube, FaCopy } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { useToolTracking } from '../hooks/useToolTracking';
import { THUMBNAIL_VARIANTS, ThumbnailVariant, extractYouTubeVideoId, thumbnailUrl } from './lib/youtubeThumbnail';

type VariantKey = ThumbnailVariant['key'];
type LoadState = 'loading' | 'ok' | 'missing';

const initialStates = (): Record<VariantKey, LoadState> =>
  Object.fromEntries(THUMBNAIL_VARIANTS.map((v) => [v.key, 'loading'])) as Record<VariantKey, LoadState>;

/** YouTube answers a missing size with a 120x90 grey placeholder instead of an error. */
const PLACEHOLDER_WIDTH = 120;

export default function YoutubeThumbnail() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [states, setStates] = useState<Record<VariantKey, LoadState>>(initialStates);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<VariantKey | null>(null);
  const track = useToolTracking('youtube-thumbnail', 'YouTube Thumbnail Downloader');

  const baseId = useId();
  const inputId = `${baseId}-url`;
  const errorId = `${baseId}-error`;
  const lastUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = videoUrl.trim();
    if (!trimmed) {
      setError('Please enter a YouTube URL or video ID.');
      return;
    }
    const id = extractYouTubeVideoId(trimmed);
    if (!id) {
      setError(
        'That is not a recognised YouTube link. Paste a watch, youtu.be, Shorts, embed or live URL, or an 11-character video ID.'
      );
      return;
    }
    setError('');
    if (id !== videoId) {
      setStates(initialStates());
      setVideoId(id);
    }
    track('generate');
  };

  const markState = (key: VariantKey, state: LoadState) => setStates((prev) => ({ ...prev, [key]: state }));

  const handleLoad = (key: VariantKey, img: HTMLImageElement) => {
    const isPlaceholder = key !== 'default' && img.naturalWidth <= PLACEHOLDER_WIDTH;
    markState(key, isPlaceholder ? 'missing' : 'ok');
  };

  const downloadThumbnail = async (key: VariantKey) => {
    if (!videoId) return;
    const url = thumbnailUrl(videoId, key);
    setDownloading(key);
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      const objectUrl = URL.createObjectURL(blob);
      lastUrlRef.current = objectUrl;

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `youtube-${videoId}-${key}.jpg`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      track('download');
    } catch {
      // Cross-origin fetch blocked (CORS/CSP/network): open the image so it can be saved manually.
      // (window.open with noopener always returns null, so there is no success signal to check.)
      window.open(url, '_blank', 'noopener,noreferrer');
      toast('Direct download is unavailable, so the image was opened in a new tab. Right-click it and choose “Save image as…”.');
    } finally {
      setDownloading(null);
    }
  };

  const copyImageUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image URL copied to clipboard');
      track('copy');
    } catch {
      toast.error('Could not copy automatically. Right-click the image to copy its address.');
    }
  };

  // hqdefault exists for every real video; if even it is a placeholder, the ID is wrong or the video is gone.
  const videoMissing = videoId !== null && states.hqdefault === 'missing';
  const visibleVariants = videoMissing ? [] : THUMBNAIL_VARIANTS.filter((v) => states[v.key] !== 'missing');
  const stillLoading = THUMBNAIL_VARIANTS.some((v) => states[v.key] === 'loading');

  return (
    <ToolWrapper
      toolId="youtube-thumbnail"
      toolName="YouTube Thumbnail Downloader"
      toolDescription="Download YouTube video thumbnails in multiple resolutions. Extract high-quality thumbnails from any YouTube video"
      toolCategory="Media"
    >
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 shadow-lg rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaYoutube} className="text-3xl text-red-600 dark:text-red-500 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">YouTube Thumbnail Downloader</h2>
          </div>

          <form className="mb-6" onSubmit={handleSubmit} noValidate>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              YouTube URL or Video ID
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id={inputId}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (error) setError('');
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="flex-1 min-w-0 p-3 rounded-lg bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
              >
                Get Thumbnails
              </button>
            </div>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="mt-3 p-3 rounded-lg text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300"
              >
                {error}
              </p>
            )}
          </form>

          <section aria-live="polite">
            {videoMissing && (
              <p
                role="alert"
                className="p-3 rounded-lg text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-200"
              >
                No thumbnails found. The video may not exist, may be private, or the ID may be mistyped.
              </p>
            )}

            {videoId && !videoMissing && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {stillLoading ? 'Loading thumbnails…' : `Available Thumbnails (${visibleVariants.length})`}
                </h3>
                <ul className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleVariants.map((variant) => {
                    const url = thumbnailUrl(videoId, variant.key);
                    const loaded = states[variant.key] === 'ok';
                    return (
                      <li
                        key={`${videoId}-${variant.key}`}
                        className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-4 min-w-0"
                      >
                        <div className="aspect-video mb-3 rounded-lg overflow-hidden bg-gray-200 dark:bg-white/10">
                          <img
                            src={url}
                            alt={`${variant.label} thumbnail (${variant.width}×${variant.height})`}
                            className="w-full h-full object-cover"
                            onLoad={(e) => handleLoad(variant.key, e.currentTarget)}
                            onError={() => markState(variant.key, 'missing')}
                          />
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{variant.label}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {variant.width}×{variant.height}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void downloadThumbnail(variant.key)}
                            disabled={!loaded || downloading !== null}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <IconWrapper icon={FaDownload} className="text-xs" />
                            {downloading === variant.key ? 'Downloading…' : 'Download'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copyImageUrl(url)}
                            aria-label={`Copy ${variant.label} image URL`}
                            title="Copy image URL"
                            className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/20 transition-colors"
                          >
                            <IconWrapper icon={FaCopy} className="text-xs" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>

          <div className="mt-8 p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
            <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-2">💡 How to use</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Paste any YouTube link: watch, youtu.be, Shorts, embed or live, or just the 11-character ID</li>
              <li>• Sizes a video does not have (often Max Resolution) are hidden automatically</li>
              <li>• Download the image or copy its URL</li>
              <li>• Respect the creator&apos;s copyright when reusing thumbnails</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
