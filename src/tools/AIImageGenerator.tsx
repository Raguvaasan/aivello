import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaImage, FaDownload, FaPalette, FaMagic, FaSync, FaExternalLinkAlt } from 'react-icons/fa';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { IconWrapper } from '../components/common/IconWrapper';
import { useToolTracking } from '../hooks/useToolTracking';

const MAX_PROMPT = 500;
/** The free service usually answers in 5-30 s; after this we give up and offer a retry. */
const IMAGE_TIMEOUT_MS = 60000;
const DOWNLOAD_TIMEOUT_MS = 45000;

const STYLES: Record<string, { label: string; modifier: string }> = {
  realistic: { label: 'Photorealistic', modifier: 'photorealistic, highly detailed, natural lighting' },
  artistic: { label: 'Artistic', modifier: 'digital art, artistic, vibrant colors' },
  cartoon: { label: 'Cartoon / Anime', modifier: 'cartoon, anime style, clean line art' },
  abstract: { label: 'Abstract', modifier: 'abstract art' },
  vintage: { label: 'Vintage', modifier: 'vintage photograph, retro film grain' },
  cyberpunk: { label: 'Cyberpunk', modifier: 'cyberpunk, neon lights' },
  watercolor: { label: 'Watercolor', modifier: 'watercolor painting' },
  'oil-painting': { label: 'Oil Painting', modifier: 'oil painting, textured brush strokes' },
};

const SIZES: Record<string, { label: string; w: number; h: number }> = {
  '512x512': { label: 'Square (512×512)', w: 512, h: 512 },
  '768x512': { label: 'Landscape (768×512)', w: 768, h: 512 },
  '512x768': { label: 'Portrait (512×768)', w: 512, h: 768 },
  '1024x1024': { label: 'Large square (1024×1024)', w: 1024, h: 1024 },
};

const PROMPT_SUGGESTIONS = [
  'A futuristic cityscape at sunset with flying cars',
  'A magical forest with glowing mushrooms and fairy lights',
  'A cozy coffee shop in autumn with warm lighting',
  'A serene mountain lake reflecting snow-capped peaks',
  'A cyberpunk street scene with neon lights and rain',
  'A peaceful garden with blooming cherry blossoms',
];

type SlotStatus = 'pending' | 'loaded' | 'error';

interface ImageSlot {
  key: string;
  batch: number;
  url: string;
  /** Aspect ratio the image was requested with (the size picker may change afterwards). */
  w: number;
  h: number;
  status: SlotStatus;
  error?: string;
}

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
const INPUT =
  'w-full p-3 rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white ' +
  'placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500';
const ICON_BUTTON =
  'min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-2 px-3 rounded-xl text-sm font-medium transition-colors ' +
  'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/20 ' +
  'hover:bg-gray-200 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500/50';

const randomSeed = (): number => Math.floor(Math.random() * 2_000_000_000);

