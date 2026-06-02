const BUILD_ID = "__XSHOW_BUILD_ID__";
const CACHE_NAME = `xshow-circuits-${BUILD_ID}`;
const versioned = (url) => `${url}?v=${BUILD_ID}`;
const APP_SHELL = [
  "/",
  "/index.html",
  "/offline.html",
  versioned("/manifest.webmanifest"),
  versioned("/favicon.ico"),
  versioned("/img/icons/app-icon.svg"),
  versioned("/img/icons/android-chrome-192x192.png"),
  versioned("/img/icons/android-chrome-512x512.png"),
  versioned("/img/icons/android-chrome-maskable-192x192.png"),
  versioned("/img/icons/android-chrome-maskable-512x512.png"),
  versioned("/img/icons/apple-touch-icon.png")
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.searchParams.has("_xshow_update_probe")) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html").then((response) => response || caches.match("/offline.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});
