const CACHE = 'omr-v1';
const ASSETS = [
  '/oh-my-raffle/',
  '/oh-my-raffle/index.html',
  '/oh-my-raffle/styles.css',
  '/oh-my-raffle/app.js',
  '/oh-my-raffle/logo.png',
  '/oh-my-raffle/icon-192.png',
  '/oh-my-raffle/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  // Offline-first: serve cache, then network fallback
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
