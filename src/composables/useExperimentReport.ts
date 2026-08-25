import { ref, type ComputedRef, type Ref } from "vue";
import type { CircuitPart, CircuitSimulation, Wire } from "@/lib/circuit";
import { formatExperimentReportMarkdown } from "@/lib/experiment-report";

type LessonStep = { complete: boolean; description: string };

export function useExperimentReport(options: {
  activeLesson: ComputedRef<{ objective: string; title: string }>;
  lessonStepStates: ComputedRef<LessonStep[]>;
  parts: Ref<CircuitPart[]>;
  simulation: ComputedRef<CircuitSimulation>;
  wires: Ref<Wire[]>;
}) {
  const copyState = ref<"copied" | "idle" | "manual">("idle");
  let copyFeedbackTimer: number | null = null;

  function currentMarkdown() {
    return formatExperimentReportMarkdown({
      generatedAt: new Date().toISOString(),
      lessonObjective: options.activeLesson.value.objective,
      lessonSteps: options.lessonStepStates.value,
      lessonTitle: options.activeLesson.value.title,
      parts: options.parts.value,
      simulation: options.simulation.value,
      wires: options.wires.value,
    });
  }

  function showCopyFeedback(state: "copied" | "manual") {
    copyState.value = state;
    if (copyFeedbackTimer !== null) window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = window.setTimeout(() => {
      copyState.value = "idle";
      copyFeedbackTimer = null;
    }, state === "copied" ? 1800 : 3600);
  }

  async function copy() {
    if (typeof window === "undefined") return;
    const markdown = currentMarkdown();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(markdown);
      showCopyFeedback("copied");
    } catch {
      showCopyFeedback("manual");
      window.prompt("浏览器没有允许自动复制，请手动复制这个实验报告：", markdown);
    }
  }

  function download() {
    if (typeof document === "undefined") return;
    const blob = new Blob([currentMarkdown()], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.download = `xshow-experiment-report-${new Date().toISOString().slice(0, 10)}.md`;
    link.href = objectUrl;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  function dispose() {
    if (copyFeedbackTimer !== null) window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
  }

  return { copy, copyState, currentMarkdown, dispose, download };
}
