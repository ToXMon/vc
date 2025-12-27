const CACHE_NAME = 'all-or-nothing-v1.0';
const requiredUrlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/game.js',
  '/scripts/dice3d.js',
  '/scripts/websocket.js',
  '/manifest.json'
];

const optionalUrlsToCache = [
  '/scripts/lib/three.min.js'
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(requiredUrlsToCache)
          .then(() => {
            // Attempt to cache optional resources without failing the install
            return Promise.all(
              optionalUrlsToCache.map((url) =>
                cache.add(url).catch((error) => {
                  console.warn('Optional resource failed to cache:', url, error);
                })
              )
            );
          });
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch from cache first, then network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - fetch from network
        return fetch(event.request);
      })
      .catch((error) => {
        // Network or cache failure - provide a fallback response
        console.error('Fetch failed; returning offline fallback if available.', error);
        return caches.match('/index.html').then((fallbackResponse) => {
          if (fallbackResponse) {
            return fallbackResponse;
          }
          return new Response('Service unavailable', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});
