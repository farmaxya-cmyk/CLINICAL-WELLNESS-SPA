const CACHE_NAME = 'clinical-wellness-v20';
const urlsToCache = ['/', '/index.html', '/manifest.json'];

// Installazione: cache base
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// FETCH: gestione completa
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 🔥 BYPASS AUDIO: Catbox + MP3
  if (
    url.hostname.includes('catbox.moe') ||
    url.pathname.endsWith('.mp3')
  ) {
    event.respondWith(
      fetch(event.request, { mode: 'no-cors' }).catch(() => {
        // Risposta "finta" per evitare errori
        return new Response(null, { status: 200 });
      })
    );
    return;
  }

  // 🔧 Escludi richieste interne di Vite
  if (
    url.port === '5173' ||
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/node_modules')
  ) {
    return;
  }

  // 🌐 Network-first con fallback cache
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

// Attivazione: pulizia vecchie cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});
