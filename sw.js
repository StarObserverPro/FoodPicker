const PREFIX = 'meal-picker-';
const CACHE = `${PREFIX}v20`;
const CORE = [
  '/', '/index.html', '/styles.css?v=20', '/literary-intro.css?v=20', '/landing-hotpot.css?v=20',
  '/food-data.js?v=20', '/food-policy.js?v=20', '/personality-engine.js?v=20', '/qr-code.js?v=20',
  '/persona-art.js?v=20', '/psychic-app.js?v=20', '/literary-quotes-v5.js?v=20', '/literary-intro.js?v=20',
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
