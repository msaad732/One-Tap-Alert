const CACHE_NAME = "emergency-app-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/sw.js",
  "/style.css",
  "/script.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Intercept fetch and serve from cache if offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
}); 