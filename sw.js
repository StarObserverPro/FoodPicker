const PREFIX = 'meal-picker-';
const CACHE = `${PREFIX}v43`;
const CORE = [
  '/typing.js?v=39', '/meal-parameters.js?v=38', '/', '/styles.css?v=43', '/literary-intro.css?v=38', '/landing-hotpot.css?v=38',
  '/food-data.js?v=38', '/food-policy.js?v=38', '/personality-engine.js?v=38', '/qr-code.js?v=38',
  '/persona-art.js?v=38', '/psychic-app.js?v=43', '/literary-quotes-v5.js?v=38', '/literary-intro.js?v=38', '/wake-intro.css?v=43', '/wake-intro.js?v=43',
  '/chat.css?v=38', '/chat', '/chat.mjs?v=43', '/play-chat.css?v=42', '/play/openers.mjs?v=38', '/play/poster.mjs?v=41',
  '/manifest.webmanifest', '/assets/icon-180.png', '/assets/icon-512.png',
  '/assets/landing/hotpot-mj-full-v19.webp', '/assets/studio/noodle-print.webp',
  '/assets/studio/brush.png', '/assets/studio/turn.png'
];
const CORE_URLS = new Set(CORE);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(async cache => {
    // Artwork is optional: a single failed image must not prevent offline startup.
    await cache.addAll(CORE.filter(url => !url.startsWith('/assets/')));
    await Promise.allSettled(CORE.filter(url => url.startsWith('/assets/')).map(async url => {
      const response = await network(url);
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE)
      .map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

async function network(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const navigation = request.mode === 'navigate';
  if (!navigation && !CORE_URLS.has(url.pathname + url.search) && !url.pathname.startsWith('/assets/')) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const pagePath = url.pathname === '/chat.html' ? '/chat' : url.pathname;
    const cached = (await cache.match(request)) || (navigation && await cache.match(pagePath));
    if (!navigation && cached) return cached;
    try {
      const response = await network(request);
      // Forward the host's HTML redirects as navigation responses, not offline failures.
      if (navigation && response.type === 'opaqueredirect') return response;
      if (response.ok) {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
        return response;
      }
      return cached || (navigation && await cache.match('/')) || response;
    } catch (_) {
      return cached || (navigation && await cache.match('/')) || Response.error();
    }
  })());
});
