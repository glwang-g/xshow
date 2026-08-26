import type { ComputedRef, Ref } from "vue";
import { lessonCatalog, type LessonWorkspace } from "@/data/lessons";
import { loadPublishedRelayModules } from "@/lib/published-modules";
import type { StatusPanelTab } from "@/lib/workbench-ui";

type Options = {
  activeLesson: ComputedRef<{ id: string }>;
  activeLessonId: Ref<string>;
  dismissLessonCompletion: () => void;
  loadWorkspace: (workspace: LessonWorkspace, options?: { adaptMobileStarterLayout?: boolean }) => void;
  pushHistory: () => void;
  setStatusTab: (tab: StatusPanelTab) => void;
  setWorkshopCompletion: (open: boolean) => void;
};

export function useWorkbenchNavigation(options: Options) {
  function loadLessonWorkspace(lessonId = options.activeLesson.value.id) {
    const lesson = lessonCatalog.find((item) => item.id === lessonId) ?? lessonCatalog[0];
    options.pushHistory();
    options.activeLessonId.value = lesson.id;
    options.loadWorkspace(lesson.starterWorkspace, { adaptMobileStarterLayout: true });
  }

  function loadPublishedModuleFromRoute(moduleId: string, view: "core" | "verification" = "core") {
    if (!moduleId) return false;
    const module = loadPublishedRelayModules().find((item) => item.id === moduleId);
    if (!module) return false;
    options.pushHistory();
    options.activeLessonId.value = lessonCatalog.some((lesson) => lesson.id === module.verification?.lessonId)
      ? module.verification?.lessonId as string
      : "build-a-relay";
    const sourceWorkspace = module.implementation.sourceWorkspace;
    const workspace = view === "verification" ? sourceWorkspace : undefined;
    const modulePart = {
      id: `module-${module.id}`,
      moduleContactMode: module.behavior.contactMode,
      moduleId: module.id,
      name: module.name,
      type: "module" as const,
      x: 240,
      y: 160,
    };
    options.loadWorkspace({
      parts: workspace?.parts ?? [modulePart],
      selectedPartId: workspace ? module.implementation.springId : modulePart.id,
      wires: workspace?.wires ?? module.implementation.wires,
      zoom: 100,
    }, { adaptMobileStarterLayout: true });
    options.setStatusTab("selection");
    return true;
  }

  function loadWorkbenchMode(mode: "free" | "workshop", moduleId = "", view: "core" | "verification" = "core") {
    if (mode === "workshop" && loadPublishedModuleFromRoute(moduleId, view)) {
      options.setWorkshopCompletion(false);
      options.dismissLessonCompletion();
      return;
    }
    options.setStatusTab("lesson");
    options.setWorkshopCompletion(false);
    options.dismissLessonCompletion();
    loadLessonWorkspace(mode === "workshop" ? "build-a-relay" : "open-the-circuit");
  }

  function loadNextLesson() {
    const currentIndex = lessonCatalog.findIndex((lesson) => lesson.id === options.activeLesson.value.id);
    const nextLesson = lessonCatalog[(currentIndex + 1) % lessonCatalog.length] ?? lessonCatalog[0];
    options.dismissLessonCompletion();
    options.setWorkshopCompletion(false);
    loadLessonWorkspace(nextLesson.id);
  }

  function resetDemo() {
    const demoLesson = lessonCatalog.find((lesson) => lesson.id === "open-the-circuit") ?? lessonCatalog[0];
    options.pushHistory();
    options.loadWorkspace({ ...demoLesson.starterWorkspace, selectedPartId: "bulb-1" }, { adaptMobileStarterLayout: true });
  }

  return { loadLessonWorkspace, loadNextLesson, loadWorkbenchMode, resetDemo };
}
