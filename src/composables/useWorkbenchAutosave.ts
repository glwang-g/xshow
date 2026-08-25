import { onBeforeUnmount, watch, type Ref } from "vue";

type Options = {
  activeLessonId: Ref<string>;
  loadDefaultWorkspace: () => void;
  markCloudChanged: () => void;
  parts: Ref<unknown>;
  restoreAutoSavedWorkspace: () => boolean;
  restoreWorkspaceFromUrl: () => boolean;
  saveWorkspaceToStorage: () => void;
  selectedPartId: Ref<string>;
  wires: Ref<unknown>;
  zoom: () => number;
};

export function useWorkbenchAutosave(options: Options) {
  let autosaveTimer: number | null = null;

  function scheduleWorkspaceSave() {
    if (typeof window === "undefined") return;
    options.markCloudChanged();
    if (autosaveTimer !== null) window.clearTimeout(autosaveTimer);
    autosaveTimer = window.setTimeout(() => {
      autosaveTimer = null;
      options.saveWorkspaceToStorage();
    }, 220);
  }

  function restoreInitialWorkspace() {
    const restored = options.restoreWorkspaceFromUrl() || options.restoreAutoSavedWorkspace();
    if (!restored) options.loadDefaultWorkspace();
    return restored;
  }

  watch([options.parts, options.wires, options.selectedPartId, options.activeLessonId, options.zoom], scheduleWorkspaceSave, { deep: true });

  onBeforeUnmount(() => {
    if (autosaveTimer !== null) window.clearTimeout(autosaveTimer);
    autosaveTimer = null;
  });

  return { restoreInitialWorkspace, scheduleWorkspaceSave };
}
