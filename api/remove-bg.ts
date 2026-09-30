import { clientIp, createRateLimiter, isAllowedOrigin, type ApiRequest, type ApiResponse } from './_lib/http';

/**
 * Authenticated proxy for the remove.bg API.
 *
 * The remove.bg key is paid per call, so this route must never be callable by an
 * anonymous client. Three layers guard it:
 *   1. Origin allowlist  - blocks casual cross-site use.
 *   2. Firebase ID token  - the caller must be a signed-in Aivello user.
 *   3. Per-user rate limit - caps the damage a single compromised account can do.
 */

// Vercel's Node runtime rejects request bodies over ~4.5MB before this handler
// ever runs, so cap below that and let the client fail fast with a clear message.
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

const RATE_LIMIT_MAX = 20; // requests per user per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Per-user limit, plus a looser per-IP limit so one client cannot rotate accounts. */
const checkUserRateLimit = createRateLimiter(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
const checkIpRateLimit = createRateLimiter(RATE_LIMIT_MAX * 3, RATE_LIMIT_WINDOW_MS);

/**
 * Verifies a Firebase ID token via the Identity Toolkit REST API.
 *
 * This avoids pulling in firebase-admin (and provisioning a service account) for a
 * single route. The API key is project-scoped, so a token minted for a different
 * Firebase project is rejected. Returns the uid, or null if the token is invalid.
 */
async function verifyFirebaseIdToken(idToken: string): Promise<string | null> {
  const apiKey = process.env.FIREBASE_API_KEY || process.env.REACT_APP_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) return null;

    const data = (await response.json()) as { users?: Array<{ localId?: string }> };
    return data.users?.[0]?.localId ?? null;
  } catch {
    return null;
  }
}

/** Reads the raw request body, aborting as soon as the cap is exceeded. */
async function readBodyWithLimit(req: ApiRequest, limit: number): Promise<Buffer | null> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > limit) return null;
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

// Take the raw stream: the body is multipart/form-data that we forward verbatim,
// and disabling the parser lets us enforce our own size limit while streaming.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Origin allowlist
  if (!isAllowedOrigin(req.headers.origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    // Configuration problem, not a caller problem. Stay vague to the client and
    // make it findable in the function logs.
    console.error('REMOVE_BG_API_KEY is not configured');
    return res.status(500).json({ error: 'Service configuration error' });
  }

  // 2. Require a valid Firebase ID token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in to use this tool.' });
  }

  const ipLimit = checkIpRateLimit(clientIp(req));
  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  const uid = await verifyFirebaseIdToken(authHeader.slice('Bearer '.length));
  if (!uid) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  // 3. Per-user rate limit
  const { allowed, retryAfterSec } = checkUserRateLimit(uid);
  if (!allowed) {
    res.setHeader('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      error: `Rate limit reached. You can remove up to ${RATE_LIMIT_MAX} backgrounds per hour. Try again later.`,
    });
  }

  try {
    const body = await readBodyWithLimit(req, MAX_FILE_SIZE);
    if (body === null) {
      return res.status(413).json({ error: 'Image too large. Maximum size is 4MB.' });
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(415).json({ error: 'Expected an image upload.' });
    }

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': contentType,
      },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(25_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Background removal failed';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.errors?.[0]?.title || errorMessage;
      } catch {
        // Non-JSON error body; keep the generic message.
      }
      // Never forward remove.bg's 401/403 (our key) as if the *user* were unauthorised.
      const status = response.status === 401 || response.status === 403 ? 502 : response.status;
      return res.status(status).json({ error: errorMessage });
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(Buffer.from(imageBuffer));
  } catch (error) {
    console.error('remove-bg proxy error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
