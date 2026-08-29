const CACHE = "meal-picker-v10";
const ASSETS = [
  "/", "/index.html", "/styles.css", "/screen-refresh.css", "/food-data.js", "/food-policy.js",
  "/literary-quotes-v5-1.js", "/literary-quotes-v5-2.js", "/literary-quotes-v5-3.js", "/literary-quotes-v5-4.js", "/literary-opening.js", "/personality-engine.js", "/question-copy.js", "/qr-code.js", "/psychic-app.js", "/flow-lite.js", "/manifest.webmanifest",
  "/assets/icon-180.png", "/assets/icon-512.png", "/share-card.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
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
