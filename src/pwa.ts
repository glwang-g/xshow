export const pwaUpdateAvailableEvent = "xshow:pwa-update-available";

const updateProbeParam = "_xshow_update_probe";
const currentBuildId = import.meta.env.VITE_XSHOW_BUILD_ID ?? "dev";
let updatePrompted = false;
let lastShellProbeAt = 0;

function notifyUpdateAvailable(registration: ServiceWorkerRegistration) {
  if (updatePrompted) {
    return;
  }

  updatePrompted = true;
  window.dispatchEvent(
    new CustomEvent(pwaUpdateAvailableEvent, {
      detail: { registration },
    }),
  );
}

function currentShellAssets() {
  return new Set(
    [
      ...Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map((item) => item.src),
      ...Array.from(document.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet'][href]")).map((item) => item.href),
    ].filter((url) => url.includes("/assets/")),
  );
}

function shellAssetsFromHtml(html: string) {
  const documentFromNetwork = new DOMParser().parseFromString(html, "text/html");
  return new Set(
    [
      ...Array.from(documentFromNetwork.querySelectorAll<HTMLScriptElement>("script[src]")).map((item) =>
        new URL(item.getAttribute("src") ?? "", window.location.href).href,
      ),
      ...Array.from(documentFromNetwork.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet'][href]")).map((item) =>
        new URL(item.getAttribute("href") ?? "", window.location.href).href,
      ),
    ].filter((url) => url.includes("/assets/")),
  );
}

function shellBuildIdFromHtml(html: string) {
  const documentFromNetwork = new DOMParser().parseFromString(html, "text/html");
  return documentFromNetwork.querySelector<HTMLMetaElement>("meta[name='xshow-build-id']")?.content ?? "";
}

function haveDifferentAssets(currentAssets: Set<string>, latestAssets: Set<string>) {
  if (currentAssets.size === 0 || latestAssets.size === 0) {
    return false;
  }

  if (currentAssets.size !== latestAssets.size) {
    return true;
  }

  return Array.from(latestAssets).some((url) => !currentAssets.has(url));
}

async function checkShellAssetsForUpdate(registration: ServiceWorkerRegistration, force = false) {
  const now = Date.now();
  if (updatePrompted) {
    return true;
  }

  if (!force && now - lastShellProbeAt < 30_000) {
    return false;
  }

  lastShellProbeAt = now;
  const probeUrl = new URL("./index.html", window.location.href);
  probeUrl.searchParams.set(updateProbeParam, String(now));

  try {
    const response = await fetch(probeUrl, {
      cache: "no-store",
      credentials: "same-origin",
    });

    if (!response.ok) {
      return;
    }

    const latestHtml = await response.text();

    if (
      shellBuildIdFromHtml(latestHtml) !== currentBuildId ||
      haveDifferentAssets(currentShellAssets(), shellAssetsFromHtml(latestHtml))
    ) {
      notifyUpdateAvailable(registration);
      return true;
    }
  } catch {
    // Update probing should never interrupt the workbench.
  }

  return false;
}

function watchForUpdates(registration: ServiceWorkerRegistration) {
  if (registration.waiting && navigator.serviceWorker.controller) {
    notifyUpdateAvailable(registration);
  }

  void registration.update().catch(() => {
    // Manual update checks are best-effort.
  });
  void checkShellAssetsForUpdate(registration);

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) {
      return;
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" && navigator.serviceWorker.controller) {
        notifyUpdateAvailable(registration);
      }
    });
  });

  window.addEventListener("focus", () => {
    void registration.update().catch(() => {
      // Manual update checks are best-effort.
    });
    void checkShellAssetsForUpdate(registration);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void registration.update().catch(() => {
        // Manual update checks are best-effort.
      });
      void checkShellAssetsForUpdate(registration);
    }
  });
}

export async function requestPwaUpdateCheck() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return false;
  }

  await registration.update().catch(() => {
    // Manual update checks are best-effort.
  });

  if (registration.waiting && navigator.serviceWorker.controller) {
    notifyUpdateAvailable(registration);
    return true;
  }

  return checkShellAssetsForUpdate(registration, true);
}

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type !== "XSHOW_UPDATE_READY") {
      return;
    }

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        notifyUpdateAvailable(registration);
      }
    });
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then(watchForUpdates)
      .catch(() => {
        // PWA support should never block the circuit workbench.
      });
  });
}