const buildImageUrl = (prompt: string, style: string, size: string, seed: number): string => {
  const { w, h } = SIZES[size] ?? SIZES['512x512'];
  // Slashes would be read as path separators by the service, and newlines add nothing.
  const text = `${prompt.replace(/[\s/\\]+/g, ' ').trim()}, ${STYLES[style]?.modifier ?? ''}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(text)}?width=${w}&height=${h}&seed=${seed}&nologo=true&safe=true`;
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'image';

export default function AIImageGenerator() {
  const id = useId();
  const track = useToolTracking('ai-image-generator', 'AI Image Generator');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [size, setSize] = useState('512x512');
  const [count, setCount] = useState(2);
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');

  const batchRef = useRef(0);
  const trackedBatchRef = useRef(-1);
  const objectUrlsRef = useRef(new Set<string>());
  const revokeTimersRef = useRef(new Set<number>());
  const downloadAbortRef = useRef<AbortController | null>(null);

  const ids = {
    prompt: `${id}-prompt`,
    promptError: `${id}-prompt-error`,
    promptCount: `${id}-prompt-count`,
    style: `${id}-style`,
    size: `${id}-size`,
    count: `${id}-count`,
    ideas: `${id}-ideas`,
  };

  // Images are requested one at a time: the free service rate-limits parallel requests,
  // which used to make most of the 4 images fail silently. The first pending slot is
  // the one currently loading; the rest are queued behind it.
  const activeKey = slots.find((s) => s.status === 'pending')?.key ?? null;
  const pendingCount = slots.filter((s) => s.status === 'pending').length;
  const loadedCount = slots.filter((s) => s.status === 'loaded').length;

  const updateSlot = useCallback((key: string, patch: Partial<ImageSlot>) => {
    setSlots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  }, []);

  useEffect(() => {
    if (!activeKey) return undefined;
    const timer = window.setTimeout(() => {
      updateSlot(activeKey, { status: 'error', error: 'This image took too long. The free service may be busy.' });
    }, IMAGE_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [activeKey, updateSlot]);

  // Release blob URLs and cancel an in-flight download when leaving the page.
  useEffect(() => {
    const urls = objectUrlsRef.current;
    const timers = revokeTimersRef.current;
    return () => {
      downloadAbortRef.current?.abort();
      timers.forEach((t) => window.clearTimeout(t));
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const generateImages = () => {
    const text = prompt.trim();
    if (text.length < 3) {
      setError('Describe the image you want in a few words.');
      return;
    }
    setError(null);
    batchRef.current += 1;
    const batch = batchRef.current;
    setLastPrompt(text);
    const { w, h } = SIZES[size] ?? SIZES['512x512'];
    setSlots(
      Array.from({ length: count }, (_, i) => ({
        key: `${batch}-${i}`,
        batch,
        url: buildImageUrl(text, style, size, randomSeed()),
        w,
        h,
        status: 'pending' as const,
      }))
    );
  };

  const handleLoad = (slot: ImageSlot) => {
    updateSlot(slot.key, { status: 'loaded', error: undefined });
    if (trackedBatchRef.current !== slot.batch) {
      trackedBatchRef.current = slot.batch;
      track('generate');
    }
  };

  const handleError = (slot: ImageSlot) => {
    updateSlot(slot.key, { status: 'error', error: 'This image couldn’t be generated. The free service may be busy.' });
  };

  const regenerateImage = (slot: ImageSlot) => {
    if (!lastPrompt) return;
    const { w, h } = SIZES[size] ?? SIZES['512x512'];
    updateSlot(slot.key, {
      url: buildImageUrl(lastPrompt, style, size, randomSeed()),
      w,
      h,
      status: 'pending',
      error: undefined,
    });
  };

  const downloadImage = async (slot: ImageSlot, index: number) => {
    downloadAbortRef.current?.abort();
    const controller = new AbortController();
    downloadAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
    setDownloading(slot.key);
    try {
      // A cross-origin <a download> is ignored by browsers, so fetch the bytes instead.
      const response = await fetch(slot.url, { mode: 'cors', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('Not an image');
      const ext = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : 'jpg';
      const objectUrl = URL.createObjectURL(blob);
      objectUrlsRef.current.add(objectUrl);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `aivello-${slugify(lastPrompt)}-${index + 1}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      const revoke = window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        objectUrlsRef.current.delete(objectUrl);
        revokeTimersRef.current.delete(revoke);
      }, 10000);
      revokeTimersRef.current.add(revoke);
    } catch {
      // Superseded by another download or the page was left: stay quiet.
      if (controller.signal.aborted && downloadAbortRef.current !== controller) return;
      // Fallback (CORS blocked, network error, timeout): open the image so it can be saved manually.
      // `noopener` makes window.open return null, so a blocked pop-up can't be detected; the
      // toast points to the always-visible Open button either way.
      window.open(slot.url, '_blank', 'noopener,noreferrer');
      toast('Couldn’t download directly. The image opened in a new tab (or use the Open button): right-click or long-press it and choose "Save image".', {
        duration: 6000,
      });
    } finally {
      window.clearTimeout(timeout);
      if (downloadAbortRef.current === controller) downloadAbortRef.current = null;
      setDownloading((current) => (current === slot.key ? null : current));
    }
  };

  const statusMessage =
    slots.length === 0
      ? ''
      : pendingCount > 0
        ? `Generating image ${slots.length - pendingCount + 1} of ${slots.length}…`
        : `${loadedCount} of ${slots.length} images ready.`;

  return (
    <ToolWrapper
      toolId="ai-image-generator"
      toolName="AI Image Generator"
      toolDescription="Create stunning images from text descriptions using AI. Generate art, illustrations, and creative visuals instantly"
      toolCategory="Design"
    >
      <div className="relative max-w-6xl mx-auto">
        <div className="bg-white/80 dark:bg-white/10 border border-gray-200 dark:border-white/20 shadow-lg dark:shadow-2xl rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaImage} className="text-3xl text-purple-600 dark:text-purple-400 shrink-0" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Image Generator</h2>
            <IconWrapper icon={FaMagic} className="text-2xl text-pink-600 dark:text-pink-400 shrink-0" />
          </div>

          <div className="space-y-6">
            <div>
              <label className={LABEL} htmlFor={ids.prompt}>
                Describe your image
              </label>
              <textarea
                id={ids.prompt}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value.slice(0, MAX_PROMPT));
                  if (error) setError(null);
                }}
                maxLength={MAX_PROMPT}
                placeholder="e.g. A lighthouse on a cliff during a storm, dramatic sky"
                aria-invalid={error ? true : undefined}
                aria-describedby={`${ids.promptCount}${error ? ` ${ids.promptError}` : ''}`}
                className={`${INPUT} h-24 resize-none`}
              />
              <div className="mt-1 flex justify-between gap-2">
                {error ? (
                  <p id={ids.promptError} role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : (
                  <span />
                )}
                <p id={ids.promptCount} className="text-xs text-gray-500 dark:text-gray-400">
                  {prompt.length}/{MAX_PROMPT}
                </p>
              </div>
            </div>

            <div role="group" aria-labelledby={ids.ideas}>
              <p id={ids.ideas} className={LABEL}>
                Quick ideas
              </p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setPrompt(suggestion);
                      setError(null);
                    }}
                    className="min-h-[36px] px-3 py-1.5 text-sm text-left bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={LABEL} htmlFor={ids.style}>
                  Art style
                </label>
                <select id={ids.style} value={style} onChange={(e) => setStyle(e.target.value)} className={INPUT}>
                  {Object.entries(STYLES).map(([value, s]) => (
                    <option key={value} value={value} className="bg-white dark:bg-gray-800">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor={ids.size}>
                  Image size
                </label>
                <select id={ids.size} value={size} onChange={(e) => setSize(e.target.value)} className={INPUT}>
                  {Object.entries(SIZES).map(([value, s]) => (
                    <option key={value} value={value} className="bg-white dark:bg-gray-800">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor={ids.count}>
                  Number of images
                </label>
                <select id={ids.count} value={count} onChange={(e) => setCount(Number(e.target.value))} className={INPUT}>
                  {[1, 2, 4].map((n) => (
                    <option key={n} value={n} className="bg-white dark:bg-gray-800">
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={generateImages}
                className="w-full min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {pendingCount > 0 ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" aria-hidden="true" />
                    Generating… (click to start over)
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaMagic} />
                    Generate {count > 1 ? `${count} Images` : 'Image'}
                  </>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Images are created by Pollinations.ai, a free third-party service: your prompt is sent to it. Each image
                usually takes 5–30 seconds.
              </p>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {statusMessage}
          </p>

          {slots.length > 0 && (
            <section className="mt-8" aria-label="Generated images">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated images</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{statusMessage}</p>
              </div>
              <div className={`grid grid-cols-1 gap-4 ${slots.length > 1 ? 'sm:grid-cols-2' : 'sm:max-w-md'} ${slots.length > 2 ? 'lg:grid-cols-4' : ''}`}>
                {slots.map((slot, index) => {
                  const isActive = slot.key === activeKey;
                  return (
                    <figure key={slot.key} className="flex flex-col gap-2">
                      <div
                        className="relative w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5"
                        style={{ aspectRatio: `${slot.w} / ${slot.h}` }}
                      >
                        {(slot.status === 'loaded' || isActive) && (
                          <img
                            src={slot.url}
                            alt={`Result ${index + 1} for: ${lastPrompt}`}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                              slot.status === 'loaded' ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => handleLoad(slot)}
                            onError={() => handleError(slot)}
                            decoding="async"
                          />
                        )}
                        {slot.status === 'pending' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            {isActive ? (
                              <>
                                <span className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500/30 border-t-purple-500" aria-hidden="true" />
                                Generating…
                              </>
                            ) : (
                              'Queued'
                            )}
                          </div>
                        )}
                        {slot.status === 'error' && (
                          <div
                            role="alert"
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center text-sm text-red-600 dark:text-red-400"
                          >
                            <span>{slot.error}</span>
                            <button type="button" onClick={() => regenerateImage(slot)} className={ICON_BUTTON}>
                              <IconWrapper icon={FaSync} />
                              Try again
                            </button>
                          </div>
                        )}
                      </div>
                      {slot.status === 'loaded' && (
                        <figcaption className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => downloadImage(slot, index)}
                            disabled={downloading === slot.key}
                            className={ICON_BUTTON}
                            aria-label={`Download image ${index + 1}`}
                          >
                            <IconWrapper icon={FaDownload} />
                            <span>{downloading === slot.key ? 'Saving…' : 'Download'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => regenerateImage(slot)}
                            className={ICON_BUTTON}
                            aria-label={`Regenerate image ${index + 1}`}
                            title="Regenerate"
                          >
                            <IconWrapper icon={FaSync} />
                          </button>
                          <a
                            href={slot.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={ICON_BUTTON}
                            aria-label={`Open image ${index + 1} in a new tab`}
                            title="Open in new tab"
                          >
                            <IconWrapper icon={FaExternalLinkAlt} />
                          </a>
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            </section>
          )}

          <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-white/5 dark:to-white/5 border border-purple-100 dark:border-white/10 rounded-xl">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
              <IconWrapper icon={FaPalette} />
              Tips for better results
            </h3>
            <ul className="text-sm text-purple-700 dark:text-purple-200 space-y-1 list-disc pl-5">
              <li>Be specific about details: colors, lighting, composition</li>
              <li>Mention the mood and atmosphere: &ldquo;dark and mysterious&rdquo;</li>
              <li>Specify framing: &ldquo;close-up&rdquo;, &ldquo;wide shot&rdquo;, &ldquo;full body&rdquo;</li>
              <li>Add quality modifiers: &ldquo;highly detailed&rdquo;, &ldquo;sharp focus&rdquo;</li>
            </ul>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
