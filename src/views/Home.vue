<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ComponentPalette from "@/components/workbench/ComponentPalette.vue";
import StatusPanel from "@/components/workbench/StatusPanel.vue";
import WorkbenchCanvas from "@/components/workbench/WorkbenchCanvas.vue";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader.vue";
import { useWorkbenchHistory } from "@/composables/useWorkbenchHistory";
import { lessonCatalog, type LessonCheckId, type LessonWorkspace } from "@/data/lessons";
import {
  batteryPolarity,
  batteryPositiveTerminal,
  evaluateCircuit,
  hasPath,
  sameTerminal,
  terminalId,
  type AmmeterState,
  type BuzzerState,
  type CapacitorState,
  type CircuitPart,
  type DiodeState,
  type LedState,
  type MotorState,
  type PartType,
  type TerminalKey,
  type TerminalRef,
  type VoltmeterState,
  type Wire,
  type WireEnd,
} from "@/lib/circuit";
import {
  cloudConfig,
  deleteCloudWorkspaceRecord,
  getCloudUser,
  listCloudWorkspaceRecords,
  onCloudAuthStateChange,
  renameCloudWorkspaceRecord,
  saveCloudWorkspaceRecord,
  sendPasswordResetEmail,
  signInWithEmailPassword,
  signOutCloud,
  signUpWithEmailPassword,
  updateCloudPassword,
  updateCloudWorkspaceRecord,
  type CloudWorkspaceRecord,
} from "@/lib/cloud";
import { getSpec, workbench, type StatusPanelTab } from "@/lib/workbench-ui";
import {
  type CloudAuthMode,
  type CloudSyncState,
  type CloudSyncStatus,
  type PersistedWorkspace,
  type SaveCloudWorkspaceOptions,
  type SavedWorkspaceRecord,
} from "@/lib/workspace-records";
import {
  base64UrlDecode,
  base64UrlEncode,
  formatSavedTime,
  isPersistedWorkspace,
  isSavedWorkspaceRecord,
} from "@/lib/workspace-codec";
import {
  createPhysicalBuildPlan,
  formatPhysicalBuildPlanMarkdown,
} from "@/lib/physical-build";
import { exportWorkbenchImage as exportWorkbenchImageFile } from "@/lib/workbench-export";
import { pwaUpdateAvailableEvent } from "@/pwa";
import { useBoardStore } from "@/stores/board";

type TerminalHit = {
  distance: number;
  position: {
    x: number;
    y: number;
  };
  ref: TerminalRef;
};

type Point = {
  x: number;
  y: number;
};

type CloudRecord = CloudWorkspaceRecord<PersistedWorkspace>;
const savedWorkspaceKey = "xshow.workspace.v1";
const savedRecordsKey = "xshow.workspace.records.v1";
const cloudUploadSuggestionKeyPrefix = "xshow.cloud.upload-suggestion.v1";
const maxEditorHistoryEntries = 40;
const workspaceShareParam = "workspace";
const githubRepositoryUrl = "https://github.com/glwang-g/xshow";
const mobileWorkbench = {
  width: 1600,
  height: 1200,
};
const board = useBoardStore();
const canvasViewportRef = ref<HTMLElement | null>(null);
const workbenchRef = ref<HTMLElement | null>(null);
const activeLessonId = ref(lessonCatalog[0].id);
const lastSavedAt = ref<string | null>(null);
const recordTitle = ref("");
const savedRecords = ref<SavedWorkspaceRecord[]>([]);
const shareLinkState = ref<"copied" | "idle" | "manual">("idle");
const buildPlanCopyState = ref<"copied" | "idle" | "manual">("idle");
const cloudAuthBusy = ref(false);
const cloudAuthError = ref("");
const cloudAuthMode = ref<CloudAuthMode>("sign-in");
const cloudAuthMessage = ref("");
const cloudEmail = ref("");
const cloudPassword = ref("");
const cloudPasswordConfirm = ref("");
const cloudRecordTitle = ref("");
const cloudRecords = ref<CloudRecord[]>([]);
const cloudRecordsBusy = ref(false);
const cloudRecordsError = ref("");
const cloudRecordsMessage = ref("");
const cloudPendingSnapshot = ref<PersistedWorkspace | null>(null);
const cloudPendingTitle = ref("");
const cloudShouldSuggestInitialUpload = ref(false);
const cloudSyncStatus = ref<CloudSyncStatus>("idle");
const cloudActiveRecordId = ref<string | null>(null);
const cloudLastSyncedAt = ref<string | null>(null);
const cloudUserEmail = ref<string | null>(null);
const sharedWorkspaceLoaded = ref(false);
const suppressCloudDirtyMark = ref(false);
const pwaUpdateRegistration = ref<ServiceWorkerRegistration | null>(null);
const palettePanelOpen = ref(false);
const statusPanelOpen = ref(false);
const statusPanelTab = ref<StatusPanelTab>("lesson");
const lessonCompletePanelOpen = ref(false);
const dismissedLessonCompletionId = ref<string | null>(null);
const hoveredWireId = ref<string | null>(null);
const hoveredEndpoint = ref<{ wireId: string; end: WireEnd } | null>(null);
const selectedTerminal = ref<TerminalRef | null>(null);
const selectedWireId = ref<string | null>(null);
const selectedPartId = ref("bulb-1");
const newWireDrag = ref<{ from: TerminalRef; moved: boolean; over: TerminalRef | null; x: number; y: number } | null>(
  null,
);
const suppressNextTerminalClick = ref(false);
const rewiring = ref<{ wireId: string; end: WireEnd } | null>(null);
const endpointDrag = ref<{ wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null } | null>(
  null,
);
const dragging = ref<{ id: string; offsetX: number; offsetY: number } | null>(null);
const viewportPointers = new Map<number, { x: number; y: number }>();
const viewportGesture = ref<
  | { mode: "pan"; lastX: number; lastY: number }
  | { distance: number; mode: "pinch"; zoom: number }
  | null
>(null);
const canvasViewportSize = ref({ height: workbench.height, width: workbench.width });

function updateCanvasViewportSize() {
  if (!canvasViewportRef.value) {
    return;
  }

  canvasViewportSize.value = {
    height: canvasViewportRef.value.clientHeight,
    width: canvasViewportRef.value.clientWidth,
  };
}

function setCanvasViewportElement(element: HTMLElement | null) {
  canvasViewportRef.value = element;
  updateCanvasViewportSize();
}

function setWorkbenchElement(element: HTMLElement | null) {
  workbenchRef.value = element;
}

