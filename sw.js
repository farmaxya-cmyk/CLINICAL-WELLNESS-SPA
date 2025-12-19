
const CACHE_NAME = 'clinical-wellness-v15-media-bypass';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS TOTALE E IMMEDIATO PER MP3 E MEDIA ESTERNI
  // Se l'URL contiene estensioni audio o proviene da domini media, ESCE dal Service Worker
  if (
    event.request.destination === 'audio' ||
    url.pathname.toLowerCase().endsWith('.mp3') ||
    url.pathname.toLowerCase().endsWith('.wav') ||
    url.hostname.includes('catbox.moe') ||
    url.hostname.includes('archive.org')
  ) {
    return; // Passa alla rete nativa
  }

  // Bypass sviluppo
  if (url.port === '5173' || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
