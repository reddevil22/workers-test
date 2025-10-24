// Simple service worker for basic offline caching
const CACHE_NAME = "workers-test-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/src/react-app/main.tsx",
  "/vite.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  // @ts-ignore
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  // @ts-ignore
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