const parts = ref<CircuitPart[]>([
  { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
  { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: true },
  { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
  { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance: 48 },
]);

const wires = ref<Wire[]>([
  {
    id: "wire-1",
    from: { partId: "battery-1", terminal: "b" },
    to: { partId: "switch-1", terminal: "a" },
  },
  {
    id: "wire-2",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-1", terminal: "a" },
  },
  {
    id: "wire-3",
    from: { partId: "bulb-1", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-4",
    from: { partId: "resistor-1", terminal: "a" },
    to: { partId: "battery-1", terminal: "a" },
  },
]);

const effectiveWorkbenchSize = computed(() => {
  if (isDesktopViewport()) {
    return { height: workbench.height, width: workbench.width };
  }

  const scale = board.zoom / 100;
  return {
    height: Math.ceil(Math.max(mobileWorkbench.height, canvasViewportSize.value.height / scale)),
    width: Math.ceil(Math.max(mobileWorkbench.width, canvasViewportSize.value.width / scale)),
  };
});

const selectedPart = computed(() => parts.value.find((part) => part.id === selectedPartId.value));
const selectedWire = computed(() => wires.value.find((wire) => wire.id === selectedWireId.value));
const renderedWires = computed(() => {
  if (!selectedWireId.value) {
    return wires.value;
  }

  return [
    ...wires.value.filter((wire) => wire.id !== selectedWireId.value),
    ...wires.value.filter((wire) => wire.id === selectedWireId.value),
  ];
});
const simulation = computed(() => evaluateCircuit(parts.value, wires.value));
const primaryBattery = computed(() => parts.value.find((part) => part.type === "battery"));
const mainBulb = computed(() => parts.value.find((part) => part.type === "bulb"));
const mainBulbBrightness = computed(() =>
  mainBulb.value ? simulation.value.bulbs[mainBulb.value.id]?.brightness ?? 0 : 0,
);
const ledWarnings = computed(() =>
  Object.values(simulation.value.leds).filter((state) => state.overCurrent || state.reversed),
);
const diodeWarnings = computed(() =>
  Object.values(simulation.value.diodes).filter((state) => state.overCurrent || state.reversed),
);
const hasBuzzerParts = computed(() => parts.value.some((part) => part.type === "buzzer"));
const activeBuzzerCount = computed(() => Object.values(simulation.value.buzzers).filter((state) => state.active).length);
const hasMotorParts = computed(() => parts.value.some((part) => part.type === "motor"));
const activeMotorCount = computed(() => Object.values(simulation.value.motors).filter((state) => state.active).length);
const activeAmmeterCount = computed(() => Object.values(simulation.value.ammeters).filter((state) => state.active).length);
const activeVoltmeterCount = computed(() => Object.values(simulation.value.voltmeters).filter((state) => state.active).length);
const currentVisualStrength = computed(() => Math.min(1, simulation.value.currentMilliAmps / 180));
const physicalBuildPlan = computed(() => createPhysicalBuildPlan(parts.value, wires.value));
const cloudSyncState = computed<CloudSyncState>(() => {
  if (!cloudConfig.configured) {
    return "unconfigured";
  }

  if (!cloudUserEmail.value) {
    return "configured";
  }

  if (cloudSyncStatus.value !== "idle") {
    return cloudSyncStatus.value;
  }

  return "signed-in";
});
const cloudSyncLabel = computed(() => {
  if (cloudSyncState.value === "unconfigured") {
    return "未配置";
  }

  if (cloudSyncState.value === "configured") {
    return "未登录";
  }

  if (cloudSyncState.value === "local-changes") {
    return "本地修改";
  }

  if (cloudSyncState.value === "syncing") {
    return "同步中";
  }

  if (cloudSyncState.value === "synced") {
    return "已同步";
  }

  if (cloudSyncState.value === "failed") {
    return "同步失败";
  }

  return "已登录";
});
const cloudSyncDescription = computed(() => {
  if (cloudSyncState.value === "unconfigured") {
    return "配置 Supabase 后可开启云端记录，本地玩法不受影响。";
  }

  if (cloudSyncState.value === "configured") {
    return "使用邮箱和密码登录后，可跨设备保存实验记录。";
  }

  if (cloudSyncState.value === "local-changes") {
    return "当前工作台已有本地修改，保存到云端后可在其他设备继续。";
  }

  if (cloudSyncState.value === "syncing") {
    return "正在和云端记录同步。";
  }

  if (cloudSyncState.value === "synced") {
    return cloudLastSyncedAt.value ? `最近同步：${formatSavedTime(cloudLastSyncedAt.value)}` : "当前工作台已保存到云端。";
  }

  if (cloudSyncState.value === "failed") {
    return "刚才的云端操作失败了，本地工作台仍会自动保存。";
  }

  return "可以保存到云端记录，并在其他设备登录后继续。";
});
const cloudSyncBadgeClass = computed(() => {
  if (cloudSyncState.value === "synced") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (cloudSyncState.value === "local-changes" || cloudSyncState.value === "syncing") {
    return "bg-amber-100 text-amber-900";
  }

  if (cloudSyncState.value === "signed-in") {
    return "bg-cyan-100 text-cyan-800";
  }

  if (cloudSyncState.value === "failed") {
    return "bg-rose-100 text-rose-800";
  }

  return cloudSyncState.value === "configured" ? "bg-cyan-100 text-cyan-800" : "bg-muted text-muted-foreground";
});
const activeCloudRecord = computed(() => cloudRecords.value.find((record) => record.id === cloudActiveRecordId.value));
const cloudAuthTitle = computed(() => {
  if (cloudAuthMode.value === "sign-up") {
    return "创建云端账号";
  }

  if (cloudAuthMode.value === "reset") {
    return "重置密码";
  }

  if (cloudAuthMode.value === "update-password") {
    return "设置新密码";
  }

  return "登录云端同步";
});
const cloudAuthSubmitLabel = computed(() => {
  if (cloudAuthBusy.value) {
    return "处理中";
  }

  if (cloudAuthMode.value === "sign-up") {
    return "注册并登录";
  }

  if (cloudAuthMode.value === "reset") {
    return "发送重置邮件";
  }

  if (cloudAuthMode.value === "update-password") {
    return "更新密码";
  }

  return "登录";
});
const cloudAuthHelpText = computed(() => {
  if (cloudAuthMode.value === "sign-up") {
    return "注册后 Supabase 可能会发送确认邮件；确认后即可用密码登录。";
  }

  if (cloudAuthMode.value === "reset") {
    return "输入账号邮箱，我们会发送一封密码重置邮件。";
  }

  if (cloudAuthMode.value === "update-password") {
    return "请输入新密码。更新后，下次就可以直接用邮箱和新密码登录。";
  }

  return "登录状态会保存在当前浏览器中，下次打开会自动恢复。";
});
const cloudSaveLabel = computed(() => {
  if (cloudRecordsBusy.value) {
    return "处理中";
  }

  return cloudActiveRecordId.value ? "更新云端" : "保存云端";
});
const currentAnimationDuration = computed(() => {
  if (!simulation.value.closed || simulation.value.currentMilliAmps <= 0) {
    return "1.6s";
  }

  const duration = Math.max(0.45, Math.min(1.8, 1.8 - simulation.value.currentMilliAmps / 160));
  return `${duration.toFixed(2)}s`;
});

function bulbParts() {
  return parts.value.filter((part) => part.type === "bulb");
}

function litBulbParts() {
  return bulbParts().filter((part) => (simulation.value.bulbs[part.id]?.brightness ?? 0) > 0);
}

function bulbBrightness(part: CircuitPart) {
  return simulation.value.bulbs[part.id]?.brightness ?? 0;
}

function twoBulbBrightnessValues() {
  return bulbParts().slice(0, 2).map((part) => bulbBrightness(part));
}

function ledParts() {
  return parts.value.filter((part) => part.type === "led");
}

function litLedParts() {
  return ledParts().filter((part) => (simulation.value.leds[part.id]?.brightness ?? 0) > 0);
}

function ledStatus(part: CircuitPart): LedState {
  return (
    simulation.value.leds[part.id] ?? {
      brightness: 0,
      brightnessPercent: 0,
      forward: false,
      overCurrent: false,
      reversed: false,
    }
  );
}

function diodeStatus(part: CircuitPart): DiodeState {
  return (
    simulation.value.diodes[part.id] ?? {
      conducting: false,
      forward: false,
      overCurrent: false,
      reversed: false,
    }
  );
}

function capacitorStatus(part: CircuitPart): CapacitorState {
  return (
    simulation.value.capacitors[part.id] ?? {
      chargePercent: 0,
      charging: false,
      connected: false,
      voltage: 0,
    }
  );
}

function ammeterStatus(part: CircuitPart): AmmeterState {
  return (
    simulation.value.ammeters[part.id] ?? {
      active: false,
      currentMilliAmps: 0,
    }
  );
}

function voltmeterStatus(part: CircuitPart): VoltmeterState {
  return (
    simulation.value.voltmeters[part.id] ?? {
      active: false,
      voltage: 0,
    }
  );
}

function buzzerStatus(part: CircuitPart): BuzzerState {
  return (
    simulation.value.buzzers[part.id] ?? {
      active: false,
      volume: 0,
      volumePercent: 0,
    }
  );
}

function motorStatus(part: CircuitPart): MotorState {
  return (
    simulation.value.motors[part.id] ?? {
      active: false,
      speed: 0,
      speedPercent: 0,
    }
  );
}

function hasWireBetween(left: TerminalRef, right: TerminalRef) {
  return wires.value.some(
    (wire) =>
      (sameTerminal(wire.from, left) && sameTerminal(wire.to, right)) ||
      (sameTerminal(wire.from, right) && sameTerminal(wire.to, left)),
  );
}

function hasWirePathBetween(left: TerminalRef, right: TerminalRef) {
  const graph = new Map<string, string[]>();

  for (const wire of wires.value) {
    const from = terminalId(wire.from);
    const to = terminalId(wire.to);
    graph.set(from, [...(graph.get(from) ?? []), to]);
    graph.set(to, [...(graph.get(to) ?? []), from]);
  }

  return hasPath(terminalId(left), terminalId(right), Array.from(graph.entries()).flatMap(([from, targets]) =>
    targets.map((to) => ({ from, to })),
  ));
}

function hasSeriesBulbRoute() {
  const bulbs = bulbParts();
  if (bulbs.length < 2) {
    return false;
  }

  return bulbs.some((left) =>
    bulbs.some(
      (right) =>
        left.id !== right.id &&
        (hasWireBetween(
          { partId: left.id, terminal: "b" },
          { partId: right.id, terminal: "a" },
        ) ||
          hasWireBetween(
            { partId: left.id, terminal: "a" },
            { partId: right.id, terminal: "b" },
          )),
    ),
  );
}

function hasParallelBulbRoute() {
  const bulbs = bulbParts();
  if (bulbs.length < 2) {
    return false;
  }

  return bulbs.some((left) =>
    bulbs.some(
      (right) =>
        left.id !== right.id &&
        ((hasWirePathBetween(
          { partId: left.id, terminal: "a" },
          { partId: right.id, terminal: "a" },
        ) &&
          hasWirePathBetween(
            { partId: left.id, terminal: "b" },
            { partId: right.id, terminal: "b" },
          )) ||
          (hasWirePathBetween(
            { partId: left.id, terminal: "a" },
            { partId: right.id, terminal: "b" },
          ) &&
            hasWirePathBetween(
              { partId: left.id, terminal: "b" },
              { partId: right.id, terminal: "a" },
            ))),
    ),
  );
}

const lessonCheckers: Record<LessonCheckId, () => boolean> = {
  hasAdjustedResistor: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) !== 48),
  hasBrightBulb: () => mainBulbBrightness.value >= 0.4,
  hasBrightParallelBulbs: () =>
    hasParallelBulbRoute() &&
    twoBulbBrightnessValues().length >= 2 &&
    twoBulbBrightnessValues().every((brightness) => brightness >= 0.24),
  hasClosedCircuit: () => simulation.value.closed,
  hasClosedSwitch: () => parts.value.some((part) => part.type === "switch" && part.closed),
  hasDarkBulb: () => mainBulbBrightness.value === 0,
  hasDimSeriesBulbs: () =>
    hasSeriesBulbRoute() &&
    twoBulbBrightnessValues().length >= 2 &&
    twoBulbBrightnessValues().every((brightness) => brightness > 0 && brightness <= 0.32),
  hasForwardLed: () => ledParts().some((part) => ledStatus(part).forward),
  hasLedParts: () =>
    ["battery", "switch", "resistor", "led"].every((type) => parts.value.some((part) => part.type === type)),
  hasLitLed: () => litLedParts().length > 0,
  hasLitBulb: () => mainBulbBrightness.value > 0,
  hasLowResistance: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) <= 24),
  hasOpenCircuit: () => !simulation.value.closed,
  hasOpenSwitch: () => parts.value.some((part) => part.type === "switch" && !part.closed),
  hasParallelBulbs: () => simulation.value.closed && hasParallelBulbRoute(),
  hasSafeLedCurrent: () => ledParts().some((part) => {
    const state = ledStatus(part);
    return state.brightness > 0 && !state.overCurrent;
  }),
  hasSeriesBulbs: () => simulation.value.closed && hasSeriesBulbRoute(),
  hasStarterParts: () =>
    ["battery", "switch", "bulb", "resistor"].every((type) => parts.value.some((part) => part.type === type)),
  hasTwoBulbs: () => bulbParts().length >= 2,
  hasTwoLitBulbs: () => litBulbParts().length >= 2,
};
const activeLesson = computed(() => lessonCatalog.find((lesson) => lesson.id === activeLessonId.value) ?? lessonCatalog[0]);
const lessonStepStates = computed(() =>
  activeLesson.value.steps.map((step) => ({
    ...step,
    complete: lessonCheckers[step.checkId](),
  })),
);
const nextLessonStep = computed(() => lessonStepStates.value.find((step) => !step.complete));
const activeLessonGuide = computed(() => nextLessonStep.value?.guide ?? null);
const mobileLessonStripText = computed(() => nextLessonStep.value?.description ?? "实验完成");
const lessonProgress = computed(() => {
  const completed = lessonStepStates.value.filter((step) => step.complete).length;
  const total = lessonStepStates.value.length;
  return {
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  };
});
const lessonComplete = computed(() => lessonProgress.value.total > 0 && lessonProgress.value.percent === 100);
const savedWorkspaceLabel = computed(() => {
  if (!lastSavedAt.value) {
    return "自动保存已开启";
  }

  return `已保存 ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastSavedAt.value))}`;
});
const {
  pushHistory: pushEditorHistory,
  redo: redoWorkspaceChange,
  undo: undoWorkspaceChange,
} = useWorkbenchHistory<PersistedWorkspace>({
  maxEntries: maxEditorHistoryEntries,
  restoreSnapshot: loadWorkspaceSnapshot,
  saveSnapshot: saveWorkspaceToStorage,
  snapshotKey: workspaceHistoryKey,
  takeSnapshot: workspaceSnapshot,
});

