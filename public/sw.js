const CACHE_NAME = 'dreamworld-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/index.js',
    './assets/three.js',
    './models/museum/gallery1.glb',
    './models/props/tree.glb'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached asset or fetch from network
            return response || fetch(event.request);
        })
    );
});
