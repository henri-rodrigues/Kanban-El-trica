// Auto-updating Service Worker with Cache-Busting Strategy
const CACHE_NAME = 'omnifield-v3-offline';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event: Skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Clear all old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for message from app to purge cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});

// Notificações push (Firebase Cloud Messaging, mensagens só com "data").
self.addEventListener('push', (event) => {
  let dados = {};
  try { dados = event.data ? event.data.json() : {}; } catch { dados = { data: { title: 'Gestão Elétrica', body: event.data?.text() } }; }
  const d = dados.data || dados.notification || {};
  event.waitUntil(
    self.registration.showNotification(d.title || 'Gestão Elétrica', {
      body: d.body || '',
      icon: './logo.png',
      badge: './favicon.png',
      tag: d.tag || undefined,
      data: { link: d.link || './' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => j.url.startsWith(self.registration.scope));
      if (aberta) {
        aberta.navigate(link).catch(() => {});
        return aberta.focus();
      }
      return self.clients.openWindow(link);
    })
  );
});

// Fetch Event: Network-first strategy for fresh updates, falling back to cache if offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Só arquivos do próprio sistema; banco (Firestore), login e CDNs ficam fora do cache.
  if (url.origin !== self.location.origin) return;

  // Arquivos com hash no nome (assets/...) nunca mudam: cache primeiro, abre rápido e sem internet.
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        if (response.status === 200) {
          const copia = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        }
        return response;
      }))
    );
    return;
  }

  // Always fetch HTML documents from network first to catch deployments instantly
  const isHtmlRequest = event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html');

  if (isHtmlRequest) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