let autosaveTimer: number | null = null;
let buildPlanCopyFeedbackTimer: number | null = null;
let cloudAuthUnsubscribe: (() => void) | null = null;
let shareLinkFeedbackTimer: number | null = null;

function clearInteractionState() {
  selectedTerminal.value = null;
  selectedWireId.value = null;
  hoveredWireId.value = null;
  hoveredEndpoint.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
  newWireDrag.value = null;
  suppressNextTerminalClick.value = false;
  dragging.value = null;
}

function clearSelection() {
  clearInteractionState();
  selectedPartId.value = "";
}

function hasTransientInteraction() {
  return Boolean(
    dragging.value ||
      endpointDrag.value ||
      newWireDrag.value ||
      rewiring.value ||
      selectedTerminal.value ||
      hoveredEndpoint.value ||
      hoveredWireId.value,
  );
}

function batteryPolarityLabel(part: CircuitPart) {
  return batteryPositiveTerminal(part) === "a" ? "正极在左侧" : "正极在右侧";
}

function terminalDisplayLabel(part: CircuitPart, terminal: TerminalKey) {
  if (part.type === "battery") {
    return batteryPositiveTerminal(part) === terminal ? "+" : "-";
  }

  return getSpec(part).terminals[terminal].label;
}

function getPart(partId: string) {
  return parts.value.find((part) => part.id === partId);
}

function getTerminalPosition(ref: TerminalRef) {
  const part = getPart(ref.partId);
  if (!part) {
    return { x: 0, y: 0 };
  }

  const offset = getSpec(part).terminals[ref.terminal];
  return {
    x: part.x + offset.x,
    y: part.y + offset.y,
  };
}

function terminalStyle(part: CircuitPart, terminal: TerminalKey) {
  const offset = getSpec(part).terminals[terminal];
  return {
    left: `${offset.x - 16}px`,
    top: `${offset.y - 16}px`,
  };
}

function partStyle(part: CircuitPart) {
  const spec = getSpec(part);
  return {
    left: `${part.x}px`,
    top: `${part.y}px`,
    width: `${spec.width}px`,
    height: `${spec.height}px`,
  };
}

function wireEndpointPosition(wire: Wire, end: WireEnd) {
  if (endpointDrag.value?.wireId === wire.id && endpointDrag.value.end === end) {
    return {
      x: endpointDrag.value.x,
      y: endpointDrag.value.y,
    };
  }

  return getTerminalPosition(wire[end]);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function workbenchLimitWidth() {
  return effectiveWorkbenchSize.value.width;
}

function workbenchLimitHeight() {
  return effectiveWorkbenchSize.value.height;
}

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;
}

function mobileFitZoom() {
  const viewport = canvasViewportRef.value;
  if (!viewport) {
    return 72;
  }

  const horizontalPadding = 24;
  const bottomControlsSpace = 112;
  const availableWidth = Math.max(280, viewport.clientWidth - horizontalPadding);
  const availableHeight = Math.max(260, viewport.clientHeight - bottomControlsSpace);
  return Math.floor(Math.min(availableWidth / workbench.width, availableHeight / workbench.height) * 92);
}

function fitMobileWorkbench(behavior: ScrollBehavior = "auto") {
  if (typeof window === "undefined" || isDesktopViewport() || !canvasViewportRef.value) {
    return;
  }

  updateCanvasViewportSize();
  board.setZoom(mobileFitZoom());
  window.requestAnimationFrame(() => {
    canvasViewportRef.value?.scrollTo({
      behavior,
      left: 0,
      top: 0,
    });
  });
}

function fitMobileWorkbenchAfterRender(behavior: ScrollBehavior = "auto") {
  if (typeof window === "undefined" || isDesktopViewport()) {
    return;
  }

  nextTick(() => {
    window.requestAnimationFrame(() => fitMobileWorkbench(behavior));
  });
}

function resetMobileView() {
  if (isDesktopViewport()) {
    board.setZoom(86);
    return;
  }

  fitMobileWorkbench("smooth");
}

function exportWorkbenchImage() {
  exportWorkbenchImageFile({
    activeLessonTitle: activeLesson.value.title,
    ammeterStatus,
    buzzerStatus,
    capacitorStatus,
    diodeStatus,
    ledStatus,
    motorStatus,
    parts: parts.value,
    selectedPartId: selectedPartId.value,
    simulation: simulation.value,
    voltmeterStatus,
    wirePath,
    wireStroke,
    wireStrokeWidth,
    wires: wires.value,
  });
}

function viewportPointerDistance() {
  const pointers = Array.from(viewportPointers.values());
  if (pointers.length < 2) {
    return 0;
  }

  return Math.hypot(pointers[0].x - pointers[1].x, pointers[0].y - pointers[1].y);
}

function isCircuitInteractionTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-circuit-interactive='true'], button, a, input, select, textarea"))
  );
}

function handleCanvasPointerDown(event: PointerEvent) {
  if (isDesktopViewport()) {
    return;
  }

  if (viewportPointers.size === 0 && isCircuitInteractionTarget(event.target)) {
    viewportGesture.value = null;
    return;
  }

  viewportPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);

  if (viewportPointers.size >= 2) {
    viewportGesture.value = {
      distance: viewportPointerDistance(),
      mode: "pinch",
      zoom: board.zoom,
    };
    event.preventDefault();
    return;
  }

  viewportGesture.value = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
  event.preventDefault();
}

function handleCanvasPointerMove(event: PointerEvent) {
  if (isDesktopViewport() || !viewportPointers.has(event.pointerId)) {
    return;
  }

  viewportPointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (viewportPointers.size >= 2) {
    const gesture = viewportGesture.value;
    const distance = viewportPointerDistance();

    if (gesture?.mode === "pinch" && gesture.distance > 0) {
      board.setZoom(gesture.zoom * (distance / gesture.distance));
      event.preventDefault();
    }

    return;
  }

  const gesture = viewportGesture.value;
  if (gesture?.mode !== "pan" || !canvasViewportRef.value) {
    return;
  }

  canvasViewportRef.value.scrollLeft -= event.clientX - gesture.lastX;
  canvasViewportRef.value.scrollTop -= event.clientY - gesture.lastY;
  viewportGesture.value = { mode: "pan", lastX: event.clientX, lastY: event.clientY };
  event.preventDefault();
}

function endCanvasGesture(event: PointerEvent) {
  viewportPointers.delete(event.pointerId);

  if (viewportPointers.size < 2 && viewportGesture.value?.mode === "pinch") {
    viewportGesture.value = null;
  }

  if (viewportPointers.size === 0) {
    viewportGesture.value = null;
  }
}

function terminalSide(ref: TerminalRef) {
  const part = getPart(ref.partId);
  if (!part) {
    return ref.terminal === "a" ? -1 : 1;
  }

  const spec = getSpec(part);
  const offset = spec.terminals[ref.terminal];
  return offset.x <= spec.width / 2 ? -1 : 1;
}

function compactRoutePoints(points: Point[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });
}

function wireRoutePoints(wire: Wire) {
  const start = wireEndpointPosition(wire, "from");
  const end = wireEndpointPosition(wire, "to");
  const startSide = terminalSide(wire.from);
  const endSide = terminalSide(wire.to);
  const lead = 44;
  const margin = 28;
  const limitWidth = workbenchLimitWidth();
  const startLead = {
    x: clamp(start.x + startSide * lead, margin, limitWidth - margin),
    y: start.y,
  };
  const endLead = {
    x: clamp(end.x + endSide * lead, margin, limitWidth - margin),
    y: end.y,
  };
  const route: Point[] = [start, startLead];

  if (startSide === endSide) {
    const outsideX =
      startSide > 0
        ? clamp(Math.max(startLead.x, endLead.x) + 72, margin, limitWidth - margin)
        : clamp(Math.min(startLead.x, endLead.x) - 72, margin, limitWidth - margin);

    route.push({ x: outsideX, y: startLead.y }, { x: outsideX, y: endLead.y });
  } else {
    const middleX = Math.round((startLead.x + endLead.x) / 2);
    route.push({ x: middleX, y: startLead.y }, { x: middleX, y: endLead.y });
  }

  route.push(endLead, end);
  return compactRoutePoints(route);
}

function roundedOrthogonalPath(points: Point[], radius = 16) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const commands = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const previousDistance = Math.hypot(current.x - previous.x, current.y - previous.y);
    const nextDistance = Math.hypot(next.x - current.x, next.y - current.y);

    if (previousDistance === 0 || nextDistance === 0) {
      continue;
    }

    const turnRadius = Math.min(radius, previousDistance / 2, nextDistance / 2);
    const before = {
      x: current.x + ((previous.x - current.x) / previousDistance) * turnRadius,
      y: current.y + ((previous.y - current.y) / previousDistance) * turnRadius,
    };
    const after = {
      x: current.x + ((next.x - current.x) / nextDistance) * turnRadius,
      y: current.y + ((next.y - current.y) / nextDistance) * turnRadius,
    };

    commands.push(
      `L ${Math.round(before.x)} ${Math.round(before.y)}`,
      `Q ${current.x} ${current.y} ${Math.round(after.x)} ${Math.round(after.y)}`,
    );
  }

  const last = points[points.length - 1];
  commands.push(`L ${last.x} ${last.y}`);
  return commands.join(" ");
}

function wirePath(wire: Wire) {
  return roundedOrthogonalPath(wireRoutePoints(wire));
}

function newWireDragPath() {
  if (!newWireDrag.value) {
    return "";
  }

  const start = getTerminalPosition(newWireDrag.value.from);
  const end = newWireDrag.value.over ? getTerminalPosition(newWireDrag.value.over) : newWireDrag.value;
  const middleX = Math.round((start.x + end.x) / 2);
  return roundedOrthogonalPath([
    start,
    { x: middleX, y: start.y },
    { x: middleX, y: end.y },
    end,
  ]);
}

function isWireHighlighted(wire: Wire) {
  return (
    selectedWireId.value === wire.id ||
    hoveredWireId.value === wire.id ||
    endpointDrag.value?.wireId === wire.id
  );
}

function wireStroke(wire: Wire) {
  if (selectedWireId.value === wire.id || endpointDrag.value?.wireId === wire.id) {
    return "#f59e0b";
  }

  if (hoveredWireId.value === wire.id) {
    return "#0e7490";
  }

  return simulation.value.wires[wire.id]?.active ? "#0891b2" : "#64748b";
}

function wireStrokeWidth(wire: Wire) {
  if (selectedWireId.value === wire.id || endpointDrag.value?.wireId === wire.id) {
    return 7;
  }

  if (hoveredWireId.value === wire.id) {
    return 6;
  }

  return simulation.value.wires[wire.id]?.active ? 5 + currentVisualStrength.value * 2 : 5;
}

