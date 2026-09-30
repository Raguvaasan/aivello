import { clientIp, createRateLimiter, isAllowedOrigin, type ApiRequest, type ApiResponse } from './_lib/http';

/**
 * URL shortening proxy for is.gd.
 *
 * The browser posts `{ url, alias? }` here and never talks to is.gd directly, so the
 * client CSP stays tight and we can validate and rate limit before anything leaves
 * our infrastructure. Guards, in order:
 *   1. Method + Origin allowlist - blocks casual cross-site use.
 *   2. Per-IP rate limit          - is.gd rate limits us as a whole, so one client
 *                                   must not be able to exhaust it for everyone.
 *   3. Input validation           - http(s) only, <= 2048 chars, no credentials, no
 *                                   localhost / private-network / single-label hosts.
 */

const MAX_URL_LENGTH = 2048;
const ALIAS_PATTERN = /^[A-Za-z0-9_]{5,30}$/; // is.gd's own rule for custom short URLs
const UPSTREAM_TIMEOUT_MS = 8000;

const RATE_LIMIT_MAX = 30; // links per IP per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const checkIpRateLimit = createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);

function isPrivateIPv4(host: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const [a, b, c] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return (
    a === 0 || // "this network"
    a === 10 ||
    a === 127 || // loopback
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local (incl. cloud metadata endpoints)
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 198 && (b === 18 || b === 19)) || // benchmarking
    a >= 224 // multicast and reserved
  );
}

function isPrivateIPv6(host: string): boolean {
  const addr = host.toLowerCase();
  return (
    addr === '::' ||
    addr === '::1' ||
    /^f[cd][0-9a-f]{2}:/.test(addr) || // unique local fc00::/7
    /^fe[89ab][0-9a-f]:/.test(addr) || // link-local fe80::/10
    addr.startsWith('::ffff:') || // IPv4-mapped: could hide any IPv4 address
    addr.startsWith('64:ff9b:') // NAT64
  );
}

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.intranet', '.lan', '.home', '.corp', '.home.arpa'];

type ValidationResult = { ok: true; url: string } | { ok: false; error: string };

export function validateTargetUrl(raw: unknown): ValidationResult {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'Please provide a URL to shorten.' };
  }
  const input = raw.trim();
  if (input.length > MAX_URL_LENGTH) {
    return { ok: false, error: `URLs can be at most ${MAX_URL_LENGTH} characters long.` };
  }

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: 'That does not look like a valid URL.' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http:// and https:// links can be shortened.' };
  }
  if (url.username || url.password) {
    return { ok: false, error: 'Links containing a username or password cannot be shortened.' };
  }

  // WHATWG URL parsing already canonicalises tricks like http://2130706433 or 0x7f.1
  // to dotted IPv4, so the checks below see the real address.
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  const isIPv6 = host.startsWith('[') && host.endsWith(']');
  const bareHost = isIPv6 ? host.slice(1, -1) : host;

  if (
    !bareHost ||
    bareHost === 'localhost' ||
    BLOCKED_SUFFIXES.some((suffix) => bareHost.endsWith(suffix)) ||
    (isIPv6 ? isPrivateIPv6(bareHost) : isPrivateIPv4(bareHost)) ||
    (!isIPv6 && !bareHost.includes('.'))
  ) {
    return { ok: false, error: 'Links to local or private network addresses cannot be shortened.' };
  }

  if (url.href.length > MAX_URL_LENGTH) {
    return { ok: false, error: `URLs can be at most ${MAX_URL_LENGTH} characters long.` };
  }

  return { ok: true, url: url.href };
}

function parseBody(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === 'object' && !Array.isArray(body)) return body as Record<string, unknown>;
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

interface IsGdResponse {
  shorturl?: string;
  errorcode?: number;
  errormessage?: string;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Origin allowlist
  const origin = req.headers.origin;
  if (!isAllowedOrigin(Array.isArray(origin) ? origin[0] : origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = parseBody(req.body);
  if (!body) {
    return res.status(400).json({ error: 'Expected a JSON body like { "url": "https://..." }.' });
  }

  // 3a. Validate before spending rate-limit budget on malformed input.
  const validation = validateTargetUrl(body.url);
  if (!validation.ok) {
    return res.status(400).json({ error: validation.error });
  }

  const alias = typeof body.alias === 'string' ? body.alias.trim() : '';
  if (alias && !ALIAS_PATTERN.test(alias)) {
    return res
      .status(400)
      .json({ error: 'Custom aliases must be 5-30 characters: letters, numbers and underscores only.' });
  }

  // 2. Per-IP rate limit
  const { allowed, retryAfterSec } = checkIpRateLimit(clientIp(req));
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `You can shorten up to ${RATE_LIMIT_MAX} links per hour. Please try again later.`,
    });
  }

  const params = new URLSearchParams({ format: 'json', url: validation.url });
  if (alias) params.set('shorturl', alias);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstream = await fetch(`https://is.gd/create.php?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    let data: IsGdResponse = {};
    try {
      data = (await upstream.json()) as IsGdResponse;
    } catch {
      // Non-JSON body (maintenance page, proxy error); handled below by status.
    }

    if (typeof data.shorturl === 'string' && /^https:\/\/is\.gd\/[A-Za-z0-9_]+$/.test(data.shorturl)) {
      return res.status(200).json({ shortUrl: data.shorturl });
    }

    // is.gd error codes: 1 bad long URL, 2 bad/taken alias, 3 rate limited, 4 other.
    switch (data.errorcode) {
      case 1:
        return res.status(400).json({ error: data.errormessage || 'is.gd rejected this URL.' });
      case 2:
        return res.status(409).json({ error: data.errormessage || 'That alias is unavailable. Try another.' });
      case 3:
        res.setHeader('Retry-After', '60');
        return res.status(429).json({ error: 'The shortening service is busy. Please try again in a minute.' });
      default:
        console.error('is.gd unexpected response', upstream.status, data.errorcode);
        return res.status(502).json({ error: 'The shortening service is unavailable right now. Please try again later.' });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({ error: 'The shortening service took too long to respond. Please try again.' });
    }
    console.error('shorten proxy error:', error);
    return res.status(502).json({ error: 'The shortening service is unavailable right now. Please try again later.' });
  } finally {
    clearTimeout(timeout);
  }
}
