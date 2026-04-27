// Service Worker - الكاشير
const CACHE_NAME = 'al-kasher-v1';

// الملفات التي سيتم تخزينها مؤقتاً للعمل بدون إنترنت
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/create-invoice.html',
    '/invoices.html',
    '/customers.html',
    '/inventory.html',
    '/wallet.html',
    '/statistics.html',
    '/settings.html',
    '/logo.png',
    '/styles.css',
    '/storage.js',
    '/utils.js',
    '/components.js',
    '/image-download.js',
    '/main.js',
    '/create-invoice.js',
    '/invoices.js',
    '/customers.js',
    '/inventory.js',
    '/wallet.js',
    '/statistics.js',
    '/settings.js',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap'
];

// تثبيت Service Worker وتخزين الملفات مؤقتاً
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('تخزين الملفات مؤقتاً...');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(function() {
                console.log('تم تثبيت Service Worker بنجاح');
                return self.skipWaiting();
            })
    );
});

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('حذف الكاش القديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(function() {
            console.log('تم تفعيل Service Worker بنجاح');
            return self.clients.claim();
        })
    );
});

// استراتيجية: Network First مع الرجوع إلى الكاش
self.addEventListener('fetch', function(event) {
    // تجاهل طلبات chrome-extension وطلبات غير http/https
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(function(networkResponse) {
                // إذا كان الطلب ناجحاً، خزنه في الكاش وأرجع النسخة الحية
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(function() {
                // إذا فشل الاتصال، أرجع من الكاش
                return caches.match(event.request)
                    .then(function(cachedResponse) {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // إذا كان الطلب لصفحة HTML، أرجع صفحة offline
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});