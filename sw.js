// KRC PWA service worker — caches the app shell for offline launch.
// NEVER caches API calls (those always hit the live KRC cloud).
const CACHE = 'krc-shell-v24';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // API/cross-origin -> network
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
// Web Push: KRC reaches the phone even when the app is closed.
self.addEventListener('push', e => {
  let d = { title: 'KRC', body: '' };
  try { d = Object.assign(d, e.data.json()); } catch (_) { try { d.body = e.data.text(); } catch (__) {} }
  e.waitUntil(self.registration.showNotification(d.title || 'KRC', {
    body: d.body || '', tag: d.tag || 'krc', renotify: true,
    icon: './icon-192.png', badge: './icon-192.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) {
      if ('focus' in w) {
        // navigate the already-open app to the notification url (e.g. ?krcfile=NAME)
        if (url && url !== './' && 'navigate' in w) {
          return w.navigate(url).then(c => (c || w).focus()).catch(() => w.focus());
        }
        return w.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
