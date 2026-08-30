const CACHE = "meal-picker-v16";
const ASSETS = [
  "/", "/index.html", "/styles.css?v=16", "/literary-intro.css?v=16", "/landing-hotpot.css?v=16",
  "/food-data.js?v=16", "/food-policy.js?v=16", "/personality-engine.js?v=16", "/qr-code.js?v=16",
  "/persona-art.js?v=16", "/psychic-app.js?v=16", "/literary-quotes-v5.js?v=16", "/literary-intro.js?v=16",
  "/manifest.webmanifest", "/assets/icon-180.png", "/assets/icon-512.png", "/share-card.png",
  "/assets/landing/hotpot-mj-v2.png",
  "/assets/direct/direct-food-01-v2.png", "/assets/direct/direct-food-02-v2.png",
  "/assets/direct/direct-food-03-v2.png", "/assets/direct/direct-food-04-v2.png",
  "/assets/direct/direct-food-05-v2.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok || response.type === "opaque") {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return caches.match("/");
        return Response.error();
      })
  );
});