function isEndpointHovered(wire: Wire, end: WireEnd) {
  return hoveredEndpoint.value?.wireId === wire.id && hoveredEndpoint.value.end === end;
}

function endpointRadius(wire: Wire, end: WireEnd) {
  if (endpointDrag.value?.wireId === wire.id && endpointDrag.value.end === end) {
    return 12;
  }

  if (selectedWireId.value === wire.id) {
    return 10;
  }

  if (isEndpointHovered(wire, end)) {
    return 10;
  }

  return hoveredWireId.value === wire.id ? 9 : 7;
}

function endpointFill(wire: Wire, end: WireEnd) {
  if (
    selectedWireId.value === wire.id ||
    isEndpointHovered(wire, end) ||
    endpointDrag.value?.wireId === wire.id
  ) {
    return "#f59e0b";
  }

  return "#0f172a";
}

function endpointStrokeWidth(wire: Wire, end: WireEnd) {
  return selectedWireId.value === wire.id ||
    isEndpointHovered(wire, end) ||
    endpointDrag.value?.wireId === wire.id
    ? 3
    : 0;
}

function setWireHover(wireId: string) {
  hoveredWireId.value = wireId;
}

function clearWireHover(wireId: string) {
  if (hoveredWireId.value === wireId) {
    hoveredWireId.value = null;
  }
}

function setEndpointHover(wireId: string, end: WireEnd) {
  hoveredWireId.value = wireId;
  hoveredEndpoint.value = { wireId, end };
}

function clearEndpointHover(wireId: string, end: WireEnd) {
  if (hoveredEndpoint.value?.wireId === wireId && hoveredEndpoint.value.end === end) {
    hoveredEndpoint.value = null;
  }

  if (hoveredWireId.value === wireId && !endpointDrag.value) {
    hoveredWireId.value = null;
  }
}

function terminalLabel(ref: TerminalRef) {
  const part = getPart(ref.partId);
  if (!part) {
    return "Missing terminal";
  }

  return `${part.name}${terminalDisplayLabel(part, ref.terminal)}`;
}

function wireLabel(wire: Wire) {
  return `${terminalLabel(wire.from)} -> ${terminalLabel(wire.to)}`;
}

function boardPoint(event: PointerEvent) {
  if (!workbenchRef.value) {
    return { x: 0, y: 0 };
  }

  const rect = workbenchRef.value.getBoundingClientRect();
  const scale = board.zoom / 100;
  return {
    x: (event.clientX - rect.left) / scale,
    y: (event.clientY - rect.top) / scale,
  };
}

function allTerminals() {
  return parts.value.flatMap((part) =>
    (["a", "b"] as TerminalKey[]).map((terminal) => ({
      ref: { partId: part.id, terminal },
      position: getTerminalPosition({ partId: part.id, terminal }),
    })),
  );
}

function closestTerminal(point: { x: number; y: number }, excluded?: TerminalRef) {
  let best: TerminalHit | null = null;

  for (const terminal of allTerminals()) {
    if (excluded && sameTerminal(terminal.ref, excluded)) {
      continue;
    }

    const distance = Math.hypot(terminal.position.x - point.x, terminal.position.y - point.y);
    if (distance <= 42 && (!best || distance < best.distance)) {
      best = {
        ref: terminal.ref,
        position: terminal.position,
        distance,
      };
    }
  }

  return best;
}

