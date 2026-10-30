const CACHE_NAME = 'evalora-v1.0.1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/evalora-icon.svg',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If running on localhost or in development, never intercept or cache
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  // Do not intercept or cache live exams, proctoring, grading, or API calls
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // For HTML page navigation requests: Network-First strategy
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // Static assets: Stale-while-revalidate or cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
