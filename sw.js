const CACHE = 'hoy-cache-v30';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './hoy_sol_original.png',
  './hoy_cielo_nubes.jpg',
  './bible-rv1909.json',
  './martin-fierro.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('hoy-cache-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Always check the network for page navigations so installed HOY
  // receives the newest HTML. Keep a cached copy for offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('./index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches.open(CACHE).then(cache =>
            cache.match('./index.html').then(cached => cached || Response.error())
          )
        )
    );
    return;
  }

  // For app assets, use only this version's cache; otherwise fetch and cache.
  event.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        });
      })
    )
  );
});
