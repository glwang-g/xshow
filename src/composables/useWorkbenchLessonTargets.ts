import type { ComputedRef } from "vue";
import type { CircuitPart, TerminalKey } from "@/lib/circuit";
import type { LessonGuide } from "@/data/lessons";

export function useWorkbenchLessonTargets(activeLessonGuide: ComputedRef<LessonGuide | null>) {
  function isLessonTerminalTarget(part: CircuitPart, terminal: TerminalKey) {
    return Boolean(activeLessonGuide.value?.terminalRefs?.some((ref) => ref.partId === part.id && ref.terminal === terminal));
  }
  function isLessonPartTarget(part: CircuitPart) {
    return Boolean(activeLessonGuide.value?.partIds?.includes(part.id) || activeLessonGuide.value?.terminalRefs?.some((ref) => ref.partId === part.id));
  }
  return { isLessonPartTarget, isLessonTerminalTarget };
}
