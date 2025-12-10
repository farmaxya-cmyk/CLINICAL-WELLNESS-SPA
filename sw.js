
const CACHE_NAME = 'clinical-wellness-v6';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Forza il nuovo service worker a diventare attivo immediatamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITICO: Ignora richieste di sviluppo Vite e Hot Module Replacement
  // Questo previene il blocco (White Screen) in localhost se il SW è attivo
  if (
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/node_modules') || 
    url.pathname.includes('chrome-extension') ||
    url.port === '5173' // Porta standard di Vite
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Cancella le vecchie cache per mostrare le modifiche
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notifica i client che il SW è attivo
      return self.clients.claim();
    })
  );
});
