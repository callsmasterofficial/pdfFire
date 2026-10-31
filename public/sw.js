const CACHE_NAME = "filemelo-cache-v1";
const STATIC_PRECACHE = [
  "/",
  "/manifest.json",
  "/icon.svg",
  "/icons/favicon.svg",
  "/icons/favicon-32x32.png",
];

// Installation: Pre-cache core app shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn("[SW] Pre-caching partial failure:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activation: Clean up stale caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interception: Cache-first for static immutable assets, Network-first for pages
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignore non-GET requests or browser extension calls
  if (request.method !== "GET" || !request.url.startsWith("http")) {
    return;
  }

  const url = new URL(request.url);

  // Always bypass caching on localhost / local development environments
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return;
  }

  // Cache-first for static Next.js assets, PDF.js workers, and local assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pdfjs/") ||
    url.pathname.endsWith(".mjs") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".png")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first with cache fallback for page navigation
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          // Fallback to cached root homepage if page is not yet cached
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline resource unavailable", { status: 503 });
        });
      })
  );
});

// Instant update trigger
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
