// service-worker.js
// Version: 0.1.5 - Force Refresh

const CACHE_NAME = 'intelligent-ai-hospital-v2';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
];

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install v2');
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate v2');
    // Tell the active service worker to take control of the page immediately.
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
    // Use a "Network First, falling back to cache" strategy for HTML
    // "Stale-While-Revalidate" for others could be better, but let's stick to safe Network First for API/HTML

    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache successful GET responses
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        // Don't cache API calls in this specific block if you want fresh data always
                        // But for assets it is fine.
                        if (!event.request.url.includes('/api/')) {
                            cache.put(event.request, responseToCache);
                        }
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                console.log(`[Service Worker] Fetch failed for ${event.request.url}; trying cache.`);
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    // Fallback?
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = self.location.origin + (event.notification.data.url || '/');
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
