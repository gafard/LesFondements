// Service Worker pour Les Fondements PWA & Push Notifications
const CACHE_NAME = 'lesfondements-v4';
const ASSETS_A_METTRE_EN_CACHE = [
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
  // Pas de `skipWaiting()` ici : une nouvelle version qui prend la main au
  // milieu d'une session remplace l'application sous les doigts de quelqu'un
  // qui est peut-être en train d'écrire. On attend que l'application le
  // demande — voir `appliquerMiseAJour()` dans src/lib/application.ts.
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'PRENDRE_LA_MAIN') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      // On ne supprime que les versions périmées de NOTRE coquille.
      // Balayer tous les caches emportait aussi ce que la personne avait
      // délibérément téléchargé — les paquets hors connexion et les voix,
      // jusqu'à plusieurs dizaines de mégaoctets — à chaque mise à jour.
      return Promise.all(
        keys
          .filter((key) => key.startsWith('lesfondements-v') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non GET, les API et les domaines tiers.
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.pathname === '/sw.js'
  ) {
    return;
  }

  // Une navigation doit toujours chercher la version publiée en premier.
  // Le cache ne sert qu'en véritable mode hors ligne : il ne peut donc plus
  // masquer un nouveau déploiement de la page d'accueil.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          return (
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match('/')) ||
            Response.error()
          );
        })
    );
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
      return fetch(event.request).catch(() => Response.error());
    })
  );
});

// ── Web Push Notification Events ─────────────────────────────

self.addEventListener('push', (event) => {
  let donnee = {
    title: 'Les Fondements',
    body: 'Un moment pour méditer et grandir dans la foi.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    url: '/dashboard',
    tag: 'fondements-notification',
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      donnee = { ...donnee, ...payload };
    } catch {
      const text = event.data.text();
      if (text) donnee.body = text;
    }
  }

  const options = {
    body: donnee.body,
    icon: donnee.icon || '/icon-192.png',
    badge: donnee.badge || '/icon-192.png',
    tag: donnee.tag || 'fondements-notification',
    renotify: true,
    data: {
      url: donnee.url || '/dashboard',
      date: Date.now(),
    },
    actions: donnee.actions || [
      { action: 'ouvrir', title: 'Ouvrir l’application' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(donnee.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlCible = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte sur le domaine, on la focus et on navigue
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlCible);
          }
          return client.focus();
        }
      }
      // Sinon on ouvre une nouvelle fenêtre
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlCible);
      }
    })
  );
});
