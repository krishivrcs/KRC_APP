/* KRC companion service worker — shell cache + push */
const CACHE = 'krc-app-v13';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Shell-first for navigations/assets; always go to network for the cloud API.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // never touch cross-origin (CDN, model files, cloud API)
  if (e.request.method !== 'GET' || url.pathname.includes('/api/') || url.pathname === '/krc') return; // let API calls hit network
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});
// Push notifications from the KRC cloud.
self.addEventListener('push', e => {
  let data = { title: 'KRC', body: 'You have an update.' };
  try { if (e.data) data = Object.assign(data, e.data.json()); } catch (_) { if (e.data) data.body = e.data.text(); }
  e.waitUntil(self.registration.showNotification(data.title || 'KRC', {
    body: data.body || '', icon: './icon-192.png', badge: './icon-192.png',
    tag: data.tag || undefined, data: data
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  // "krc-away-screen" (the PC needs input while you're away) deep-links to the Remote Control view.
  const wantPC = (e.notification.tag === 'krc-away-screen') || (d.tag === 'krc-away-screen') || (d.view === 'pc');
  const target = wantPC ? './index.html#pc' : './index.html';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ls => {
    for (const c of ls) {
      if ('focus' in c) { if (wantPC && 'postMessage' in c) c.postMessage({ krc: 'route', view: 'pc' }); return c.focus(); }
    }
    if (clients.openWindow) return clients.openWindow(target);
  }));
});
