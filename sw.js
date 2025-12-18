
const CACHE_NAME = 'clinical-wellness-v11-final-audio-bypass';
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
        return cache.addAll(urlsToCache).catch(err => {
            console.log('SW: Install partial cache (non-critical):', err);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. BYPASS TOTALE PER AUDIO E DOMINI ESTERNI MEDIA
  // Il Service Worker NON deve intercettare gli MP3 perché i browser usano 'Range requests'
  // che il SW standard rompe, causando il silenzio.
  if (
      url.pathname.endsWith('.mp3') || 
      url.pathname.endsWith('.wav') || 
      url.pathname.endsWith('.ogg') ||
      url.hostname.includes('catbox.moe') ||
      url.hostname.includes('archive.org')
  ) {
    return; // Passa direttamente al browser (Network Only)
  }

  // 2. BYPASS AMBIENTE SVILUPPO
  if (
    url.pathname.startsWith('/@') || 
    url.pathname.startsWith('/src') || 
    url.pathname.startsWith('/node_modules') || 
    url.port === '5173' ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 3. STRATEGIA NETWORK-FIRST PER IL RESTO
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic' && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
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
            console.log('SW: Eliminazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});
