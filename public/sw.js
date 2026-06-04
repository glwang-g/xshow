const BUILD_ID = "__XSHOW_BUILD_ID__";
const CACHE_NAME = `xshow-circuits-${BUILD_ID}`;
const NAVIGATION_TIMEOUT_MS = 4000;
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
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      const staleKeys = keys.filter((key) => key !== CACHE_NAME);
      const hadPreviousAppCache = staleKeys.some((key) => key.startsWith("xshow-circuits-"));

      await Promise.all(staleKeys.map((key) => caches.delete(key)));
      await self.clients.claim();

      if (hadPreviousAppCache) {
        await notifyWindowClientsUpdateReady();
        await reloadWindowClients();
      }
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

async function precacheAppShell() {
  const cache = await caches.open(CACHE_NAME);

  await Promise.all(
    APP_SHELL.map(async (url) => {
      try {
        const response = await fetchWithTimeout(new Request(url), NAVIGATION_TIMEOUT_MS);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // A single slow shell asset should not keep an old worker in control.
      }
    })
  );
}

async function fetchWithTimeout(request, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function reloadWindowClients() {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window"
  });

  await Promise.all(
    clients.map((client) => {
      if (!client.url || !("navigate" in client)) {
        return Promise.resolve();
      }

      return client.navigate(client.url).catch(() => {
        // If a client cannot be navigated, the next normal navigation will still use the new worker.
      });
    })
  );
}

async function notifyWindowClientsUpdateReady() {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window"
  });

  clients.forEach((client) => {
    client.postMessage({
      type: "XSHOW_UPDATE_READY",
      buildId: BUILD_ID
    });
  });
}

function cacheIndexResponse(response) {
  if (!response.ok) {
    return Promise.resolve();
  }

  const copy = response.clone();
  return caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
}

async function navigationResponse(request) {
  try {
    const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
    cacheIndexResponse(response).catch(() => {
      // Cache refreshes should never block navigation.
    });
    return response;
  } catch {
    return (await caches.match("/index.html")) || (await caches.match("/offline.html")) || Response.error();
  }
}

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
    event.respondWith(navigationResponse(request));
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
