const CACHE_NAME = 'iarnold-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/apple-touch-icon.svg',
  '/icon-192.svg',
  '/icon-512.svg',
  '/maskable-icon.svg',
  '/qrcode.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(urlsToCache).catch(error => {
            console.error('Failed to cache one or more resources during install:', error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // Stale-while-revalidate strategy:
  // Respond with the cached version immediately if available,
  // then fetch the network version in the background to update the cache for the next visit.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(
          networkResponse => {
            // If the fetch is successful, update the cache.
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                });
            }
            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed; returning cached response if available.', error);
            // If the network fails, and we already have a cached response, it's already been returned.
            // If there's no cached response, the promise will reject, leading to a browser error page.
        });

        // Return the cached response if available, otherwise wait for the network response.
        return cachedResponse || fetchPromise;
      })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
