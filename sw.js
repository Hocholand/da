/* Офлайн-кэш «Ритма дня».
   Приложение скачивается один раз и дальше открывается без сети.
   Если правишь index.html — подними номер версии, иначе телефон
   будет показывать старую копию. */
const VERSION = 'ritm-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names.filter(name => name !== VERSION).map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;   // шрифты грузим как получится

  event.respondWith(
    caches.match(request).then(hit => {
      if (hit) {
        // обновляем копию в фоне, но показываем сразу
        fetch(request).then(fresh => {
          if (fresh && fresh.ok) caches.open(VERSION).then(c => c.put(request, fresh.clone()));
        }).catch(() => {});
        return hit;
      }
      return fetch(request).then(fresh => {
        if (fresh && fresh.ok) {
          const copy = fresh.clone();
          caches.open(VERSION).then(c => c.put(request, copy));
        }
        return fresh;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
