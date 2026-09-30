// Aivello service worker.
//
// CACHE_NAME is stamped at build time by scripts/stamp-sw-version.js so a deploy can
// never serve cached HTML that references hashed chunks which no longer exist. Do not
// edit the placeholder by hand.
const CACHE_NAME = 'aivello-__BUILD_ID__';
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

const putInCache = (request, response) => {
  if (!response || !response.ok || response.type === 'opaque') return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only same-origin traffic. Third-party APIs, analytics and ads are never cached.
  if (url.origin !== self.location.origin) return;
  // API responses are per-user / per-request and must never be served from cache.
  if (url.pathname.startsWith('/api/')) return;

  // Vite's content-hashed build output: immutable, so cache-first is always correct.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        putInCache(request, response);
        return response;
      }))
    );
    return;
  }

  // Page navigations: network-first so a new deploy is picked up immediately, with
  // the cached app shell as the offline fallback (the router handles the URL).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putInCache('/', response);
          return response;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Everything else (icons, manifest, pdf worker): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          putInCache(request, response);
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
