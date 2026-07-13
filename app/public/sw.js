/**
 * Say Again? — service worker.
 *
 * Hand-written, zero dependencies. Strategy:
 *  - install: precache the minimal app shell, then skipWaiting so the new
 *    worker takes over immediately.
 *  - activate: delete caches from older versions, then clients.claim().
 *  - fetch: cache-first for same-origin GET requests; anything fetched from
 *    the network gets stored for offline use. Navigations fall back to the
 *    cached shell ('/index.html') when both cache and network miss.
 *
 * To invalidate everything cached by a previous deploy, bump CACHE_VERSION.
 */

const CACHE_VERSION = 1;
const CACHE_NAME = `kyaee-v${CACHE_VERSION}`;

const SHELL_URLS = ['/', '/index.html', '/icon-1024.png', '/manifest.webmanifest'];

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(SHELL_URLS);
  // Best effort: also precache the built bundles referenced by the shell
  // (/assets/index-*.js|css) so the app works offline after the very first
  // visit, not just after a second one. Failures never block install —
  // runtime caching still covers anything missed.
  try {
    const shell = await cache.match('/index.html');
    const html = shell ? await shell.text() : '';
    const assets = [...new Set(html.match(/\/assets\/[\w.-]+/g) ?? [])];
    if (assets.length) await cache.addAll(assets);
  } catch {
    /* dev-like markup or transient fetch failure — ignore */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('kyaee-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle same-origin GETs; leave everything else to the browser.
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // ignoreVary: precached entries (fetched without an Origin header) must
  // still satisfy crossorigin <script>/<link> requests when the server sends
  // `Vary: Origin` on assets.
  const cachePut = (response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      caches
        .open(CACHE_NAME)
        .then((cache) => cache.put(request, copy))
        .catch(() => {
          /* storage full or unavailable — serving still works */
        });
    }
    return response;
  };

  // Navigations (and the shell itself) go NETWORK-FIRST so a new deploy
  // reaches returning users without a manual cache bump; hashed /assets/*
  // stay cache-first below.
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(request)
        .then(cachePut)
        .catch(() =>
          caches.match(request, { ignoreVary: true }).then(
            (cached) => cached ?? caches.match('/index.html', { ignoreVary: true }).then((shell) => {
              if (shell) return shell;
              throw new Error('offline with empty cache');
            }),
          ),
        ),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((cached) => {
      if (cached) return cached;
      return fetch(request).then(cachePut);
    }),
  );
});
