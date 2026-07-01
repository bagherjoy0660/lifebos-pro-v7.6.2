// ================== SERVICE WORKER v7.7 (PWA بهبود یافته) ==================
const CACHE_NAME = "lifebospro-v7.7";
const urlsToCache = [
  "/lifebos-pro-v7.0/",
  "/lifebos-pro-v7.0/index.html",
  "/lifebos-pro-v7.0/offline.html",
  "/lifebos-pro-v7.0/css/style.css",
  "/lifebos-pro-v7.0/js/main.js",
  "/lifebos-pro-v7.0/js/modules/core/state.js",
  "/lifebos-pro-v7.0/js/modules/core/utils.js",
  "/lifebos-pro-v7.0/js/modules/features/dashboard.js",
  "/lifebos-pro-v7.0/js/modules/features/planner.js",
  "/lifebos-pro-v7.0/js/modules/features/habits.js",
  "/lifebos-pro-v7.0/js/modules/features/focus.js",
  "/lifebos-pro-v7.0/js/modules/features/wellness.js",
  "/lifebos-pro-v7.0/js/modules/features/exercise.js",
  "/lifebos-pro-v7.0/js/modules/features/notepad.js",
  "/lifebos-pro-v7.0/js/modules/features/goals.js",
  "/lifebos-pro-v7.0/js/modules/features/journal.js",
  "/lifebos-pro-v7.0/js/modules/features/settings.js",
  "/lifebos-pro-v7.0/js/modules/features/stats.js",
  "/lifebos-pro-v7.0/js/modules/features/calendar.js",
  "/lifebos-pro-v7.0/manifest.json",
  "/lifebos-pro-v7.0/assets/icon-192.png",
  "/lifebos-pro-v7.0/assets/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell...");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("Deleting old cache:", cache);
              return caches.delete(cache);
            }
          }),
        );
      })
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // برای درخواست‌های ناوبری (صفحات) ابتدا سعی می‌کنیم از شبکه، اگر خطا خورد از کش
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/lifebos-pro-v7.0/offline.html");
      }),
    );
    return;
  }

  // برای سایر فایل‌های استاتیک، استراتژی Cache First
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
      );
    }),
  );
});