function handlePartPointerDown(event: PointerEvent, part: CircuitPart) {
  selectedWireId.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
  newWireDrag.value = null;
  selectedPartId.value = part.id;
  statusPanelTab.value = "selection";
  const point = boardPoint(event);
  dragging.value = {
    id: part.id,
    offsetX: point.x - part.x,
    offsetY: point.y - part.y,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function handleWorkbenchPointerMove(event: PointerEvent) {
  if (newWireDrag.value) {
    updateNewWireDrag(event);
    return;
  }

  if (endpointDrag.value) {
    const point = boardPoint(event);
    const wire = wires.value.find((item) => item.id === endpointDrag.value?.wireId);
    const otherEnd = wire ? (endpointDrag.value.end === "from" ? wire.to : wire.from) : undefined;
    const hit = closestTerminal(point, otherEnd);
    const nextPoint = hit?.position ?? point;
    endpointDrag.value.x = Math.min(workbenchLimitWidth(), Math.max(0, nextPoint.x));
    endpointDrag.value.y = Math.min(workbenchLimitHeight(), Math.max(0, nextPoint.y));
    endpointDrag.value.over = hit?.ref ?? null;
    return;
  }

  if (!dragging.value) {
    return;
  }

  const part = getPart(dragging.value.id);
  if (!part) {
    return;
  }

  const point = boardPoint(event);
  const position = clampPartPosition(part, point.x - dragging.value.offsetX, point.y - dragging.value.offsetY);
  part.x = position.x;
  part.y = position.y;
}

function endDrag() {
  dragging.value = null;
  finishEndpointDrag();
  finishNewWireDrag();
}

function clearCanvasSelection() {
  hoveredEndpoint.value = null;
  hoveredWireId.value = null;
  selectedTerminal.value = null;
  selectedWireId.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
  newWireDrag.value = null;
  suppressNextTerminalClick.value = false;
}

function selectWire(wireId: string) {
  hoveredWireId.value = wireId;
  selectedWireId.value = wireId;
  selectedTerminal.value = null;
  rewiring.value = null;
  statusPanelTab.value = "selection";
}

function startRewire(wireId: string, end: WireEnd) {
  selectedWireId.value = wireId;
  selectedTerminal.value = null;
  endpointDrag.value = null;
  newWireDrag.value = null;
  rewiring.value = { wireId, end };
}

function startEndpointDrag(event: PointerEvent, wire: Wire, end: WireEnd) {
  if (event.altKey) {
    startBranchWireDrag(event, wire, end);
    return;
  }

  if (selectedWireId.value !== wire.id) {
    selectWire(wire.id);
  }

  const start = getTerminalPosition(wire[end]);
  selectedTerminal.value = null;
  selectedWireId.value = wire.id;
  hoveredWireId.value = wire.id;
  hoveredEndpoint.value = { wireId: wire.id, end };
  rewiring.value = { wireId: wire.id, end };
  newWireDrag.value = null;
  endpointDrag.value = {
    wireId: wire.id,
    end,
    x: start.x,
    y: start.y,
    over: null,
  };
  (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId);
}

function startBranchWireDrag(event: PointerEvent, wire: Wire, end: WireEnd) {
  const from = { ...wire[end] };
  const start = getTerminalPosition(from);
  selectedTerminal.value = null;
  selectedWireId.value = null;
  hoveredWireId.value = wire.id;
  hoveredEndpoint.value = { wireId: wire.id, end };
  rewiring.value = null;
  endpointDrag.value = null;
  newWireDrag.value = {
    from,
    moved: false,
    over: null,
    x: start.x,
    y: start.y,
  };
  (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId);
}

function finishEndpointDrag() {
  if (!endpointDrag.value) {
    return;
  }

  const target = endpointDrag.value.over;
  if (target) {
    finishRewire(target);
  }

  endpointDrag.value = null;
}

function finishRewire(target: TerminalRef) {
  if (!rewiring.value) {
    return;
  }

  const current = rewiring.value;
  const wire = wires.value.find((item) => item.id === current.wireId);
  if (!wire) {
    rewiring.value = null;
    return;
  }

  const otherEnd = current.end === "from" ? wire.to : wire.from;
  if (sameTerminal(target, otherEnd)) {
    rewiring.value = null;
    endpointDrag.value = null;
    return;
  }

  const hasSameWire = wires.value.some((item) => {
    if (item.id === wire.id) {
      return false;
    }

    const nextFrom = current.end === "from" ? target : wire.from;
    const nextTo = current.end === "to" ? target : wire.to;
    return (
      (sameTerminal(item.from, nextFrom) && sameTerminal(item.to, nextTo)) ||
      (sameTerminal(item.to, nextFrom) && sameTerminal(item.from, nextTo))
    );
  });

  if (!hasSameWire) {
    pushEditorHistory();
    wire[current.end] = target;
  }

  hoveredEndpoint.value = null;
  hoveredWireId.value = wire.id;
  selectedWireId.value = wire.id;
  rewiring.value = null;
  selectedTerminal.value = null;
  endpointDrag.value = null;
}

function addWireBetween(from: TerminalRef, to: TerminalRef) {
  if (sameTerminal(from, to)) {
    return null;
  }

  const hasSameWire = wires.value.some(
    (wire) =>
      (sameTerminal(wire.from, from) && sameTerminal(wire.to, to)) ||
      (sameTerminal(wire.to, from) && sameTerminal(wire.from, to)),
  );

  if (hasSameWire) {
    return null;
  }

  pushEditorHistory();
  const wire = {
    id: `wire-${Date.now()}`,
    from,
    to,
  };
  wires.value.push(wire);
  hoveredWireId.value = wire.id;
  selectedWireId.value = wire.id;
  return wire;
}

function startNewWireDrag(event: PointerEvent, part: CircuitPart, terminal: TerminalKey) {
  if (rewiring.value) {
    return;
  }

  const from = { partId: part.id, terminal };
  const start = getTerminalPosition(from);
  selectedPartId.value = part.id;
  selectedWireId.value = null;
  hoveredWireId.value = null;
  endpointDrag.value = null;
  newWireDrag.value = {
    from,
    moved: false,
    over: null,
    x: start.x,
    y: start.y,
  };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function updateNewWireDrag(event: PointerEvent) {
  if (!newWireDrag.value) {
    return;
  }

  const point = boardPoint(event);
  const start = getTerminalPosition(newWireDrag.value.from);
  const hit = closestTerminal(point, newWireDrag.value.from);
  const nextPoint = hit?.position ?? point;
  newWireDrag.value.moved =
    newWireDrag.value.moved || Math.hypot(point.x - start.x, point.y - start.y) > 6;
  newWireDrag.value.x = Math.min(workbenchLimitWidth(), Math.max(0, nextPoint.x));
  newWireDrag.value.y = Math.min(workbenchLimitHeight(), Math.max(0, nextPoint.y));
  newWireDrag.value.over = hit?.ref ?? null;
}

function finishNewWireDrag() {
  if (!newWireDrag.value) {
    return;
  }

  const drag = newWireDrag.value;
  newWireDrag.value = null;

  if (!drag.moved) {
    return;
  }

  suppressNextTerminalClick.value = true;
  selectedTerminal.value = null;

  if (drag.over) {
    addWireBetween(drag.from, drag.over);
  }
}

function handleTerminalClick(part: CircuitPart, terminal: TerminalKey) {
  if (suppressNextTerminalClick.value) {
    suppressNextTerminalClick.value = false;
    return;
  }

  selectedPartId.value = part.id;
  const target = { partId: part.id, terminal };

  if (rewiring.value) {
    finishRewire(target);
    return;
  }

  selectedWireId.value = null;

  if (!selectedTerminal.value) {
    selectedTerminal.value = target;
    return;
  }

  const from = selectedTerminal.value;
  if (sameTerminal(from, target)) {
    selectedTerminal.value = null;
    return;
  }

  addWireBetween(from, target);

  selectedTerminal.value = null;
}

function isTerminalSelected(part: CircuitPart, terminal: TerminalKey) {
  const terminalRef = { partId: part.id, terminal };
  const isPendingNewWire =
    selectedTerminal.value?.partId === part.id &&
    selectedTerminal.value.terminal === terminal;
  const isDraftNewWire =
    (newWireDrag.value?.from.partId === part.id && newWireDrag.value.from.terminal === terminal) ||
    (newWireDrag.value?.over?.partId === part.id && newWireDrag.value.over.terminal === terminal);

  if (!rewiring.value) {
    const isDropTarget =
      endpointDrag.value?.over?.partId === part.id &&
      endpointDrag.value.over.terminal === terminal;

    return isPendingNewWire || isDraftNewWire || isDropTarget;
  }

  const wire = wires.value.find((item) => item.id === rewiring.value?.wireId);
  const isRewireEnd = wire ? sameTerminal(wire[rewiring.value.end], terminalRef) : false;
  const isDropTarget =
    endpointDrag.value?.over?.partId === part.id &&
    endpointDrag.value.over.terminal === terminal;

  return isPendingNewWire || isDraftNewWire || isRewireEnd || isDropTarget;
}

function isTerminalDropTarget(part: CircuitPart, terminal: TerminalKey) {
  return (
    endpointDrag.value?.over?.partId === part.id &&
    endpointDrag.value.over.terminal === terminal
  ) || (
    newWireDrag.value?.over?.partId === part.id &&
    newWireDrag.value.over.terminal === terminal
  );
}

function isLessonTerminalTarget(part: CircuitPart, terminal: TerminalKey) {
  return Boolean(
    activeLessonGuide.value?.terminalRefs?.some(
      (ref) => ref.partId === part.id && ref.terminal === terminal,
    ),
  );
}

function isLessonPartTarget(part: CircuitPart) {
  return Boolean(
    activeLessonGuide.value?.partIds?.includes(part.id) ||
      activeLessonGuide.value?.terminalRefs?.some((ref) => ref.partId === part.id),
  );
}

function clampPartPosition(part: CircuitPart, x: number, y: number) {
  const spec = getSpec(part);
  return {
    x: Math.round(Math.min(workbenchLimitWidth() - spec.width - 16, Math.max(16, x))),
    y: Math.round(Math.min(workbenchLimitHeight() - spec.height - 16, Math.max(16, y))),
  };
}

function addPart(type: PartType) {
  const index = parts.value.filter((part) => part.type === type).length + 1;
  const spec = getSpec(type);
  pushEditorHistory();
  const nextPart: CircuitPart = {
    id: `${type}-${Date.now()}`,
    name: `${spec.label} ${index}`,
    type,
    x: 180 + ((index * 70) % 420),
    y: 180 + ((index * 48) % 260),
  };

  if (type === "switch") {
    nextPart.closed = false;
  }

  if (type === "resistor") {
    nextPart.resistance = 60;
  }

  parts.value.push(nextPart);
  clearInteractionState();
  selectedPartId.value = nextPart.id;
  statusPanelTab.value = "selection";
  palettePanelOpen.value = false;
}

function duplicateSelectedPart() {
  const selected = selectedPart.value;
  if (!selected) {
    return;
  }

  pushEditorHistory();
  const index = parts.value.filter((part) => part.type === selected.type).length + 1;
  const position = clampPartPosition(selected, selected.x + 36, selected.y + 36);
  const nextPart: CircuitPart = {
    ...selected,
    id: `${selected.type}-${Date.now()}`,
    name: `${getSpec(selected).label} ${index}`,
    x: position.x,
    y: position.y,
  };
  parts.value.push(nextPart);
  clearInteractionState();
  selectedPartId.value = nextPart.id;
}

function removeSelectedPart() {
  const selected = selectedPart.value;
  if (!selected || parts.value.length <= 1) {
    return;
  }

  pushEditorHistory();
  parts.value = parts.value.filter((part) => part.id !== selected.id);
  wires.value = wires.value.filter(
    (wire) => wire.from.partId !== selected.id && wire.to.partId !== selected.id,
  );
  selectedPartId.value = parts.value[0]?.id ?? "";
  clearInteractionState();
}

function removeWire(wireId: string) {
  if (!wires.value.some((wire) => wire.id === wireId)) {
    return;
  }

  pushEditorHistory();
  wires.value = wires.value.filter((wire) => wire.id !== wireId);
  if (selectedWireId.value === wireId) {
    selectedWireId.value = null;
  }

  if (hoveredWireId.value === wireId) {
    hoveredWireId.value = null;
  }

  if (hoveredEndpoint.value?.wireId === wireId) {
    hoveredEndpoint.value = null;
  }

  if (rewiring.value?.wireId === wireId) {
    rewiring.value = null;
  }

  if (endpointDrag.value?.wireId === wireId) {
    endpointDrag.value = null;
  }
}

function clearWires() {
  if (wires.value.length === 0) {
    return;
  }

  pushEditorHistory();
  wires.value = [];
  clearInteractionState();
}

function deleteSelectedWorkbenchItem() {
  if (selectedWire.value) {
    removeWire(selectedWire.value.id);
    return;
  }

  if (selectedPart.value) {
    removeSelectedPart();
  }
}

function nudgeSelectedPart(deltaX: number, deltaY: number, shouldRecordHistory = true) {
  const selected = selectedPart.value;
  if (!selected) {
    return;
  }

  if (shouldRecordHistory) {
    pushEditorHistory();
  }

  const position = clampPartPosition(selected, selected.x + deltaX, selected.y + deltaY);
  selected.x = position.x;
  selected.y = position.y;
  selectedWireId.value = null;
}

function cancelWorkbenchInteraction() {
  if (lessonCompletePanelOpen.value || palettePanelOpen.value || statusPanelOpen.value) {
    lessonCompletePanelOpen.value = false;
    palettePanelOpen.value = false;
    statusPanelOpen.value = false;
    return;
  }

  if (hasTransientInteraction()) {
    clearInteractionState();
    return;
  }

  clearSelection();
}

function isKeyboardShortcutBlocked(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"))
    : false;
}

function setWorkbenchZoom(value: number) {
  pushEditorHistory();
  board.setZoom(value);
}

function handleWorkbenchKeydown(event: KeyboardEvent) {
  if (isKeyboardShortcutBlocked(event.target)) {
    return;
  }

  const key = event.key;
  const keyLower = key.toLowerCase();
  const commandKey = event.metaKey || event.ctrlKey;

  if (commandKey && keyLower === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      redoWorkspaceChange();
    } else {
      undoWorkspaceChange();
    }
    return;
  }

  if (commandKey && keyLower === "y") {
    event.preventDefault();
    redoWorkspaceChange();
    return;
  }

  if (commandKey && keyLower === "d") {
    event.preventDefault();
    duplicateSelectedPart();
    return;
  }

  if (key === "Delete" || key === "Backspace") {
    event.preventDefault();
    deleteSelectedWorkbenchItem();
    return;
  }

  if (key === "Escape") {
    event.preventDefault();
    cancelWorkbenchInteraction();
    return;
  }

  const nudgeDistance = event.shiftKey ? 16 : 4;
  const nudgeMap: Partial<Record<string, [number, number]>> = {
    ArrowDown: [0, nudgeDistance],
    ArrowLeft: [-nudgeDistance, 0],
    ArrowRight: [nudgeDistance, 0],
    ArrowUp: [0, -nudgeDistance],
  };
  const nudge = nudgeMap[key];
  if (nudge) {
    event.preventDefault();
    nudgeSelectedPart(nudge[0], nudge[1], !event.repeat);
    return;
  }

  if ((key === "Enter" || key === " ") && selectedPart.value?.type === "switch") {
    event.preventDefault();
    toggleSwitch(selectedPart.value);
    return;
  }

  if ((key === "Enter" || key === " ") && selectedPart.value?.type === "battery") {
    event.preventDefault();
    toggleBatteryPolarity(selectedPart.value);
    return;
  }

  if (key === "+" || key === "=") {
    event.preventDefault();
    setWorkbenchZoom(board.zoom + 5);
    return;
  }

  if (key === "-" || key === "_") {
    event.preventDefault();
    setWorkbenchZoom(board.zoom - 5);
    return;
  }

  if (key === "0") {
    event.preventDefault();
    pushEditorHistory();
    resetMobileView();
  }
}

function loadWorkspace(workspace: LessonWorkspace) {
  parts.value = workspace.parts.map((part) => ({ ...part }));
  wires.value = workspace.wires.map((wire) => ({
    ...wire,
    from: { ...wire.from },
    to: { ...wire.to },
  }));
  selectedPartId.value = workspace.selectedPartId;
  clearInteractionState();
  board.setZoom(workspace.zoom);
  fitMobileWorkbenchAfterRender();
}

function workspaceSnapshot(savedAt = new Date().toISOString()): PersistedWorkspace {
  return {
    activeLessonId: activeLessonId.value,
    parts: parts.value.map((part) => ({ ...part })),
    savedAt,
    selectedPartId: selectedPartId.value,
    version: 1,
    wires: wires.value.map((wire) => ({
      ...wire,
      from: { ...wire.from },
      to: { ...wire.to },
    })),
    zoom: board.zoom,
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
  activeLessonId.value = lessonCatalog.some((lesson) => lesson.id === workspace.activeLessonId)
    ? workspace.activeLessonId
    : lessonCatalog[0].id;
  loadWorkspace(workspace);
  lastSavedAt.value = workspace.savedAt;
}

function restoreWorkspaceFromUrl() {
  if (typeof window === "undefined") {
    return false;
  }

  const sharedWorkspace = new URL(window.location.href).searchParams.get(workspaceShareParam);
  if (!sharedWorkspace) {
    return false;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(sharedWorkspace)) as unknown;
    if (!isPersistedWorkspace(parsed)) {
      return false;
    }

    loadWorkspaceSnapshot(parsed);
    saveWorkspaceToStorage();
    sharedWorkspaceLoaded.value = true;
    return true;
  } catch {
    return false;
  }
}

function restoreAutoSavedWorkspace() {
  if (typeof window === "undefined") {
    return;
  }

  const rawWorkspace = window.localStorage.getItem(savedWorkspaceKey);
  if (!rawWorkspace) {
    return;
  }

  try {
    const workspace = JSON.parse(rawWorkspace) as unknown;
    if (isPersistedWorkspace(workspace)) {
      loadWorkspaceSnapshot(workspace);
    }
  } catch {
    window.localStorage.removeItem(savedWorkspaceKey);
  }
}

function saveWorkspaceToStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const workspace = workspaceSnapshot();
  window.localStorage.setItem(savedWorkspaceKey, JSON.stringify(workspace));
  lastSavedAt.value = workspace.savedAt;
}

function markCloudWorkspaceChanged() {
  if (!cloudUserEmail.value || suppressCloudDirtyMark.value || cloudSyncStatus.value === "syncing") {
    return;
  }

  cloudSyncStatus.value = "local-changes";
  cloudRecordsMessage.value = "";
}

function cloudUploadSuggestionKey() {
  return cloudUserEmail.value ? `${cloudUploadSuggestionKeyPrefix}.${cloudUserEmail.value}` : cloudUploadSuggestionKeyPrefix;
}

function dismissCloudInitialUploadSuggestion() {
  cloudShouldSuggestInitialUpload.value = false;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(cloudUploadSuggestionKey(), "dismissed");
  }
}

