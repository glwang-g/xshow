import { onBeforeUnmount, onMounted, ref } from "vue";
import { pwaUpdateAvailableEvent } from "@/pwa";

export function usePwaUpdate() {
  const registration = ref<ServiceWorkerRegistration | null>(null);

  function handleUpdateAvailable(event: Event) {
    const detail = (event as CustomEvent<{ registration?: ServiceWorkerRegistration }>).detail;
    registration.value = detail.registration ?? null;
  }
  function dismiss() { registration.value = null; }
  function apply() {
    const waitingWorker = registration.value?.waiting;
    if (!waitingWorker || !("serviceWorker" in navigator)) { window.location.reload(); return; }
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  onMounted(() => window.addEventListener(pwaUpdateAvailableEvent, handleUpdateAvailable));
  onBeforeUnmount(() => window.removeEventListener(pwaUpdateAvailableEvent, handleUpdateAvailable));

  return { apply, dismiss, registration };
}
