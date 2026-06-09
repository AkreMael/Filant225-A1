importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBYoX0tIbEeM2PlP44ToE_kDcpj6RheIIo",
  authDomain: "filant225-base.firebaseapp.com",
  projectId: "filant225-base",
  storageBucket: "filant225-base.firebasestorage.app",
  messagingSenderId: "620102449526",
  appId: "1:620102449526:web:998bf392f3dbab62682257",
  measurementId: "G-88XZE34VHC"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data,
    tag: 'background-notification',
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ====== PWA CACHE IMPLEMENTATION FOR OFFLINE COMPATIBILITY ======
const CACHE_NAME = 'filant225-pwa-cache-v1';
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/screenshots/screenshot-mobile.png',
  '/screenshots/screenshot-desktop.png'
];

// Installation event: cache Shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching shell assets');
        return cache.addAll(ASSETS_TO_PRECACHE).catch(err => {
          console.warn('[Service Worker] Non-blocking precaching warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation event: clear obsolete caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first caching strategy with dynamic fallbacks
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass cache completely for dynamic resources
  if (
    request.method !== 'GET' ||
    url.pathname.includes('/api/') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.pathname.startsWith('/@') || 
    url.pathname.includes('/vite') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return; // Passthrough
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache valid responses matching the application origin or local files
        if (response && response.status === 200 && (response.type === 'basic' || url.origin === self.location.origin)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Safe offline cache retrieval
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Redirect page navigation offline to the standard PWA index.html shell
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html') || caches.match('/');
          }
          return new Response('Connexion perdue. FILANT°225 nécessite une connexion internet pour actualiser ces données.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
          });
        });
      })
  );
});