function scheduleWorkspaceSave() {
  if (typeof window === "undefined") {
    return;
  }

  markCloudWorkspaceChanged();

  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }

  autosaveTimer = window.setTimeout(saveWorkspaceToStorage, 220);
}

function loadSavedRecords() {
  if (typeof window === "undefined") {
    return;
  }

  const rawRecords = window.localStorage.getItem(savedRecordsKey);
  if (!rawRecords) {
    return;
  }

  try {
    const records = JSON.parse(rawRecords) as unknown;
    savedRecords.value = Array.isArray(records)
      ? records.filter(isSavedWorkspaceRecord).slice(0, 12)
      : [];
  } catch {
    window.localStorage.removeItem(savedRecordsKey);
  }
}

function persistSavedRecords() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(savedRecordsKey, JSON.stringify(savedRecords.value));
}

function saveWorkspaceRecord() {
  const snapshot = workspaceSnapshot();
  const title = recordTitle.value.trim() || `记录 ${formatSavedTime(snapshot.savedAt)}`;
  savedRecords.value = [
    {
      ...snapshot,
      id: `record-${Date.now()}`,
      title,
    },
    ...savedRecords.value,
  ].slice(0, 12);
  recordTitle.value = "";
  persistSavedRecords();
  saveWorkspaceToStorage();
}

function downloadTextFile(filename: string, content: string, type: string) {
  if (typeof document === "undefined") {
    return;
  }

  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

function exportWorkspaceJson() {
  const snapshot = workspaceSnapshot();
  const filename = `xshow-workspace-${new Date(snapshot.savedAt).toISOString().slice(0, 10)}.json`;
  downloadTextFile(filename, JSON.stringify(snapshot, null, 2), "application/json");
}

function showShareLinkFeedback(state: "copied" | "manual") {
  shareLinkState.value = state;

  if (shareLinkFeedbackTimer) {
    window.clearTimeout(shareLinkFeedbackTimer);
  }

  shareLinkFeedbackTimer = window.setTimeout(() => {
    shareLinkState.value = "idle";
    shareLinkFeedbackTimer = null;
  }, state === "copied" ? 1800 : 3600);
}

async function copyWorkspaceShareLink() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(workspaceShareParam, base64UrlEncode(JSON.stringify(workspaceSnapshot())));
  const shareUrl = url.toString();

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(shareUrl);
    showShareLinkFeedback("copied");
  } catch {
    showShareLinkFeedback("manual");
    window.prompt("浏览器没有允许自动复制，请手动复制这个分享链接：", shareUrl);
  }
}

function showBuildPlanCopyFeedback(state: "copied" | "manual") {
  buildPlanCopyState.value = state;

  if (buildPlanCopyFeedbackTimer) {
    window.clearTimeout(buildPlanCopyFeedbackTimer);
  }

  buildPlanCopyFeedbackTimer = window.setTimeout(() => {
    buildPlanCopyState.value = "idle";
    buildPlanCopyFeedbackTimer = null;
  }, state === "copied" ? 1800 : 3600);
}

async function copyPhysicalBuildPlan() {
  if (typeof window === "undefined") {
    return;
  }

  const markdown = formatPhysicalBuildPlanMarkdown(physicalBuildPlan.value);

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(markdown);
    showBuildPlanCopyFeedback("copied");
  } catch {
    showBuildPlanCopyFeedback("manual");
    window.prompt("浏览器没有允许自动复制，请手动复制这个实体搭建清单：", markdown);
  }
}

function exportPhysicalBuildPlan() {
  const date = new Date().toISOString().slice(0, 10);
  downloadTextFile(
    `xshow-physical-build-${date}.md`,
    formatPhysicalBuildPlanMarkdown(physicalBuildPlan.value),
    "text/markdown;charset=utf-8",
  );
}

async function importWorkspaceJson(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";

  if (!file) {
    return;
  }

  try {
    const parsed = JSON.parse(await file.text()) as unknown;
    if (!isPersistedWorkspace(parsed)) {
      window.alert("这个 JSON 文件不是有效的 xshow 工作台存档。");
      return;
    }

    pushEditorHistory();
    loadWorkspaceSnapshot(parsed);
    saveWorkspaceToStorage();
    statusPanelOpen.value = false;
  } catch {
    window.alert("读取 JSON 存档失败，请检查文件内容。");
  }
}

function loadSavedRecord(record: SavedWorkspaceRecord) {
  pushEditorHistory();
  loadWorkspaceSnapshot(record);
  saveWorkspaceToStorage();
}

function removeSavedRecord(recordId: string) {
  savedRecords.value = savedRecords.value.filter((record) => record.id !== recordId);
  persistSavedRecords();
}

async function refreshCloudUser() {
  if (!cloudConfig.configured) {
    return;
  }

  try {
    const user = await getCloudUser();
    cloudUserEmail.value = user?.email ?? null;
    if (user) {
      void loadCloudRecords();
    } else {
      cloudRecords.value = [];
      cloudActiveRecordId.value = null;
      cloudLastSyncedAt.value = null;
      cloudRecordTitle.value = "";
      cloudShouldSuggestInitialUpload.value = false;
      cloudAuthMode.value = "sign-in";
      clearCloudConflict();
      cloudSyncStatus.value = "idle";
    }
  } catch (error) {
    cloudAuthError.value = error instanceof Error ? error.message : "读取登录状态失败。";
  }
}

function setCloudAuthMode(mode: CloudAuthMode) {
  cloudAuthMode.value = mode;
  cloudAuthError.value = "";
  cloudAuthMessage.value = "";
  cloudPassword.value = "";
  cloudPasswordConfirm.value = "";
}

function validateCloudPassword({ requireConfirm = false } = {}) {
  if (!cloudPassword.value) {
    cloudAuthError.value = "请输入密码。";
    return false;
  }

  if (cloudPassword.value.length < 6) {
    cloudAuthError.value = "密码至少需要 6 位。";
    return false;
  }

  if (requireConfirm && cloudPassword.value !== cloudPasswordConfirm.value) {
    cloudAuthError.value = "两次输入的密码不一致。";
    return false;
  }

  return true;
}

async function requestCloudAuth() {
  const email = cloudEmail.value.trim();
  cloudAuthError.value = "";
  cloudAuthMessage.value = "";

  if (!cloudConfig.configured) {
    cloudAuthError.value = "还没有配置 Supabase 环境变量。";
    return;
  }

  if (cloudAuthMode.value !== "update-password" && !email) {
    cloudAuthError.value = "请输入邮箱地址。";
    return;
  }

  if (cloudAuthMode.value === "sign-in" && !validateCloudPassword()) {
    return;
  }

  if (cloudAuthMode.value === "sign-up" && !validateCloudPassword({ requireConfirm: true })) {
    return;
  }

  if (cloudAuthMode.value === "update-password" && !validateCloudPassword({ requireConfirm: true })) {
    return;
  }

  cloudAuthBusy.value = true;
  try {
    if (cloudAuthMode.value === "sign-in") {
      await signInWithEmailPassword(email, cloudPassword.value);
      cloudPassword.value = "";
      cloudPasswordConfirm.value = "";
      cloudAuthMessage.value = "已登录云端同步。";
      await refreshCloudUser();
      return;
    }

    if (cloudAuthMode.value === "sign-up") {
      await signUpWithEmailPassword(email, cloudPassword.value);
      cloudPassword.value = "";
      cloudPasswordConfirm.value = "";
      cloudAuthMessage.value = "账号已创建。如果收到确认邮件，请先完成邮箱确认。";
      cloudAuthMode.value = "sign-in";
      await refreshCloudUser();
      return;
    }

    if (cloudAuthMode.value === "reset") {
      await sendPasswordResetEmail(email);
      cloudAuthMessage.value = "密码重置邮件已发送，请检查邮箱。";
      cloudAuthMode.value = "sign-in";
      return;
    }

    await updateCloudPassword(cloudPassword.value);
    cloudPassword.value = "";
    cloudPasswordConfirm.value = "";
    cloudAuthMode.value = "sign-in";
    cloudAuthMessage.value = "密码已更新。";
  } catch (error) {
    cloudAuthError.value = error instanceof Error ? error.message : "云端账号操作失败。";
  } finally {
    cloudAuthBusy.value = false;
  }
}

async function loadCloudRecords() {
  if (!cloudConfig.configured || !cloudUserEmail.value) {
    cloudRecords.value = [];
    return;
  }

  cloudRecordsBusy.value = true;
  cloudRecordsError.value = "";

  try {
    cloudRecords.value = await listCloudWorkspaceRecords<PersistedWorkspace>();
    cloudShouldSuggestInitialUpload.value =
      cloudRecords.value.length === 0 &&
      !cloudActiveRecordId.value &&
      typeof window !== "undefined" &&
      !window.localStorage.getItem(cloudUploadSuggestionKey());
  } catch (error) {
    cloudSyncStatus.value = "failed";
    cloudRecordsError.value = error instanceof Error ? error.message : "读取云端记录失败。";
  } finally {
    cloudRecordsBusy.value = false;
  }
}

function clearCloudConflict() {
  cloudPendingSnapshot.value = null;
  cloudPendingTitle.value = "";
}

function getCloudRecordTitle(snapshot: PersistedWorkspace) {
  return (
    cloudRecordTitle.value.trim() ||
    activeCloudRecord.value?.title ||
    recordTitle.value.trim() ||
    `云端记录 ${formatSavedTime(snapshot.savedAt)}`
  ).slice(0, 120);
}

