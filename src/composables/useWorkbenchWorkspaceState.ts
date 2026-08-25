import type { ComputedRef, Ref } from "vue";
import type { LessonWorkspace } from "@/data/lessons";
import type { CircuitPart, Wire } from "@/lib/circuit";
import type { PersistedWorkspace } from "@/lib/workspace-records";

type Options = {
  activeLessonId: Ref<string>;
  clearInteractionState: () => void;
  fitWorkbenchAfterLoad: (behavior?: ScrollBehavior, resetLayout?: boolean) => void;
  isKnownLesson: (lessonId: string) => boolean;
  mobileStarterWorkspace: (workspace: LessonWorkspace) => LessonWorkspace;
  parts: Ref<CircuitPart[]>;
  selectedPartId: Ref<string>;
  setZoom: (zoom: number) => void;
  snapBoundRelayAssemblies: () => void;
  wires: Ref<Wire[]>;
  zoom: ComputedRef<number>;
};

export function useWorkbenchWorkspaceState(options: Options) {
  function loadWorkspace(workspace: LessonWorkspace, settings: { adaptMobileStarterLayout?: boolean; resetMobileLayout?: boolean } = {}) {
    const nextWorkspace = settings.adaptMobileStarterLayout ? options.mobileStarterWorkspace(workspace) : workspace;
    options.parts.value = nextWorkspace.parts.map((part) => ({ ...part }));
    options.snapBoundRelayAssemblies();
    options.wires.value = nextWorkspace.wires.map((wire) => ({
      ...wire,
      from: { ...wire.from },
      to: { ...wire.to },
    }));
    options.selectedPartId.value = nextWorkspace.selectedPartId;
    options.clearInteractionState();
    options.setZoom(nextWorkspace.zoom);
    options.fitWorkbenchAfterLoad("auto", settings.resetMobileLayout ?? true);
  }

  function workspaceSnapshot(savedAt = new Date().toISOString()): PersistedWorkspace {
    return {
      activeLessonId: options.activeLessonId.value,
      parts: options.parts.value.map((part) => ({ ...part })),
      savedAt,
      selectedPartId: options.selectedPartId.value,
      version: 1,
      wires: options.wires.value.map((wire) => ({ ...wire, from: { ...wire.from }, to: { ...wire.to } })),
      zoom: options.zoom.value,
    };
  }

  function workspaceHistoryKey(workspace: PersistedWorkspace) {
    return JSON.stringify({
      activeLessonId: workspace.activeLessonId,
      parts: workspace.parts,
      selectedPartId: workspace.selectedPartId,
      wires: workspace.wires,
      zoom: workspace.zoom,
    });
  }

  function loadWorkspaceSnapshot(workspace: PersistedWorkspace) {
    options.activeLessonId.value = options.isKnownLesson(workspace.activeLessonId) ? workspace.activeLessonId : "open-the-circuit";
    loadWorkspace(workspace);
    return workspace.savedAt;
  }

  return { loadWorkspace, loadWorkspaceSnapshot, workspaceHistoryKey, workspaceSnapshot };
}
