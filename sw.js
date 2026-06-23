// KRC PWA service worker — caches the app shell for offline launch.
// NEVER caches API calls (those always hit the live KRC cloud).
const CACHE = 'krc-shell-v7';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // API/cross-origin -> network
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