function upsertCloudRecord(record: CloudRecord) {
  cloudRecords.value = [record, ...cloudRecords.value.filter((item) => item.id !== record.id)].slice(0, 20);
  cloudActiveRecordId.value = record.id;
  cloudLastSyncedAt.value = record.updated_at;
  cloudRecordTitle.value = record.title;
}

async function saveWorkspaceToCloud(options: SaveCloudWorkspaceOptions = {}) {
  if (!cloudUserEmail.value) {
    cloudRecordsError.value = "请先登录云端同步。";
    return;
  }

  cloudRecordsBusy.value = true;
  cloudRecordsError.value = "";
  cloudRecordsMessage.value = "";
  cloudSyncStatus.value = "syncing";

  try {
    const snapshot = cloudPendingSnapshot.value && (options.forceOverwrite || options.saveAsCopy)
      ? cloudPendingSnapshot.value
      : workspaceSnapshot();
    const title = (cloudPendingTitle.value && (options.forceOverwrite || options.saveAsCopy))
      ? cloudPendingTitle.value
      : getCloudRecordTitle(snapshot);
    const shouldUpdateActiveRecord = Boolean(cloudActiveRecordId.value && !options.saveAsCopy);
    const record = shouldUpdateActiveRecord
      ? await updateCloudWorkspaceRecord<PersistedWorkspace>(
          cloudActiveRecordId.value as string,
          title,
          snapshot,
          options.forceOverwrite ? undefined : cloudLastSyncedAt.value ?? undefined,
        )
      : await saveCloudWorkspaceRecord(title, snapshot);

    if (!record) {
      cloudPendingSnapshot.value = snapshot;
      cloudPendingTitle.value = title;
      await loadCloudRecords();
      cloudSyncStatus.value = "failed";
      cloudRecordsError.value = "云端记录已在其他设备更新。请选择覆盖云端，或另存为副本。";
      return;
    }

    upsertCloudRecord(record);
    clearCloudConflict();
    if (cloudShouldSuggestInitialUpload.value) {
      dismissCloudInitialUploadSuggestion();
    }
    sharedWorkspaceLoaded.value = false;
    cloudSyncStatus.value = "synced";
    cloudRecordsMessage.value = shouldUpdateActiveRecord ? "已更新云端记录。" : "已保存到云端。";
  } catch (error) {
    cloudSyncStatus.value = "failed";
    cloudRecordsError.value = error instanceof Error ? error.message : "保存云端记录失败。";
  } finally {
    cloudRecordsBusy.value = false;
  }
}

function loadCloudRecord(record: CloudRecord) {
  cloudRecordsError.value = "";
  cloudRecordsMessage.value = "";

  if (!isPersistedWorkspace(record.workspace)) {
    cloudSyncStatus.value = "failed";
    cloudRecordsError.value = "这条云端记录不是有效的工作台存档。";
    return;
  }

  suppressCloudDirtyMark.value = true;
  pushEditorHistory();
  loadWorkspaceSnapshot(record.workspace);
  saveWorkspaceToStorage();
  cloudActiveRecordId.value = record.id;
  cloudLastSyncedAt.value = record.updated_at;
  cloudRecordTitle.value = record.title;
  clearCloudConflict();
  cloudRecordsMessage.value = `已加载 ${record.title}`;
  void nextTick(() => {
    suppressCloudDirtyMark.value = false;
    cloudSyncStatus.value = "synced";
  });
}

async function renameCloudRecord(record: CloudRecord) {
  if (typeof window === "undefined") {
    return;
  }

  const nextTitle = window.prompt("新的云端记录名称：", record.title)?.trim().slice(0, 120);
  if (!nextTitle || nextTitle === record.title) {
    return;
  }

  const previousStatus = cloudSyncStatus.value;
  cloudRecordsBusy.value = true;
  cloudRecordsError.value = "";
  cloudRecordsMessage.value = "";
  cloudSyncStatus.value = "syncing";

  try {
    const updatedRecord = await renameCloudWorkspaceRecord<PersistedWorkspace>(record.id, nextTitle);
    cloudRecords.value = cloudRecords.value.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
    if (cloudActiveRecordId.value === updatedRecord.id) {
      cloudLastSyncedAt.value = updatedRecord.updated_at;
      cloudSyncStatus.value = "synced";
    } else {
      cloudSyncStatus.value = previousStatus === "syncing" ? "idle" : previousStatus;
    }
    cloudRecordsMessage.value = "云端记录已重命名。";
  } catch (error) {
    cloudSyncStatus.value = "failed";
    cloudRecordsError.value = error instanceof Error ? error.message : "重命名云端记录失败。";
  } finally {
    cloudRecordsBusy.value = false;
  }
}

async function removeCloudRecord(recordId: string) {
  cloudRecordsBusy.value = true;
  cloudRecordsError.value = "";
  cloudRecordsMessage.value = "";
  cloudSyncStatus.value = "syncing";

  try {
    await deleteCloudWorkspaceRecord(recordId);
    cloudRecords.value = cloudRecords.value.filter((record) => record.id !== recordId);
    if (cloudActiveRecordId.value === recordId) {
      cloudActiveRecordId.value = null;
      cloudLastSyncedAt.value = null;
      cloudRecordTitle.value = "";
      cloudShouldSuggestInitialUpload.value = false;
      clearCloudConflict();
      cloudSyncStatus.value = "local-changes";
    } else {
      cloudSyncStatus.value = "idle";
    }
    cloudRecordsMessage.value = "云端记录已删除。";
  } catch (error) {
    cloudSyncStatus.value = "failed";
    cloudRecordsError.value = error instanceof Error ? error.message : "删除云端记录失败。";
  } finally {
    cloudRecordsBusy.value = false;
  }
}

async function handleCloudSignOut() {
  cloudAuthError.value = "";
  cloudAuthMessage.value = "";
  cloudAuthBusy.value = true;

  try {
    await signOutCloud();
    cloudUserEmail.value = null;
    cloudRecords.value = [];
    cloudActiveRecordId.value = null;
    cloudLastSyncedAt.value = null;
    cloudRecordTitle.value = "";
    cloudShouldSuggestInitialUpload.value = false;
    cloudPassword.value = "";
    cloudPasswordConfirm.value = "";
    cloudAuthMode.value = "sign-in";
    clearCloudConflict();
    cloudSyncStatus.value = "idle";
    cloudAuthMessage.value = "已退出云端同步。";
  } catch (error) {
    cloudAuthError.value = error instanceof Error ? error.message : "退出登录失败。";
  } finally {
    cloudAuthBusy.value = false;
  }
}

function loadLessonWorkspace(lessonId = activeLesson.value.id) {
  const lesson = lessonCatalog.find((item) => item.id === lessonId) ?? activeLesson.value;
  pushEditorHistory();
  activeLessonId.value = lesson.id;
  loadWorkspace(lesson.starterWorkspace);
}

function closeLessonCompletePanel() {
  dismissedLessonCompletionId.value = activeLessonId.value;
  lessonCompletePanelOpen.value = false;
}

function loadNextLesson() {
  const currentIndex = lessonCatalog.findIndex((lesson) => lesson.id === activeLessonId.value);
  const nextLesson = lessonCatalog[(currentIndex + 1) % lessonCatalog.length] ?? lessonCatalog[0];
  dismissedLessonCompletionId.value = null;
  lessonCompletePanelOpen.value = false;
  loadLessonWorkspace(nextLesson.id);
}

function resetDemo() {
  const demoLesson = lessonCatalog.find((lesson) => lesson.id === "open-the-circuit") ?? lessonCatalog[0];
  pushEditorHistory();
  loadWorkspace({
    ...demoLesson.starterWorkspace,
    selectedPartId: "bulb-1",
  });
}

function toggleSwitch(part: CircuitPart) {
  pushEditorHistory();
  part.closed = !part.closed;
}

function toggleBatteryPolarity(part: CircuitPart) {
  pushEditorHistory();

  if (batteryPolarity(part) === "normal") {
    part.polarity = "reversed";
    return;
  }

  delete part.polarity;
}

function setResistance(part: CircuitPart, value: number) {
  part.resistance = Math.round(value);
}

loadSavedRecords();
if (!restoreWorkspaceFromUrl()) {
  restoreAutoSavedWorkspace();
}
watch([parts, wires, selectedPartId, activeLessonId, () => board.zoom], scheduleWorkspaceSave, {
  deep: true,
});
watch(
  [lessonComplete, activeLessonId],
  ([complete]) => {
    if (complete && dismissedLessonCompletionId.value !== activeLessonId.value) {
      lessonCompletePanelOpen.value = true;
      return;
    }

    if (!complete && dismissedLessonCompletionId.value === activeLessonId.value) {
      dismissedLessonCompletionId.value = null;
    }

    lessonCompletePanelOpen.value = false;
  },
  { immediate: true },
);

function handleMobileViewportChange() {
  updateCanvasViewportSize();
  fitMobileWorkbenchAfterRender();
}

function handlePwaUpdateAvailable(event: Event) {
  const detail = (event as CustomEvent<{ registration?: ServiceWorkerRegistration }>).detail;
  pwaUpdateRegistration.value = detail.registration ?? null;
}

function dismissPwaUpdate() {
  pwaUpdateRegistration.value = null;
}

function applyPwaUpdate() {
  const waitingWorker = pwaUpdateRegistration.value?.waiting;
  if (!waitingWorker || !("serviceWorker" in navigator)) {
    window.location.reload();
    return;
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
    once: true,
  });
  waitingWorker.postMessage({ type: "SKIP_WAITING" });
}

function openMobileStatusPanel(tab: StatusPanelTab = statusPanelTab.value) {
  statusPanelTab.value = tab;
  statusPanelOpen.value = true;
  palettePanelOpen.value = false;
}

onMounted(() => {
  void refreshCloudUser();
  cloudAuthUnsubscribe = onCloudAuthStateChange((user, event) => {
    cloudUserEmail.value = user?.email ?? null;
    if (user) {
      if (event === "PASSWORD_RECOVERY") {
        cloudAuthMode.value = "update-password";
        cloudAuthMessage.value = "请设置一个新密码。";
      } else if (cloudAuthMode.value !== "update-password") {
        cloudAuthMode.value = "sign-in";
      }
      void loadCloudRecords();
    } else {
      cloudRecords.value = [];
      cloudActiveRecordId.value = null;
      cloudLastSyncedAt.value = null;
      cloudRecordTitle.value = "";
      cloudShouldSuggestInitialUpload.value = false;
      cloudAuthMode.value = "sign-in";
      clearCloudConflict();
      cloudSyncStatus.value = "idle";
    }
  });
  fitMobileWorkbenchAfterRender();
  window.addEventListener("keydown", handleWorkbenchKeydown);
  window.addEventListener("resize", handleMobileViewportChange);
  window.addEventListener(pwaUpdateAvailableEvent, handlePwaUpdateAvailable);
  window.visualViewport?.addEventListener("resize", handleMobileViewportChange);
  window.screen.orientation?.addEventListener("change", handleMobileViewportChange);
});

