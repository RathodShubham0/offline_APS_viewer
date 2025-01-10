// client/public/serviceWorker.js

const cache_storage_name = 'aps-offline-mern-1.0';
const start_page = 'index.html';
const offline_page = 'offline.html';
const first_cache_urls = [
    start_page,
    offline_page,
    'manifest.json',
    'robots.txt',
    'favicon.ico',
    'logo192.png',
    'logo512.png',
    'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css',
    'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'
];
const never_cache_urls = [/\/private.html/, /\/panel/, /\/custom-url/];

// Install
self.addEventListener('install', function (e) {
    console.log('PWA sw installation');
    e.waitUntil(caches.open(cache_storage_name).then(function (cache) {
        console.log('PWA sw caching first urls');
        return cache.addAll(first_cache_urls);
    }));
});

// Activate
self.addEventListener('activate', function (e) {
    console.log('PWA sw activation');
    e.waitUntil(caches.keys().then(function (kl) {
        return Promise.all(kl.map(function (key) {
            if (key !== cache_storage_name) {
                console.log('PWA old cache removed', key);
                return caches.delete(key);
            }
        }));
    }));
    return self.clients.claim();
});

// Fetch
self.addEventListener('fetch', function (e) {
    if (!checkFetchRules(e)) return;

    // Strategy for online user
    if (e.request.mode === 'navigate' && navigator.onLine) {
        e.respondWith(fetch(e.request).then(function (response) {
            return caches.open(cache_storage_name).then(function (cache) {
                if (never_cache_urls.every(check_never_cache_urls, e.request.url)) {
                    cache.put(e.request, response.clone());
                }
                return response;
            });
        }));
        return;
    }

    // Strategy for offline user
    e.respondWith(caches.match(e.request).then(function (response) {
        return response || fetch(e.request).then(function (response) {
            return caches.open(cache_storage_name).then(function (cache) {
                if (never_cache_urls.every(check_never_cache_urls, e.request.url)) {
                    cache.put(e.request, response.clone());
                }
                return response;
            });
        });
    }).catch(function () {
        return caches.match(offline_page);
    }));
});

// Check never cache urls
function check_never_cache_urls(url) {
    if (this.match(url)) {
        return false;
    }
    return true;
}

// Fetch Rules
function checkFetchRules(e) {
    // Check request url from inside domain.
    if (new URL(e.request.url).origin !== location.origin) return;

    // Check request url http or https
    if (!e.request.url.match(/^(http|https):\/\//i)) return;

    // Show offline page for POST requests
    if (e.request.method !== 'GET') {
        return caches.match(offline_page);
    }

    return true;
}

importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.0.2/workbox-sw.js");
if (workbox.googleAnalytics) {
    try {
        workbox.googleAnalytics.initialize();
    } catch (e) {
        console.log(e.message);
    }
}