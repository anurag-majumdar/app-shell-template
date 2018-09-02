const staticCacheName = 'app-shell-static-v1';
const dynamicPagesCacheName = 'app-shell-dynamic-pages-v1'

const htmlJsRegexp = /.*\.html$|.*\.js$/i;

const staticCacheFileNames = [
  'public/offline.html',
  'lib/app.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(staticCacheName)
    .then((cache) => {
      cache.addAll([
        '/',
        'manifest.json',
        ...staticCacheFileNames
      ]);
    })
    .catch((error) => {
      console.log(`Error caching static assets: ${error}`);
    })
  );
});

self.addEventListener('activate', (event) => {
  if (self.clients && clients.claim) {
    clients.claim();
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('app-shell-') && cacheName !== staticCacheName;
        })
        .map((cacheName) => {
          return caches.delete(cacheName);
        })
      ).catch((error) => {
        console.log(`Some error occurred while removing existing cache: ${error}`);
      });
    }).catch((error) => {
      console.log(`Some error occurred while removing existing cache: ${error}`);
    }));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
        .then((fetchResponse) => {
          if (htmlJsRegexp.test(event.request.url)) {
            return cacheDynamicRequestData(dynamicPagesCacheName, event.request.url, fetchResponse.clone());
          }
        }).catch((error) => {
          console.log(`Some error occurred while saving data to dynamic cache: ${error}`);
        });
    }).catch((error) => {
      console.log(`Some error occurred while saving data to dynamic cache: ${error}`);
    })
  );
});

function cacheDynamicRequestData(dynamicCacheName, url, fetchResponse) {
  return caches.open(dynamicCacheName)
    .then((cache) => {
      cache.put(url, fetchResponse.clone());
      return fetchResponse;
    }).catch((error) => {
      console.log(`Some error occurred while saving data to dynamic cache with the name: ${dynamicCacheName} with error: ${error}`);
    });
}