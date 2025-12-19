
const CACHE_NAME = 'clinical-wellness-v19';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS CRITICO: Il Service Worker NON deve toccare l'audio
  if (
    event.request.destination === 'audio' || 
    url.hostname.includes('catbox.moe') || 
    url.pathname.endsWith('.mp3')
  ) {
    return; // Esci immediatamente, usa la rete nativa del browser
  }

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
