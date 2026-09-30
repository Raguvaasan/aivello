/** YouTube video IDs are exactly 11 characters from the URL-safe base64 alphabet. */
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export const isValidVideoId = (id: string): boolean => VIDEO_ID_PATTERN.test(id);

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'gaming.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const SHORT_HOSTS = new Set(['youtu.be', 'www.youtu.be']);

/** Path prefixes whose next segment is the video ID, e.g. /shorts/<id>. */
const ID_PATH_PREFIXES = new Set(['embed', 'shorts', 'live', 'v', 'e']);

/**
 * Extracts the video ID from any common YouTube URL form, or from a bare 11-char ID.
 *
 * Handles watch?v=, youtu.be/, shorts/, embed/, live/, v/, the nocookie domain,
 * mobile and music subdomains, a missing scheme, and extra query params or fragments.
 * Returns null for anything that is not recognisably a YouTube video.
 */
export const extractYouTubeVideoId = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (isValidVideoId(trimmed)) return trimmed;

  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split('/').filter(Boolean);

  let candidate: string | null = null;
  if (SHORT_HOSTS.has(host)) {
    candidate = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === 'watch' || segments.length === 0) {
      candidate = url.searchParams.get('v');
    } else if (ID_PATH_PREFIXES.has(segments[0])) {
      candidate = segments[1] ?? null;
    } else if (segments[0] === 'attribution_link') {
      // /attribution_link?u=/watch?v=<id>&feature=share
      const inner = url.searchParams.get('u');
      if (inner) return extractYouTubeVideoId(`https://www.youtube.com${inner.startsWith('/') ? '' : '/'}${inner}`);
    }
  }

  return candidate && isValidVideoId(candidate) ? candidate : null;
};

export interface ThumbnailVariant {
  key: 'maxresdefault' | 'sddefault' | 'hqdefault' | 'mqdefault' | 'default';
  label: string;
  width: number;
  height: number;
}

/** Ordered from largest to smallest. Not every video has maxres or sd. */
export const THUMBNAIL_VARIANTS: readonly ThumbnailVariant[] = [
  { key: 'maxresdefault', label: 'Max Resolution', width: 1280, height: 720 },
  { key: 'sddefault', label: 'Standard Definition', width: 640, height: 480 },
  { key: 'hqdefault', label: 'High Quality', width: 480, height: 360 },
  { key: 'mqdefault', label: 'Medium Quality', width: 320, height: 180 },
  { key: 'default', label: 'Default', width: 120, height: 90 },
];

export const thumbnailUrl = (videoId: string, variant: ThumbnailVariant['key']): string =>
  `https://img.youtube.com/vi/${videoId}/${variant}.jpg`;
