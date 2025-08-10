// Oh My Raffle! — Service Worker
const CACHE = 'omr-v1'; // bump version when assets change

// All paths root-relative for GitHub Pages project site
const ASSETS = [
  '/oh-my-raffle/',
  '/oh-my-raffle/index.html',
  '/oh-my-raffle/styles.css',
  '/oh-my-raffle/app.js',
  '/oh-my-raffle/manifest.webmanifest',
  '/oh-my-raffle/logo.png',
  '/oh-my-raffle/logo_192x192.png',
  '/oh-my-raffle/logo_512x512.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(res => res || fetch(evt.request))
  );
});
