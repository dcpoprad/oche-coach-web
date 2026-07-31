const CACHE_NAME = 'oche-coach-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './manifest.json', // Manifest musí byť v cache
        'https://raw.githubusercontent.com/dcpoprad/dc-poprad-assets/main/OC_logo.png' // Pridaj logo, inak sa ti v offline režime nezobrazí
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});