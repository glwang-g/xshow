import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { CircuitPart, CircuitSimulation, TerminalRef, Wire } from "@/lib/circuit";
import type { StatusPanelTab } from "@/lib/workbench-ui";

export type BeginnerGuideStepId = "parts" | "wire" | "switch";
export type BeginnerGuideStep = {
  actionLabel: string;
  description: string;
  id: BeginnerGuideStepId;
  title: string;
};
export type GuideAssistantMode = "diagnosis" | "menu" | "steps" | "wire";
export type GuideDiagnosisAction = "none" | "status" | "switch" | "wire";
export type GuideDiagnosis = {
  action: GuideDiagnosisAction;
  actionLabel: string;
  description: string;
  title: string;
};

type Options = {
  guideDismissedKey: string;
  mainBulb: ComputedRef<CircuitPart | undefined>;
  mainBulbBrightness: ComputedRef<number>;
  ledParts: () => CircuitPart[];
  ledStatus: (part: CircuitPart) => { reversed: boolean };
  loadExample: () => void;
  openStatusPanel: (tab?: StatusPanelTab) => void;
  parts: Ref<CircuitPart[]>;
  resetLayout: () => void;
  selectedPartId: Ref<string>;
  selectedTerminal: Ref<TerminalRef | null>;
  selectedWireId: Ref<string | null>;
  simulation: ComputedRef<CircuitSimulation>;
  setPanels: (panels: { paletteOpen: boolean; statusOpen: boolean }) => void;
};

const beginnerGuideSteps: BeginnerGuideStep[] = [
  { id: "parts", title: "先选一个元器件", description: "从元器件面板点一下电池、开关或灯泡，工作台会自动放上去。", actionLabel: "打开元器件" },
  { id: "wire", title: "拖动圆点就能连线", description: "按住元器件旁边的圆形端子，拖到另一个端子上松手，就能接出一根导线。", actionLabel: "高亮端子" },
  { id: "switch", title: "点开关看结果", description: "电路接通后，点击开关，灯泡、导线动画和状态面板会一起变化。", actionLabel: "找到开关" },
];

export function useBeginnerGuide(options: Options) {
  const guideAssistantOpen = ref(false);
  const guideAssistantMode = ref<GuideAssistantMode>("menu");
  const beginnerGuideStepIndex = ref(0);

  const beginnerGuideStep = computed(() => beginnerGuideSteps[beginnerGuideStepIndex.value] ?? beginnerGuideSteps[0]);
  const guideDiagnosis = computed<GuideDiagnosis>(() => {
    const openSwitch = options.parts.value.find((part) => part.type === "switch" && !part.closed);
    if (openSwitch) return { action: "switch", actionLabel: "找到开关", title: "开关还没闭合", description: "先点一下开关，让电流有机会通过。开关闭合后，灯泡和导线动画会立刻变化。" };
    if (!options.simulation.value.closed) return { action: "wire", actionLabel: "高亮端子", title: "导线还没接成一圈", description: "从一个圆形端子拖到另一个端子，试着让电池、开关和灯泡连成一圈。" };
    const reversedLed = options.ledParts().find((part) => options.ledStatus(part).reversed);
    if (reversedLed) return { action: "status", actionLabel: "看属性", title: "LED 可能接反了", description: "LED 有正负极。选中 LED 后看属性面板，把正负方向调对，或者重新连接两端。" };
    if (options.mainBulb.value && options.mainBulbBrightness.value === 0) return { action: "status", actionLabel: "看状态", title: "灯泡还没有电流", description: "回路看起来接通了，但灯泡没有明显亮度。可以调小可变电阻，或检查灯泡两端是否接在线路里。" };
    if (options.simulation.value.closed) return { action: "status", actionLabel: "看状态", title: "电路已经接通", description: "现在可以试试调电阻、反转电池，或者换成 LED、电机和蜂鸣器观察差异。" };
    return { action: "none", actionLabel: "知道了", title: "先从一根线开始", description: "按住元器件旁边的圆点，拖到另一个圆点上松手，就能连出第一根导线。" };
  });

  function remember(value: "opened" | "dismissed") {
    if (typeof window !== "undefined") window.localStorage.setItem(options.guideDismissedKey, value);
  }
  function openGuideAssistant(mode: GuideAssistantMode = "menu") { guideAssistantMode.value = mode; guideAssistantOpen.value = true; remember("opened"); }
  function dismissGuideAssistant() { guideAssistantOpen.value = false; remember("dismissed"); }
  function startBeginnerGuide(stepIndex = 0) { beginnerGuideStepIndex.value = Math.min(beginnerGuideSteps.length - 1, Math.max(0, stepIndex)); openGuideAssistant("steps"); }
  function handleGuidePartsAction() { options.setPanels({ paletteOpen: true, statusOpen: false }); }
  function handleGuideWireAction() {
    options.selectedPartId.value = "battery-1";
    options.selectedWireId.value = null;
    options.selectedTerminal.value = { partId: "battery-1", terminal: "b" };
    options.setPanels({ paletteOpen: false, statusOpen: false });
  }
  function handleGuideSwitchAction() {
    options.selectedPartId.value = "switch-1";
    options.selectedWireId.value = null;
    options.selectedTerminal.value = null;
    options.setPanels({ paletteOpen: false, statusOpen: false });
  }
  function showWireGuide() { beginnerGuideStepIndex.value = 1; handleGuideWireAction(); openGuideAssistant("wire"); }
  function showGuideDiagnosis() { openGuideAssistant("diagnosis"); }
  function nextBeginnerGuideStep() {
    if (beginnerGuideStepIndex.value >= beginnerGuideSteps.length - 1) { dismissGuideAssistant(); return; }
    beginnerGuideStepIndex.value += 1;
  }
  function handleBeginnerGuideAction() {
    if (beginnerGuideStep.value.id === "parts") handleGuidePartsAction();
    else if (beginnerGuideStep.value.id === "wire") handleGuideWireAction();
    else handleGuideSwitchAction();
  }
  function handleGuideDiagnosisAction() {
    const action = guideDiagnosis.value.action;
    if (action === "switch") handleGuideSwitchAction();
    else if (action === "wire") showWireGuide();
    else if (action === "status") options.openStatusPanel("circuit");
  }
  function handleWireAdded() {
    if (guideAssistantOpen.value && (guideAssistantMode.value === "steps" || guideAssistantMode.value === "wire") && beginnerGuideStep.value.id === "wire") {
      beginnerGuideStepIndex.value = 2;
      guideAssistantMode.value = "steps";
    }
  }
  function resetLayoutFromGuide() { options.resetLayout(); guideAssistantOpen.value = false; }
  function loadExampleFromGuide() { options.loadExample(); guideAssistantOpen.value = false; }
  function restoreInitialState() {
    if (typeof window !== "undefined" && !window.localStorage.getItem(options.guideDismissedKey)) {
      guideAssistantOpen.value = true;
      guideAssistantMode.value = "menu";
    }
  }

  return {
    beginnerGuideStep, beginnerGuideStepIndex, beginnerGuideTotal: beginnerGuideSteps.length,
    guideAssistantMode, guideAssistantOpen, guideDiagnosis, handleBeginnerGuideAction,
    handleGuideDiagnosisAction, handleWireAdded, loadExampleFromGuide, nextBeginnerGuideStep,
    openGuideAssistant, resetLayoutFromGuide, restoreInitialState, showGuideDiagnosis,
    showWireGuide, startBeginnerGuide, dismissGuideAssistant,
  };
}
