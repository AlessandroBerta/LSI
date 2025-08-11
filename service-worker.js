self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('supermercati-cache-v1').then((cache) => {
      return cache.addAll(['/', '/index.html', '/script.js', '/manifest.json']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
