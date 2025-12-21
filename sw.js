const CACHE_NAME = 'clinical-wellness-v21';
const BASE = '/CLINICAL-WELLNESS-SPA/';

const urlsToCache = [
  `${BASE}index.html`,
  `${BASE}manifest.json`
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('Cache install warning (non-critical):', err);
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS AUDIO
  if (
    event.request.destination === 'audio' ||
    url.pathname.endsWith('.mp3')
  ) {
    return;
  }

  // BYPASS richieste non GET
  if (event.request.method !== 'GET') return;

  // BYPASS richieste fuori dominio
  if (!url.origin.startsWith(self.location.origin)) return;

  // WHITELIST estensioni cacheabili
  const CACHEABLE = ['.html', '.js', '.css', '.png', '.svg', '.json'];
  if (!CACHEABLE.some(ext => url.pathname.endsWith(ext))) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});
