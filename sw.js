
const CACHE_NAME = 'clinical-wellness-v13-media-final';
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

  // LOGICA DI BYPASS TOTALE PER AUDIO
  // Se è un audio o un dominio media, NON usare event.respondWith
  // Questo permette al browser di gestire nativamente le Range Requests
  if (
    event.request.destination === 'audio' ||
    url.pathname.toLowerCase().endsWith('.mp3') ||
    url.pathname.toLowerCase().endsWith('.wav') ||
    url.hostname.includes('catbox.moe') ||
    url.hostname.includes('archive.org')
  ) {
    return; // Esci e lascia fare al browser
  }

  // Bypass sviluppo
  if (url.port === '5173' || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
    return;
  }

  // Strategia standard per il resto dell'app
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
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
