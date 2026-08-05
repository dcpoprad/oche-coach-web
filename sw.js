const CACHE_NAME = 'oche-coach-v2';

// 1. INŠTALÁCIA - Stiahne nové súbory do novej pamäte
self.addEventListener('install', event => {
  self.skipWaiting(); // Okamžite aktivuje nový Service Worker, nečaká na zavretie appky
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './manifest.json',
        'https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/OC_logo.png'
      ]);
    })
  );
});

// 2. AKTIVÁCIA - Upratovačka (Vymaže starú pamäť, napr. v1)
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim()); // Okamžite prevezme kontrolu nad stránkou

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Ak sa názov pamäte nezhoduje s aktuálnym (v2), vymaž ho
          if (cacheName !== CACHE_NAME) {
            console.log('Oche Coach: Vymazávam starú cache ->', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. FETCH - Používanie súborov
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});