import { onBeforeUnmount, onMounted } from "vue";

type Options = {
  cloudConfigured: boolean;
  fitWorkbench: () => void;
  handleKeydown: (event: KeyboardEvent) => void;
  handleViewportChange: () => void;
  restoreGuide: () => void;
  startCloudAuth: () => void;
};

export function useWorkbenchWindowLifecycle(options: Options) {
  let cloudStartupTimer: number | null = null;

  onMounted(() => {
    options.fitWorkbench();
    window.addEventListener("keydown", options.handleKeydown);
    window.addEventListener("resize", options.handleViewportChange);
    window.visualViewport?.addEventListener("resize", options.handleViewportChange);
    window.screen.orientation?.addEventListener("change", options.handleViewportChange);
    options.restoreGuide();
    if (options.cloudConfigured) {
      cloudStartupTimer = window.setTimeout(() => {
        cloudStartupTimer = null;
        options.startCloudAuth();
      }, 500);
    }
  });

  onBeforeUnmount(() => {
    if (cloudStartupTimer !== null) window.clearTimeout(cloudStartupTimer);
    cloudStartupTimer = null;
    window.removeEventListener("keydown", options.handleKeydown);
    window.removeEventListener("resize", options.handleViewportChange);
    window.visualViewport?.removeEventListener("resize", options.handleViewportChange);
    window.screen.orientation?.removeEventListener("change", options.handleViewportChange);
  });
}
