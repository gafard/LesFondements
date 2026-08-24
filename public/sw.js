// Service Worker pour Les Fondements PWA & Push Notifications
const CACHE_NAME = 'lesfondements-v2';
const ASSETS_A_METTRE_EN_CACHE = [
  '/',
  '/dashboard',
  '/fiches',
  '/journal',
  '/memorisation',
  '/groupes',
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

  // Pour les requêtes d'API, audio externe ou Firebase, laisser passer en direct réseau
  if (
    url.pathname.startsWith('/api') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('wordproaudio')
  ) {
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

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((nouvelAbonnement) => {
        // Enregistrer le nouvel abonnement sur l'API Worker
        return fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: nouvelAbonnement }),
        });
      })
      .catch((err) => console.warn('Erreur réabonnement push:', err))
  );
});
