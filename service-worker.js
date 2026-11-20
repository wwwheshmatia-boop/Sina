const CACHE_NAME = 'meydan-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './xlsx.full.min.js',
  './html2pdf.bundle.min.js',
  './chart.umd.min.js',
  './manifest.json'
];

// نصب و کش کردن فایل‌ها
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('کش کردن فایل‌ها انجام شد');
        return cache.addAll(urlsToCache);
      })
  );
});

// فعال‌سازی و پاک کردن کش‌های قدیمی
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// وقتی اینترنت قطع بود، از کش بخون
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // اگه توی کش بود، از کش بده
        }
        return fetch(event.request); // اگه نبود، برو از اینترنت بگیر
      })
  );
});
