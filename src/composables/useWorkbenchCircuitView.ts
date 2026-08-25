import { computed, type ComputedRef, type Ref } from "vue";
import { lessonCatalog, type Lesson } from "@/data/lessons";
import type { CircuitPart, CircuitSimulation } from "@/lib/circuit";
import type { useCircuitLessonChecks } from "@/composables/useCircuitLessonChecks";
import type { useCircuitStatusView } from "@/composables/useCircuitStatusView";

type CircuitStatus = ReturnType<typeof useCircuitStatusView>;
type LessonChecks = ReturnType<typeof useCircuitLessonChecks>;

type Options = {
  activeLessonId: Ref<string>;
  lessonChecks: LessonChecks;
  parts: Ref<CircuitPart[]>;
  simulation: ComputedRef<CircuitSimulation>;
  status: CircuitStatus;
};

export function useWorkbenchCircuitView(options: Options) {
  const { parts, simulation, status } = options;
  const {
    ammeterParts, ammeterStatus, bulbParts, buzzerParts, buzzerStatus, capacitorParts, capacitorStatus,
    diodeParts, diodeStatus, ledParts, ledStatus, litBulbParts, litLedParts, motorParts, motorStatus,
    twoBulbBrightnessValues, voltmeterParts, voltmeterStatus,
  } = status;

  const primaryBattery = computed(() => parts.value.find((part) => part.type === "battery"));
  const mainBulb = computed(() => parts.value.find((part) => part.type === "bulb"));
  const mainBulbBrightness = computed(() => mainBulb.value ? simulation.value.bulbs[mainBulb.value.id]?.brightness ?? 0 : 0);
  const ledWarnings = computed(() => Object.values(simulation.value.leds).filter((state) => state.overCurrent || state.reversed));
  const diodeWarnings = computed(() => Object.values(simulation.value.diodes).filter((state) => state.overCurrent || state.reversed));
  const hasBuzzerParts = computed(() => parts.value.some((part) => part.type === "buzzer"));
  const activeBuzzerCount = computed(() => Object.values(simulation.value.buzzers).filter((state) => state.active).length);
  const hasMotorParts = computed(() => parts.value.some((part) => part.type === "motor"));
  const activeMotorCount = computed(() => Object.values(simulation.value.motors).filter((state) => state.active).length);
  const activeAmmeterCount = computed(() => Object.values(simulation.value.ammeters).filter((state) => state.active).length);
  const activeVoltmeterCount = computed(() => Object.values(simulation.value.voltmeters).filter((state) => state.active).length);
  const currentVisualStrength = computed(() => Math.min(1, simulation.value.currentMilliAmps / 180));
  const activeLesson = computed<Lesson>(() => lessonCatalog.find((lesson) => lesson.id === options.activeLessonId.value) ?? lessonCatalog[0]);
  const lessonStepStates = computed(() => activeLesson.value.steps.map((step) => ({ ...step, complete: options.lessonChecks.lessonCheckers[step.checkId]() })));
  const nextLessonStep = computed(() => lessonStepStates.value.find((step) => !step.complete));
  const activeLessonGuide = computed(() => nextLessonStep.value?.guide ?? null);
  const mobileLessonStripText = computed(() => nextLessonStep.value?.description ?? "实验完成");
  const lessonProgress = computed(() => {
    const completed = lessonStepStates.value.filter((step) => step.complete).length;
    const total = lessonStepStates.value.length;
    return { completed, percent: total === 0 ? 0 : Math.round((completed / total) * 100), total };
  });
  const lessonComplete = computed(() => lessonProgress.value.total > 0 && lessonProgress.value.percent === 100);

  return {
    activeAmmeterCount, activeBuzzerCount, activeLesson, activeLessonGuide, activeMotorCount, activeVoltmeterCount,
    currentVisualStrength, diodeWarnings, hasBuzzerParts, hasMotorParts, ledWarnings, lessonComplete, lessonProgress,
    lessonStepStates, mobileLessonStripText, nextLessonStep, primaryBattery,
  };
}
