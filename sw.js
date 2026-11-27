const CACHE = 'hoy-cache-v36';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './hoy_sol_original.png',
  './hoy_cielo_nubes.jpg',
  './hoy-sol-v29-180.png',
  './hoy-sol-v29-192.png',
  './hoy-sol-v29-512.png',
  './bible-rv1909.json',
  './bible-consejos.json',
  './martin-fierro.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('hoy-cache-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put('./index.html', copy)); }
      return response;
    }).catch(() => caches.open(CACHE).then(cache => cache.match('./index.html').then(cached => cached || Response.error()))));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) cache.put(request, response.clone()); return response; }))));
});