onBeforeUnmount(() => {
  cloudAuthUnsubscribe?.();
  cloudAuthUnsubscribe = null;
  window.removeEventListener("keydown", handleWorkbenchKeydown);
  window.removeEventListener("resize", handleMobileViewportChange);
  window.removeEventListener(pwaUpdateAvailableEvent, handlePwaUpdateAvailable);
  window.visualViewport?.removeEventListener("resize", handleMobileViewportChange);
  window.screen.orientation?.removeEventListener("change", handleMobileViewportChange);

  if (shareLinkFeedbackTimer) {
    window.clearTimeout(shareLinkFeedbackTimer);
  }

  if (buildPlanCopyFeedbackTimer) {
    window.clearTimeout(buildPlanCopyFeedbackTimer);
  }
});
</script>

<template>
  <main class="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-background xl:h-screen xl:min-h-[720px]">
    <WorkbenchHeader
      :clear-wires="clearWires"
      :export-workbench-image="exportWorkbenchImage"
      :github-repository-url="githubRepositoryUrl"
      :reset-demo="resetDemo"
      :saved-workspace-label="savedWorkspaceLabel"
      :set-zoom="board.setZoom"
      :simulation="simulation"
      :zoom="board.zoom"
    />

    <section class="relative grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[224px_minmax(700px,1fr)_340px]">
      <div
        v-if="palettePanelOpen || statusPanelOpen"
        class="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] xl:hidden"
        @click="palettePanelOpen = false; statusPanelOpen = false"
      />

      <ComponentPalette
        :open="palettePanelOpen"
        @add-part="addPart"
        @close="palettePanelOpen = false"
      />

      <WorkbenchCanvas
        :active-lesson="activeLesson"
        :apply-pwa-update="applyPwaUpdate"
        :battery-polarity-label="batteryPolarityLabel"
        :bulb-brightness="bulbBrightness"
        :buzzer-status="buzzerStatus"
        :capacitor-status="capacitorStatus"
        :clear-canvas-selection="clearCanvasSelection"
        :clear-endpoint-hover="clearEndpointHover"
        :clear-wire-hover="clearWireHover"
        :clear-wires="clearWires"
        :close-lesson-complete-panel="closeLessonCompletePanel"
        :current-animation-duration="currentAnimationDuration"
        :dismiss-pwa-update="dismissPwaUpdate"
        :end-canvas-gesture="endCanvasGesture"
        :end-drag="endDrag"
        :endpoint-drag="endpointDrag"
        :endpoint-fill="endpointFill"
        :endpoint-radius="endpointRadius"
        :endpoint-stroke-width="endpointStrokeWidth"
        :export-workbench-image="exportWorkbenchImage"
        :finish-new-wire-drag="finishNewWireDrag"
        :get-terminal-position="getTerminalPosition"
        :github-repository-url="githubRepositoryUrl"
        :handle-canvas-pointer-down="handleCanvasPointerDown"
        :handle-canvas-pointer-move="handleCanvasPointerMove"
        :handle-part-pointer-down="handlePartPointerDown"
        :handle-terminal-click="handleTerminalClick"
        :handle-workbench-pointer-move="handleWorkbenchPointerMove"
        :is-lesson-part-target="isLessonPartTarget"
        :is-lesson-terminal-target="isLessonTerminalTarget"
        :is-terminal-drop-target="isTerminalDropTarget"
        :is-terminal-selected="isTerminalSelected"
        :is-wire-highlighted="isWireHighlighted"
        :ammeter-status="ammeterStatus"
        :diode-status="diodeStatus"
        :led-status="ledStatus"
        :lesson-complete="lessonComplete"
        :lesson-complete-panel-open="lessonCompletePanelOpen"
        :lesson-progress="lessonProgress"
        :load-next-lesson="loadNextLesson"
        :mobile-lesson-strip-text="mobileLessonStripText"
        :effective-workbench-height="effectiveWorkbenchSize.height"
        :effective-workbench-width="effectiveWorkbenchSize.width"
        :motor-status="motorStatus"
        :new-wire-drag="newWireDrag"
        :new-wire-drag-path="newWireDragPath"
        :palette-panel-open="palettePanelOpen"
        :part-style="partStyle"
        :parts="parts"
        :pwa-update-registration="pwaUpdateRegistration"
        :rendered-wires="renderedWires"
        :reset-demo="resetDemo"
        :reset-mobile-view="resetMobileView"
        :rewiring="rewiring"
        :select-wire="selectWire"
        :selected-part-id="selectedPartId"
        :selected-terminal="selectedTerminal"
        :selected-wire="selectedWire"
        :set-canvas-viewport="setCanvasViewportElement"
        :set-endpoint-hover="setEndpointHover"
        :set-resistance="setResistance"
        :set-wire-hover="setWireHover"
        :set-workbench-element="setWorkbenchElement"
        :set-zoom="board.setZoom"
        :simulation="simulation"
        :start-endpoint-drag="startEndpointDrag"
        :start-new-wire-drag="startNewWireDrag"
        :status-panel-open="statusPanelOpen"
        :terminal-display-label="terminalDisplayLabel"
        :terminal-label="terminalLabel"
        :terminal-style="terminalStyle"
        :toggle-battery-polarity="toggleBatteryPolarity"
        :toggle-switch="toggleSwitch"
        :update-new-wire-drag="updateNewWireDrag"
        :voltmeter-status="voltmeterStatus"
        :wire-endpoint-position="wireEndpointPosition"
        :wire-path="wirePath"
        :wire-stroke="wireStroke"
        :wire-stroke-width="wireStrokeWidth"
        :zoom="board.zoom"
        @open-palette="palettePanelOpen = true; statusPanelOpen = false"
        @open-status-tab="openMobileStatusPanel"
        @toggle-status="statusPanelOpen = !statusPanelOpen; palettePanelOpen = false"
      />

      <StatusPanel
        v-model:active-lesson-id="activeLessonId"
        v-model:cloud-email="cloudEmail"
        v-model:cloud-password="cloudPassword"
        v-model:cloud-password-confirm="cloudPasswordConfirm"
        v-model:cloud-record-title="cloudRecordTitle"
        v-model:record-title="recordTitle"
        v-model:tab="statusPanelTab"
        :active-buzzer-count="activeBuzzerCount"
        :active-ammeter-count="activeAmmeterCount"
        :active-lesson="activeLesson"
        :active-motor-count="activeMotorCount"
        :active-voltmeter-count="activeVoltmeterCount"
        :ammeter-status="ammeterStatus"
        :battery-polarity-label="batteryPolarityLabel"
        :buzzer-status="buzzerStatus"
        :capacitor-status="capacitorStatus"
        :cloud-active-record-id="cloudActiveRecordId"
        :cloud-auth-busy="cloudAuthBusy"
        :cloud-auth-error="cloudAuthError"
        :cloud-auth-help-text="cloudAuthHelpText"
        :cloud-auth-message="cloudAuthMessage"
        :cloud-auth-mode="cloudAuthMode"
        :cloud-auth-submit-label="cloudAuthSubmitLabel"
        :cloud-auth-title="cloudAuthTitle"
        :cloud-config="cloudConfig"
        :cloud-pending-snapshot="cloudPendingSnapshot"
        :cloud-records="cloudRecords"
        :cloud-records-busy="cloudRecordsBusy"
        :cloud-records-error="cloudRecordsError"
        :cloud-records-message="cloudRecordsMessage"
        :cloud-save-label="cloudSaveLabel"
        :cloud-should-suggest-initial-upload="cloudShouldSuggestInitialUpload"
        :cloud-sync-badge-class="cloudSyncBadgeClass"
        :cloud-sync-description="cloudSyncDescription"
        :cloud-sync-label="cloudSyncLabel"
        :cloud-sync-state="cloudSyncState"
        :cloud-user-email="cloudUserEmail"
        :dismiss-cloud-initial-upload-suggestion="dismissCloudInitialUploadSuggestion"
        :format-saved-time="formatSavedTime"
        :handle-cloud-sign-out="handleCloudSignOut"
        :has-buzzer-parts="hasBuzzerParts"
        :has-motor-parts="hasMotorParts"
        :import-workspace-json="importWorkspaceJson"
        :diode-status="diodeStatus"
        :diode-warnings="diodeWarnings"
        :led-status="ledStatus"
        :led-warnings="ledWarnings"
        :lesson-progress="lessonProgress"
        :lesson-step-states="lessonStepStates"
        :load-cloud-record="loadCloudRecord"
        :load-cloud-records="loadCloudRecords"
        :load-lesson-workspace="loadLessonWorkspace"
        :load-saved-record="loadSavedRecord"
        :main-bulb-brightness="mainBulbBrightness"
        :motor-status="motorStatus"
        :next-lesson-step="nextLessonStep"
        :open="statusPanelOpen"
        :physical-build-plan="physicalBuildPlan"
        :physical-build-plan-copy-state="buildPlanCopyState"
        :primary-battery="primaryBattery"
        :remove-cloud-record="removeCloudRecord"
        :remove-saved-record="removeSavedRecord"
        :remove-selected-part="removeSelectedPart"
        :remove-wire="removeWire"
        :rename-cloud-record="renameCloudRecord"
        :request-cloud-auth="requestCloudAuth"
        :rewiring="rewiring"
        :save-workspace-record="saveWorkspaceRecord"
        :save-workspace-to-cloud="saveWorkspaceToCloud"
        :saved-records="savedRecords"
        :select-wire="selectWire"
        :selected-part="selectedPart"
        :selected-wire="selectedWire"
        :selected-wire-id="selectedWireId"
        :set-cloud-auth-mode="setCloudAuthMode"
        :set-resistance="setResistance"
        :share-link-state="shareLinkState"
        :shared-workspace-loaded="sharedWorkspaceLoaded"
        :simulation="simulation"
        :start-rewire="startRewire"
        :toggle-battery-polarity="toggleBatteryPolarity"
        :toggle-switch="toggleSwitch"
        :voltmeter-status="voltmeterStatus"
        :wire-label="wireLabel"
        :wires="wires"
        @close="statusPanelOpen = false"
        @copy-physical-build-plan="copyPhysicalBuildPlan"
        @copy-workspace-share-link="copyWorkspaceShareLink"
        @export-physical-build-plan="exportPhysicalBuildPlan"
        @export-workspace-json="exportWorkspaceJson"
      />
    </section>
  </main>
</template>
