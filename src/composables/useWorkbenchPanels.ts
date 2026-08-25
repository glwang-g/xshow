import { ref, watch, type ComputedRef, type Ref } from "vue";
import type { StatusPanelTab } from "@/lib/workbench-ui";

type Options = { activeLessonId: Ref<string>; lessonComplete: ComputedRef<boolean> };

export function useWorkbenchPanels(options: Options) {
  const palettePanelOpen = ref(false);
  const statusPanelOpen = ref(false);
  const statusPanelTab = ref<StatusPanelTab>("lesson");
  const lessonCompletePanelOpen = ref(false);
  const dismissedLessonCompletionId = ref<string | null>(null);

  function openMobileStatusPanel(tab: StatusPanelTab = statusPanelTab.value) {
    statusPanelTab.value = tab;
    statusPanelOpen.value = true;
    palettePanelOpen.value = false;
  }
  function closeLessonCompletePanel() {
    dismissedLessonCompletionId.value = options.activeLessonId.value;
    lessonCompletePanelOpen.value = false;
  }

  watch([options.lessonComplete, options.activeLessonId], ([complete]) => {
    if (complete && dismissedLessonCompletionId.value !== options.activeLessonId.value) {
      lessonCompletePanelOpen.value = true;
      return;
    }
    if (!complete && dismissedLessonCompletionId.value === options.activeLessonId.value) dismissedLessonCompletionId.value = null;
    lessonCompletePanelOpen.value = false;
  }, { immediate: true });

  return { closeLessonCompletePanel, dismissedLessonCompletionId, lessonCompletePanelOpen, openMobileStatusPanel, palettePanelOpen, statusPanelOpen, statusPanelTab };
}
