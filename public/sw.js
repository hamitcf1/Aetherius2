// Minimal service worker that bypasses caching for third-party analytics
// This prevents the "no-response" error from Cloudflare's auto-injected service worker

const CACHE_NAME = 'aetherius-v1';

// Skip waiting and claim clients immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Network-first strategy with fallback, but skip caching for external domains
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't intercept requests to external domains (analytics, CDNs, etc.)
  if (url.origin !== self.location.origin) {
    // Just let the browser handle it normally - don't try to cache
    return;
  }
  
  // For same-origin requests, use network-first strategy
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
