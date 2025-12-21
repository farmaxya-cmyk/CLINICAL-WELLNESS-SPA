const CACHE_NAME = 'clinical-wellness-v22';
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
  const requestURL = new URL(event.request.url);

  // Ignora richieste fuori dominio
  if (requestURL.origin !== location.origin) return;

  // Ricostruisci l’URL corretto con BASE
  let fixedURL = requestURL.pathname;
  if (!fixedURL.startsWith(BASE)) {
    fixedURL = BASE + fixedURL.replace(/^\//, '');
  }

  const fixedRequest = new Request(fixedURL, {
    method: event.request.method,
    headers: event.request.headers,
    mode: event.request.mode,
    credentials: event.request.credentials,
    redirect: event.request.redirect,
    referrer: event.request.referrer,
    referrerPolicy: event.request.referrerPolicy
  });

  // BYPASS AUDIO
  if (
    event.request.destination === 'audio' ||
    fixedURL.endsWith('.mp3')
  ) {
    return;
  }

  // BYPASS richieste non GET
  if (event.request.method !== 'GET') return;

  // WHITELIST estensioni cacheabili
  const CACHEABLE = ['.html', '.js', '.css', '.png', '.svg', '.json'];
  if (!CACHEABLE.some(ext => fixedURL.endsWith(ext))) return;

  event.respondWith(
    caches.match(fixedRequest).then((cached) => {
      const fetchPromise = fetch(fixedRequest)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(fixedRequest, responseToCache);
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
