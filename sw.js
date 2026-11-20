const PREFIX = 'meal-picker-';
const CACHE = `${PREFIX}v37`;
const CORE = [
  '/typing.js?v=37', '/meal-parameters.js?v=37', '/', '/index.html', '/styles.css?v=37', '/literary-intro.css?v=37', '/landing-hotpot.css?v=37',
  '/food-data.js?v=37', '/food-policy.js?v=37', '/personality-engine.js?v=37', '/qr-code.js?v=37',
  '/persona-art.js?v=37', '/psychic-app.js?v=37', '/literary-quotes-v5.js?v=37', '/literary-intro.js?v=37', '/wake-intro.css?v=37', '/wake-intro.js?v=37',
  '/chat-questions.mjs?v=37', '/chat.js?v=37', '/chat.css?v=37',
  '/manifest.webmanifest', '/assets/icon-180.png', '/assets/icon-512.png',
  '/assets/landing/hotpot-mj-full-v19.webp'
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
    const cached = await cache.match(request);
    if (!navigation && cached) return cached;
    try {
      const response = await network(request);
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
