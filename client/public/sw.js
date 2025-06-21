const CACHE_NAME = 'propnet-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-propnet.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('Cache addAll failed:', error);
          // Continue installation even if caching fails
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - optimized for iOS Safari and Samsung Internet
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests and chrome-extension requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests (app startup) - critical for iOS and Samsung
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone response for iOS Safari compatibility
          return response.clone();
        })
        .catch(() => {
          // Fallback to cached main page
          return caches.match('/').then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse.clone();
            }
            // Final fallback - return basic HTML
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>PropNet</title>
                  <style>
                    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #2563eb; color: white; text-align: center; }
                  </style>
                </head>
                <body>
                  <h1>PropNet</h1>
                  <p>Loading...</p>
                  <script>setTimeout(() => window.location.reload(), 2000);</script>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        })
    );
    return;
  }

  // Handle API and asset requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response.clone();
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache failed responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone for Samsung Internet compatibility
            const responseToCache = response.clone();
            
            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(() => {
                // Ignore cache errors
              });
            
            return response;
          })
          .catch(() => {
            // Return empty response for failed requests to prevent white screen
            return new Response('', { status: 200 });
          });
      })
  );
});

// Push notification support
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from PropNet',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('PropNet', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});