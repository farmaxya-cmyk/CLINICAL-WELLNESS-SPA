const CACHE_NAME = 'clinical-wellness-v20';

// FIX: GitHub Pages usa una sottocartella /CLINICAL-WELLNESS-SPA/
// quindi i file vanno referenziati con percorso relativo
const urlsToCache = [
  './index.html',
  './manifest.json'
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

  // BYPASS AUDIO: il SW NON deve toccare gli MP3
  if (
    event.request.destination === 'audio' ||
    url.pathname.includes('/audio/') ||
    url.pathname.endsWith('.mp3')
  ) {
    return; // lascia la rete gestire l'audio
  }

  // BYPASS richieste dev
  if (
    url.port === '5173' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
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
