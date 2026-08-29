const CACHE = "meal-picker-v15";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/literary-intro.css", "/landing-hotpot.css",
  "/food-data.js", "/food-policy.js", "/personality-engine.js", "/qr-code.js",
  "/persona-art.js", "/psychic-app.js", "/literary-quotes-v5.js", "/literary-intro.js",
  "/manifest.webmanifest", "/assets/icon-180.png", "/assets/icon-512.png", "/share-card.png"
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
