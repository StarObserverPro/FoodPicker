const CACHE = "meal-picker-v18";
const ASSETS = [
  "/", "/index.html", "/styles.css?v=18", "/literary-intro.css?v=18", "/landing-hotpot.css?v=18",
  "/food-data.js?v=18", "/food-policy.js?v=18", "/personality-engine.js?v=18", "/qr-code.js?v=18",
  "/persona-art.js?v=18", "/psychic-app.js?v=18", "/literary-quotes-v5.js?v=18", "/literary-intro.js?v=18",
  "/manifest.webmanifest", "/assets/icon-180.png", "/assets/icon-512.png", "/share-card.png",
  "/assets/landing/hotpot-mj-full.png",
  "/assets/direct/direct-food-01-full.png", "/assets/direct/direct-food-02-full.png",
  "/assets/direct/direct-food-03-full.png", "/assets/direct/direct-food-04-full.png",
  "/assets/direct/direct-food-05-full.png",
  "/assets/quiz/quiz-ingredients-border.png", "/assets/quiz/quiz-table-spread.png",
  "/assets/quiz/quiz-breakfast-place.png", "/assets/quiz/quiz-scattered-plates.png",
  "/assets/quiz/quiz-dim-sum-table.png", "/assets/quiz/quiz-pastel-feast.png"
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
