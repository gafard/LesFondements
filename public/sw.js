// Service Worker pour Les Fondements PWA
const CACHE_NAME = 'lesfondements-v1';
const ASSETS_A_METTRE_EN_CACHE = [
  '/',
  '/dashboard',
  '/fiches',
  '/journal',
  '/memorisation',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_A_METTRE_EN_CACHE).catch(() => {
        // En cas d'erreur sur un asset optionnel, on continue
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET ou externes aux assets
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Pour les requêtes d'API ou Firebase, laisser passer en direct réseau
  if (url.pathname.startsWith('/api') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stratégie Stale-While-Revalidate
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Hors-ligne fallback si disponible
        return caches.match('/');
      });
    })
  );
});
