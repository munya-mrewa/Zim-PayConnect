const CACHE_NAME = 'payconnect-offline-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  '/site.webmanifest',
  '/favicon.ico',
  '/dashboard',
  '/history'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // We only care about GET requests
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // If it's an API request, try network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Cache successful API responses (e.g., reports)
          if (networkResponse.ok && event.request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
           return caches.match(event.request).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return new Response(JSON.stringify({ error: "Offline" }), {
                 status: 503,
                 headers: { 'Content-Type': 'application/json' }
              });
           });
        })
    );
    return;
  }

  // Default strategy for page and static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
           const responseClone = networkResponse.clone();
           caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
           });
        }
        return networkResponse;
      }).catch(() => {
        // Ignore fetch errors (offline)
      });
      return cachedResponse || fetchPromise;
    })
  );
});