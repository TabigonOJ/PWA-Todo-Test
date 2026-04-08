// モチベTODO - Service Worker (Network-First)
const CACHE_NAME = 'motitodo-v2';

// ── Install: 最低限のキャッシュのみ ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(['./index.html', './manifest.json']).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: 古いキャッシュを削除 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Google Fonts: Network-First（失敗時はキャッシュ）
  if (url.hostname.includes('fonts.g')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // HTML / JS / CSS: Network-First → オフライン時のみキャッシュにフォールバック
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
  }
});
