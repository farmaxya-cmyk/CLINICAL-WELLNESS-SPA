
const CACHE_NAME = 'clinical-wellness-v8-audio-fix';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Tenta di cachare i file base, ma non bloccare l'installazione se fallisce (es. in dev)
        return cache.addAll(urlsToCache).catch(err => {
            console.log('Cache install warning (non-critical):', err);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. IGNORA FILE AUDIO E MEDIA (Evita problemi ORB/CORB con server esterni come catbox)
  if (url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav') || url.pathname.endsWith('.ogg')) {
    return; // Lascia che il browser gestisca la richiesta direttamente via rete
  }

  // 2. IGNORA RICHIESTE DI SVILUPPO VITE/REACT
  if (
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/src') || 
    url.pathname.startsWith('/node_modules') || 
    url.port === '5173' ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 3. STRATEGIA NETWORK-FIRST CON FALLBACK CACHE
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se la risposta è valida e siamo sulla stessa origine, aggiorna la cache
        if (response && response.status === 200 && response.type === 'basic' && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se siamo offline o la rete fallisce, prova la cache
        return caches.match(event.request);
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
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
