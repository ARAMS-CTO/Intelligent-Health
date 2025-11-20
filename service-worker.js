// service-worker.js

const CACHE_NAME = 'intelligent-ai-hospital-v1';
// This list should include all the core files needed for the app to run offline.
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  // Note: CDN URLs are fetched via import maps and will be cached dynamically by the browser's HTTP cache.
  // Pre-caching them here can be complex due to opaque responses.
  // We'll rely on the fetch event handler to cache them upon first request.
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(APP_SHELL_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  // This ensures the service worker takes control of the page immediately.
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Use a "Network falling back to cache" strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the request is successful, clone the response and cache it.
        // This is important for dynamic content or assets not in the initial shell.
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If the network request fails (e.g., offline), try to serve from the cache.
        console.log(`[Service Worker] Fetch failed for ${event.request.url}; trying cache.`);
        return caches.match(event.request);
      })
  );
});


// This event is fired when a notification is clicked.
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  
  // Close the notification
  event.notification.close();

  // The URL to navigate to is stored in the notification's data property.
  // We construct the full URL based on the app's origin.
  const urlToOpen = self.location.origin + event.notification.data.url;

  // This block of code tries to find an existing window/tab with the same URL.
  // If it finds one, it focuses it. If not, it opens a new one.
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.endsWith(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no client is found, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
