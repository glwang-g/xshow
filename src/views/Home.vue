<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { lessonCatalog, type LessonCheckId, type LessonWorkspace } from "@/data/lessons";
import {
  BatteryCharging,
  Cable,
  Check,
  CircuitBoard,
  CircleDot,
  Download,
  FileDown,
  FileUp,
  Gauge,
  FolderOpen,
  GitFork,
  Link,
  Lightbulb,
  LocateFixed,
  PackagePlus,
  Plus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  TriangleAlert,
  Trophy,
  Unplug,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import { pwaUpdateAvailableEvent } from "@/pwa";
import { useBoardStore } from "@/stores/board";

type PartType = "battery" | "bulb" | "switch" | "resistor" | "led";
type TerminalKey = "a" | "b";

type TerminalRef = {
  partId: string;
  terminal: TerminalKey;
};

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

type CircuitPart = {
  id: string;
  name: string;
  type: PartType;
  x: number;
  y: number;
  closed?: boolean;
  resistance?: number;
};

type Wire = {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
};

type WireEnd = "from" | "to";

type Edge = {
  from: string;
  to: string;
  partId?: string;
  wireId?: string;
};

type LedState = {
  brightness: number;
  brightnessPercent: number;
  forward: boolean;
  overCurrent: boolean;
  reversed: boolean;
};

type PersistedWorkspace = LessonWorkspace & {
  activeLessonId: string;
  savedAt: string;
  version: 1;
};

type SavedWorkspaceRecord = PersistedWorkspace & {
  id: string;
  title: string;
};

const savedWorkspaceKey = "xshow.workspace.v1";
const savedRecordsKey = "xshow.workspace.records.v1";
const workspaceShareParam = "workspace";
const githubRepositoryUrl = "https://github.com/glwang-g/xshow";
const board = useBoardStore();
const canvasViewportRef = ref<HTMLElement | null>(null);
const workspaceImportRef = ref<HTMLInputElement | null>(null);
const workbenchRef = ref<HTMLElement | null>(null);
const activeLessonId = ref(lessonCatalog[0].id);
const lastSavedAt = ref<string | null>(null);
const recordTitle = ref("");
const savedRecords = ref<SavedWorkspaceRecord[]>([]);
const shareLinkCopied = ref(false);
const pwaUpdateRegistration = ref<ServiceWorkerRegistration | null>(null);
const palettePanelOpen = ref(false);
const statusPanelOpen = ref(false);
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

const workbench = {
  width: 1060,
  height: 640,
};
const bulbOhms = 18;
const ledOhms = 28;
const ledSafeCurrentMilliAmps = 65;

const partSpecs: Record<
  PartType,
  {
    icon: unknown;
    label: string;
    width: number;
    height: number;
    terminals: Record<TerminalKey, { x: number; y: number; label: string }>;
  }
> = {
  battery: {
    icon: BatteryCharging,
    label: "电池",
    width: 176,
    height: 104,
    terminals: {
      a: { x: 0, y: 52, label: "-" },
      b: { x: 176, y: 52, label: "+" },
    },
  },
  switch: {
    icon: ToggleRight,
    label: "开关",
    width: 168,
    height: 96,
    terminals: {
      a: { x: 0, y: 48, label: "A" },
      b: { x: 168, y: 48, label: "B" },
    },
  },
  bulb: {
    icon: Lightbulb,
    label: "灯泡",
    width: 156,
    height: 156,
    terminals: {
      a: { x: 0, y: 78, label: "A" },
      b: { x: 156, y: 78, label: "B" },
    },
  },
  resistor: {
    icon: SlidersHorizontal,
    label: "可变电阻",
    width: 216,
    height: 110,
    terminals: {
      a: { x: 0, y: 55, label: "A" },
      b: { x: 216, y: 55, label: "B" },
    },
  },
  led: {
    icon: CircleDot,
    label: "LED",
    width: 156,
    height: 128,
    terminals: {
      a: { x: 0, y: 64, label: "-" },
      b: { x: 156, y: 64, label: "+" },
    },
  },
};

const palette: Array<{ type: PartType; description: string }> = [
  { type: "battery", description: "9V 电源" },
  { type: "switch", description: "控制通断" },
  { type: "bulb", description: "显示亮度" },
  { type: "resistor", description: "调节电流" },
  { type: "led", description: "有正负极" },
];

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
const mainBulb = computed(() => parts.value.find((part) => part.type === "bulb"));
const mainBulbBrightness = computed(() =>
  mainBulb.value ? simulation.value.bulbs[mainBulb.value.id]?.brightness ?? 0 : 0,
);
const ledWarnings = computed(() =>
  Object.values(simulation.value.leds).filter((state) => state.overCurrent || state.reversed),
);
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

let autosaveTimer: number | null = null;
let shareLinkCopiedTimer: number | null = null;

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

function getSpec(part: CircuitPart | PartType) {
  return partSpecs[typeof part === "string" ? part : part.type];
}

function partIcon(type: PartType) {
  return partSpecs[type].icon;
}

function terminalId(ref: TerminalRef) {
  return `${ref.partId}:${ref.terminal}`;
}

function sameTerminal(left: TerminalRef, right: TerminalRef) {
  return left.partId === right.partId && left.terminal === right.terminal;
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

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;
}

function mobileContentBounds() {
  const margin = 56;
  let minX = workbench.width;
  let minY = workbench.height;
  let maxX = 0;
  let maxY = 0;

  for (const part of parts.value) {
    const spec = getSpec(part);
    minX = Math.min(minX, part.x - margin);
    minY = Math.min(minY, part.y - margin);
    maxX = Math.max(maxX, part.x + spec.width + margin);
    maxY = Math.max(maxY, part.y + spec.height + margin);
  }

  for (const wire of wires.value) {
    for (const point of wireRoutePoints(wire)) {
      minX = Math.min(minX, point.x - margin);
      minY = Math.min(minY, point.y - margin);
      maxX = Math.max(maxX, point.x + margin);
      maxY = Math.max(maxY, point.y + margin);
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return { height: workbench.height, minX: 0, minY: 0, width: workbench.width };
  }

  minX = clamp(minX, 0, workbench.width);
  minY = clamp(minY, 0, workbench.height);
  maxX = clamp(maxX, 0, workbench.width);
  maxY = clamp(maxY, 0, workbench.height);

  return {
    height: Math.max(1, maxY - minY),
    minX,
    minY,
    width: Math.max(1, maxX - minX),
  };
}

function mobileFitZoom() {
  const viewport = canvasViewportRef.value;
  if (!viewport) {
    return 72;
  }

  const bounds = mobileContentBounds();
  const horizontalPadding = 24;
  const bottomControlsSpace = 112;
  const availableWidth = Math.max(280, viewport.clientWidth - horizontalPadding);
  const availableHeight = Math.max(260, viewport.clientHeight - bottomControlsSpace);
  return Math.floor(Math.min(availableWidth / bounds.width, availableHeight / bounds.height) * 100);
}

function fitMobileWorkbench(behavior: ScrollBehavior = "auto") {
  if (typeof window === "undefined" || isDesktopViewport() || !canvasViewportRef.value) {
    return;
  }

  const bounds = mobileContentBounds();
  board.setZoom(mobileFitZoom());
  window.requestAnimationFrame(() => {
    const scale = board.zoom / 100;
    canvasViewportRef.value?.scrollTo({
      behavior,
      left: Math.max(0, bounds.minX * scale - 12),
      top: Math.max(0, bounds.minY * scale - 12),
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

function roundedRectPath(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius = 8) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function partExportColors(part: CircuitPart) {
  if (part.type === "battery") {
    return { background: "#0f172a", foreground: "#ffffff", muted: "#67e8f9" };
  }

  if (part.type === "bulb") {
    return { background: "#fffbeb", foreground: "#78350f", muted: "#f59e0b" };
  }

  if (part.type === "resistor") {
    return { background: "#ecfeff", foreground: "#164e63", muted: "#0e7490" };
  }

  if (part.type === "led") {
    return { background: "#fff1f2", foreground: "#881337", muted: "#e11d48" };
  }

  return { background: "#ffffff", foreground: "#0f172a", muted: part.closed ? "#10b981" : "#f43f5e" };
}

function drawExportPart(context: CanvasRenderingContext2D, part: CircuitPart) {
  const spec = getSpec(part);
  const colors = partExportColors(part);

  context.save();
  roundedRectPath(context, part.x, part.y, spec.width, spec.height, 8);
  context.fillStyle = colors.background;
  context.fill();
  context.lineWidth = selectedPartId.value === part.id ? 4 : 2;
  context.strokeStyle = selectedPartId.value === part.id ? "#0f172a" : "#cbd5e1";
  context.stroke();

  context.fillStyle = colors.foreground;
  context.font = "600 18px Inter, sans-serif";
  context.fillText(part.name, part.x + 18, part.y + 30);

  context.font = "12px Inter, sans-serif";
  context.fillStyle = colors.muted;

  if (part.type === "battery") {
    context.fillText("9V power", part.x + 18, part.y + 52);
    context.fillRect(part.x + 18, part.y + 70, 26, 12);
    context.fillRect(part.x + 50, part.y + 66, 32, 20);
  } else if (part.type === "switch") {
    context.fillText(part.closed ? "closed" : "open", part.x + 18, part.y + 52);
    context.strokeStyle = colors.muted;
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(part.x + 24, part.y + 72);
    context.lineTo(part.x + (part.closed ? 136 : 92), part.y + (part.closed ? 72 : 52));
    context.stroke();
  } else if (part.type === "bulb") {
    const brightness = simulation.value.bulbs[part.id]?.brightness ?? 0;
    context.fillText(`${Math.round(brightness * 100)}% brightness`, part.x + 18, part.y + spec.height - 20);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 78, 34, 0, Math.PI * 2);
    context.fillStyle = `rgba(245, 158, 11, ${0.18 + brightness * 0.72})`;
    context.fill();
    context.strokeStyle = "#f59e0b";
    context.stroke();
  } else if (part.type === "resistor") {
    context.fillText(`${part.resistance ?? 0} ohm`, part.x + 18, part.y + 52);
    context.strokeStyle = colors.muted;
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(part.x + 20, part.y + 76);
    context.lineTo(part.x + spec.width - 20, part.y + 76);
    context.stroke();
  } else if (part.type === "led") {
    const state = ledStatus(part);
    context.fillText(`${state.brightnessPercent}% LED`, part.x + 18, part.y + spec.height - 18);
    context.beginPath();
    context.arc(part.x + spec.width / 2, part.y + 62, 30, 0, Math.PI * 2);
    context.fillStyle = `rgba(244, 63, 94, ${0.14 + state.brightness * 0.78})`;
    context.fill();
    context.strokeStyle = state.reversed ? "#64748b" : "#e11d48";
    context.stroke();
    context.fillStyle = colors.foreground;
    context.fillText(state.reversed ? "reversed" : "+ to -", part.x + 18, part.y + 52);
  }

  for (const terminal of ["a", "b"] as TerminalKey[]) {
    const offset = spec.terminals[terminal];
    context.beginPath();
    context.arc(part.x + offset.x, part.y + offset.y, 9, 0, Math.PI * 2);
    context.fillStyle = "#0f172a";
    context.fill();
    context.lineWidth = 3;
    context.strokeStyle = "#ffffff";
    context.stroke();
  }

  context.restore();
}

function exportWorkbenchImage() {
  if (typeof document === "undefined") {
    return;
  }

  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = workbench.width * scale;
  canvas.height = workbench.height * scale;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  context.scale(scale, scale);
  context.fillStyle = "#f8faf7";
  context.fillRect(0, 0, workbench.width, workbench.height);

  context.strokeStyle = "rgba(148, 163, 184, 0.45)";
  context.lineWidth = 1;
  for (let x = 0; x <= workbench.width; x += 28) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, workbench.height);
    context.stroke();
  }
  for (let y = 0; y <= workbench.height; y += 28) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(workbench.width, y);
    context.stroke();
  }

  context.lineCap = "round";
  context.lineJoin = "round";
  for (const wire of wires.value) {
    context.strokeStyle = wireStroke(wire);
    context.lineWidth = wireStrokeWidth(wire);
    context.stroke(new Path2D(wirePath(wire)));
  }

  for (const part of parts.value) {
    drawExportPart(context, part);
  }

  context.fillStyle = "rgba(255, 255, 255, 0.92)";
  roundedRectPath(context, 18, 18, 330, 72, 8);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.stroke();
  context.fillStyle = "#0f172a";
  context.font = "600 16px Inter, sans-serif";
  context.fillText("xshow circuits", 34, 42);
  context.font = "13px Inter, sans-serif";
  context.fillStyle = "#475569";
  context.fillText(activeLesson.value.title, 34, 62);
  context.fillText(
    `${simulation.value.closed ? "回路闭合" : "回路断开"} · ${simulation.value.currentMilliAmps} mA`,
    34,
    80,
  );

  const link = document.createElement("a");
  link.download = `xshow-circuit-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
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
  const startLead = {
    x: clamp(start.x + startSide * lead, margin, workbench.width - margin),
    y: start.y,
  };
  const endLead = {
    x: clamp(end.x + endSide * lead, margin, workbench.width - margin),
    y: end.y,
  };
  const route: Point[] = [start, startLead];

  if (startSide === endSide) {
    const outsideX =
      startSide > 0
        ? clamp(Math.max(startLead.x, endLead.x) + 72, margin, workbench.width - margin)
        : clamp(Math.min(startLead.x, endLead.x) - 72, margin, workbench.width - margin);

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

  return simulation.value.closed ? "#0891b2" : "#64748b";
}

function wireStrokeWidth(wire: Wire) {
  if (selectedWireId.value === wire.id || endpointDrag.value?.wireId === wire.id) {
    return 7;
  }

  return hoveredWireId.value === wire.id ? 6 : 5;
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

  return `${part.name}${getSpec(part).terminals[ref.terminal].label}`;
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
    endpointDrag.value.x = Math.min(workbench.width, Math.max(0, nextPoint.x));
    endpointDrag.value.y = Math.min(workbench.height, Math.max(0, nextPoint.y));
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
  const spec = getSpec(part);
  part.x = Math.round(Math.min(workbench.width - spec.width - 16, Math.max(16, point.x - dragging.value.offsetX)));
  part.y = Math.round(Math.min(workbench.height - spec.height - 16, Math.max(16, point.y - dragging.value.offsetY)));
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
  newWireDrag.value.x = Math.min(workbench.width, Math.max(0, nextPoint.x));
  newWireDrag.value.y = Math.min(workbench.height, Math.max(0, nextPoint.y));
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

function addPart(type: PartType) {
  const index = parts.value.filter((part) => part.type === type).length + 1;
  const spec = getSpec(type);
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
  palettePanelOpen.value = false;
}

function removeSelectedPart() {
  const selected = selectedPart.value;
  if (!selected || parts.value.length <= 1) {
    return;
  }

  parts.value = parts.value.filter((part) => part.id !== selected.id);
  wires.value = wires.value.filter(
    (wire) => wire.from.partId !== selected.id && wire.to.partId !== selected.id,
  );
  selectedPartId.value = parts.value[0]?.id ?? "";
  clearInteractionState();
}

function removeWire(wireId: string) {
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
  wires.value = [];
  clearInteractionState();
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

function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedWorkspace>;
  return (
    candidate.version === 1 &&
    typeof candidate.activeLessonId === "string" &&
    typeof candidate.selectedPartId === "string" &&
    typeof candidate.savedAt === "string" &&
    typeof candidate.zoom === "number" &&
    Array.isArray(candidate.parts) &&
    Array.isArray(candidate.wires)
  );
}

function isSavedWorkspaceRecord(value: unknown): value is SavedWorkspaceRecord {
  if (!isPersistedWorkspace(value)) {
    return false;
  }

  const candidate = value as Partial<SavedWorkspaceRecord>;
  return typeof candidate.id === "string" && typeof candidate.title === "string";
}

function formatSavedTime(savedAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(savedAt));
}

function loadWorkspaceSnapshot(workspace: PersistedWorkspace) {
  activeLessonId.value = lessonCatalog.some((lesson) => lesson.id === workspace.activeLessonId)
    ? workspace.activeLessonId
    : lessonCatalog[0].id;
  loadWorkspace(workspace);
  lastSavedAt.value = workspace.savedAt;
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
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

function scheduleWorkspaceSave() {
  if (typeof window === "undefined") {
    return;
  }

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

async function copyWorkspaceShareLink() {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(workspaceShareParam, base64UrlEncode(JSON.stringify(workspaceSnapshot())));
  const shareUrl = url.toString();

  try {
    await navigator.clipboard.writeText(shareUrl);
    shareLinkCopied.value = true;
    if (shareLinkCopiedTimer) {
      window.clearTimeout(shareLinkCopiedTimer);
    }
    shareLinkCopiedTimer = window.setTimeout(() => {
      shareLinkCopied.value = false;
      shareLinkCopiedTimer = null;
    }, 1800);
  } catch {
    window.prompt("复制这个分享链接", shareUrl);
  }
}

function openWorkspaceImport() {
  workspaceImportRef.value?.click();
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

    loadWorkspaceSnapshot(parsed);
    saveWorkspaceToStorage();
    statusPanelOpen.value = false;
  } catch {
    window.alert("读取 JSON 存档失败，请检查文件内容。");
  }
}

function loadSavedRecord(record: SavedWorkspaceRecord) {
  loadWorkspaceSnapshot(record);
  saveWorkspaceToStorage();
}

function removeSavedRecord(recordId: string) {
  savedRecords.value = savedRecords.value.filter((record) => record.id !== recordId);
  persistSavedRecords();
}

function loadLessonWorkspace(lessonId = activeLesson.value.id) {
  const lesson = lessonCatalog.find((item) => item.id === lessonId) ?? activeLesson.value;
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
  loadWorkspace({
    ...demoLesson.starterWorkspace,
    selectedPartId: "bulb-1",
  });
}

function toggleSwitch(part: CircuitPart) {
  part.closed = !part.closed;
}

function setResistance(part: CircuitPart, value: number) {
  part.resistance = Math.round(value);
}

function buildEdges(
  sourceParts: CircuitPart[],
  sourceWires: Wire[],
  excludedPartId?: string,
  conductiveLedIds = new Set<string>(),
) {
  const edges: Edge[] = sourceWires.map((wire) => ({
    from: terminalId(wire.from),
    to: terminalId(wire.to),
    wireId: wire.id,
  }));

  for (const part of sourceParts) {
    if (part.id === excludedPartId || part.type === "battery") {
      continue;
    }

    if (part.type === "switch" && !part.closed) {
      continue;
    }

    if (part.type === "led" && !conductiveLedIds.has(part.id)) {
      continue;
    }

    edges.push({
      from: `${part.id}:a`,
      to: `${part.id}:b`,
      partId: part.id,
    });
  }

  return edges;
}

function hasPath(from: string, to: string, edges: Edge[]) {
  const graph = new Map<string, string[]>();

  for (const edge of edges) {
    graph.set(edge.from, [...(graph.get(edge.from) ?? []), edge.to]);
    graph.set(edge.to, [...(graph.get(edge.to) ?? []), edge.from]);
  }

  const queue = [from];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const node = queue.shift() as string;
    if (node === to) {
      return true;
    }

    if (visited.has(node)) {
      continue;
    }

    visited.add(node);
    queue.push(...(graph.get(node) ?? []).filter((next) => !visited.has(next)));
  }

  return false;
}

function partBatteryBridgeDirection(part: CircuitPart, battery: CircuitPart, edges: Edge[]) {
  const positive = `${battery.id}:b`;
  const negative = `${battery.id}:a`;
  const a = `${part.id}:a`;
  const b = `${part.id}:b`;
  const edgesWithoutPart = edges.filter((edge) => edge.partId !== part.id);

  if (hasPath(positive, b, edgesWithoutPart) && hasPath(a, negative, edgesWithoutPart)) {
    return "forward";
  }

  if (hasPath(positive, a, edgesWithoutPart) && hasPath(b, negative, edgesWithoutPart)) {
    return "reverse";
  }

  return null;
}

function partBridgesBattery(part: CircuitPart, battery: CircuitPart, edges: Edge[]) {
  return Boolean(partBatteryBridgeDirection(part, battery, edges));
}

function wireDirectionThroughBattery(wire: Wire, battery: CircuitPart, edges: Edge[]) {
  const positive = `${battery.id}:b`;
  const negative = `${battery.id}:a`;
  const from = terminalId(wire.from);
  const to = terminalId(wire.to);
  const edgesWithoutWire = edges.filter((edge) => edge.wireId !== wire.id);

  if (hasPath(positive, from, edgesWithoutWire) && hasPath(to, negative, edgesWithoutWire)) {
    return "forward";
  }

  if (hasPath(positive, to, edgesWithoutWire) && hasPath(from, negative, edgesWithoutWire)) {
    return "reverse";
  }

  return null;
}

function evaluateCircuit(sourceParts: CircuitPart[], sourceWires: Wire[]) {
  const battery = sourceParts.find((part) => part.type === "battery");
  const bulbs = sourceParts.filter((part) => part.type === "bulb");
  const leds = sourceParts.filter((part) => part.type === "led");
  const bulbStates: Record<string, { brightness: number; brightnessPercent: number }> = {};
  const ledStates: Record<string, LedState> = {};
  const wireStates: Record<string, { active: boolean; reverse: boolean }> = {};

  if (!battery) {
    return {
      closed: false,
      currentMilliAmps: 0,
      equivalentResistance: 0,
      bulbs: bulbStates,
      leds: ledStates,
      wires: wireStates,
    };
  }

  const allLedIds = new Set(leds.map((part) => part.id));
  const orientationEdges = buildEdges(sourceParts, sourceWires, undefined, allLedIds);
  const conductiveLedIds = new Set(
    leds
      .filter((part) => partBatteryBridgeDirection(part, battery, orientationEdges) === "forward")
      .map((part) => part.id),
  );
  const edges = buildEdges(sourceParts, sourceWires, undefined, conductiveLedIds);

  const positive = `${battery.id}:b`;
  const negative = `${battery.id}:a`;
  const closed = hasPath(positive, negative, edges);
  const seriesResistors = sourceParts.filter(
    (part) => part.type === "resistor" && partBridgesBattery(part, battery, edges),
  );
  const conductingBulbs = bulbs.filter((part) => closed && partBridgesBattery(part, battery, edges));
  const conductingLeds = leds.filter((part) => closed && conductiveLedIds.has(part.id));
  const resistorOhms = seriesResistors.reduce((total, part) => total + (part.resistance ?? 0), 0);
  const loadOhms = Math.max(
    bulbOhms,
    conductingBulbs.length * bulbOhms + conductingLeds.length * ledOhms,
  );
  const equivalentResistance = closed ? loadOhms + resistorOhms : 0;
  const current = equivalentResistance > 0 ? 9 / equivalentResistance : 0;
  const currentMilliAmps = Math.round(current * 1000);

  for (const wire of sourceWires) {
    const direction = closed ? wireDirectionThroughBattery(wire, battery, edges) : null;
    wireStates[wire.id] = {
      active: Boolean(direction),
      reverse: direction === "reverse",
    };
  }

  for (const bulb of bulbs) {
    const conducting = conductingBulbs.some((part) => part.id === bulb.id);
    const normalized = conducting && equivalentResistance > 0 ? bulbOhms / equivalentResistance : 0;
    const brightness = conducting ? Math.min(1, Math.max(0.1, normalized)) : 0;

    bulbStates[bulb.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
    };
  }

  for (const led of leds) {
    const direction = partBatteryBridgeDirection(led, battery, orientationEdges);
    const conducting = closed && conductiveLedIds.has(led.id);
    const brightness = conducting ? Math.min(1, Math.max(0.18, currentMilliAmps / ledSafeCurrentMilliAmps)) : 0;

    ledStates[led.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
      forward: direction === "forward",
      overCurrent: conducting && currentMilliAmps > ledSafeCurrentMilliAmps,
      reversed: direction === "reverse",
    };
  }

  return {
    closed,
    currentMilliAmps,
    equivalentResistance,
    bulbs: bulbStates,
    leds: ledStates,
    wires: wireStates,
  };
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

onMounted(() => {
  fitMobileWorkbenchAfterRender();
  window.addEventListener("resize", handleMobileViewportChange);
  window.addEventListener(pwaUpdateAvailableEvent, handlePwaUpdateAvailable);
  window.visualViewport?.addEventListener("resize", handleMobileViewportChange);
  window.screen.orientation?.addEventListener("change", handleMobileViewportChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleMobileViewportChange);
  window.removeEventListener(pwaUpdateAvailableEvent, handlePwaUpdateAvailable);
  window.visualViewport?.removeEventListener("resize", handleMobileViewportChange);
  window.screen.orientation?.removeEventListener("change", handleMobileViewportChange);

  if (shareLinkCopiedTimer) {
    window.clearTimeout(shareLinkCopiedTimer);
  }
});
</script>

<template>
  <main class="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-background xl:h-screen xl:min-h-[720px]">
    <header class="hidden h-14 items-center justify-between gap-2 border-b bg-card px-3 xl:flex">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Sparkles class="h-4 w-4" />
        </div>
        <div class="leading-tight">
          <div class="text-sm font-semibold">xshow circuits</div>
          <div class="text-xs text-muted-foreground">电子积木实验台</div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border bg-muted/60 px-3 py-1.5 text-sm">
          <span
            class="h-2.5 w-2.5 rounded-full"
            :class="simulation.closed ? 'bg-emerald-500' : 'bg-rose-500'"
          />
          <span class="font-medium">{{ simulation.closed ? "回路闭合" : "回路断开" }}</span>
          <span class="text-muted-foreground">{{ simulation.currentMilliAmps }} mA</span>
        </div>
        <div class="hidden items-center gap-2 rounded-md border bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground md:flex">
          <Save class="h-4 w-4" />
          <span>{{ savedWorkspaceLabel }}</span>
        </div>
        <div class="hidden items-center gap-1 rounded-md border bg-muted/60 p-1 md:flex">
          <Button variant="ghost" size="icon" title="缩小" @click="board.setZoom(board.zoom - 5)">
            <ZoomOut class="h-4 w-4" />
          </Button>
          <div class="min-w-14 text-center text-sm tabular-nums">{{ board.zoom }}%</div>
          <Button variant="ghost" size="icon" title="放大" @click="board.setZoom(board.zoom + 5)">
            <ZoomIn class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <a
          :href="githubRepositoryUrl"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
          title="GitHub 仓库"
          aria-label="打开 GitHub 仓库"
        >
          <GitFork class="h-4 w-4" />
          <span class="hidden sm:inline">GitHub</span>
        </a>
        <Button variant="outline" size="sm" @click="clearWires">
          <Unplug class="h-4 w-4" />
          清线
        </Button>
        <Button variant="outline" size="sm" @click="exportWorkbenchImage">
          <Download class="h-4 w-4" />
          导出
        </Button>
        <Button size="sm" @click="resetDemo">
          <RotateCcw class="h-4 w-4" />
          复位
        </Button>
      </div>
    </header>

    <section class="relative grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[260px_minmax(700px,1fr)_320px]">
      <div
        v-if="palettePanelOpen || statusPanelOpen"
        class="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] xl:hidden"
        @click="palettePanelOpen = false; statusPanelOpen = false"
      />

      <aside
        class="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,320px)] min-h-0 flex-col border-r bg-card shadow-panel transition-transform duration-200 xl:static xl:z-auto xl:w-auto xl:translate-x-0 xl:shadow-none"
        :class="palettePanelOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="flex items-center justify-between border-b px-3 py-2 xl:px-4 xl:py-3">
          <div>
            <div class="text-sm font-semibold">元器件</div>
            <div class="text-xs text-muted-foreground">点击添加到桌面，触屏可拖动和连线</div>
          </div>
          <Button class="xl:hidden" variant="ghost" size="icon" title="关闭器件面板" @click="palettePanelOpen = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 xl:p-4">
          <section class="space-y-2">
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-1">
              <button
                v-for="item in palette"
                :key="item.type"
                class="flex w-full items-center justify-between rounded-md border bg-background px-3 py-3 text-left transition-colors hover:bg-muted"
                @click="addPart(item.type)"
              >
                <span class="flex min-w-0 items-center gap-3">
                  <span class="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-foreground">
                    <component :is="partIcon(item.type)" class="h-4 w-4" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-medium">{{ getSpec(item.type).label }}</span>
                    <span class="block truncate text-xs text-muted-foreground">{{ item.description }}</span>
                  </span>
                </span>
                <Plus class="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </div>
          </section>
        </div>
      </aside>

      <section
        ref="canvasViewportRef"
        class="relative min-h-0 touch-none overflow-auto canvas-grid xl:touch-auto xl:overflow-hidden"
        @pointerdown="handleCanvasPointerDown"
        @pointermove="handleCanvasPointerMove"
        @pointerup="endCanvasGesture"
        @pointercancel="endCanvasGesture"
        @pointerleave="endCanvasGesture"
      >
        <div class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-md border bg-card/95 p-1 shadow-panel xl:hidden">
          <Button
            :class="palettePanelOpen ? 'bg-cyan-100 text-cyan-950 hover:bg-cyan-100' : ''"
            :aria-pressed="palettePanelOpen"
            variant="ghost"
            size="icon"
            title="打开器件面板"
            @click="palettePanelOpen = true; statusPanelOpen = false"
          >
            <PackagePlus class="h-4 w-4" />
          </Button>
          <Button
            :class="statusPanelOpen ? 'bg-cyan-100 text-cyan-950 hover:bg-cyan-100' : ''"
            :aria-pressed="statusPanelOpen"
            variant="ghost"
            size="icon"
            title="显示状态面板"
            @click="statusPanelOpen = !statusPanelOpen; palettePanelOpen = false"
          >
            <Gauge class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="清线" @click="clearWires">
            <Unplug class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="导出图片" @click="exportWorkbenchImage">
            <Download class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="回正视图" @click="resetMobileView">
            <LocateFixed class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="缩小" @click="board.setZoom(board.zoom - 5)">
            <ZoomOut class="h-4 w-4" />
          </Button>
          <div class="min-w-12 text-center text-xs tabular-nums">{{ board.zoom }}%</div>
          <Button variant="ghost" size="icon" title="放大" @click="board.setZoom(board.zoom + 5)">
            <ZoomIn class="h-4 w-4" />
          </Button>
        </div>

        <section
          v-if="lessonCompletePanelOpen"
          class="fixed bottom-24 left-3 right-3 z-30 rounded-md border border-emerald-200 bg-card/95 p-4 shadow-panel sm:left-auto sm:w-[22rem] xl:bottom-5 xl:right-[340px]"
        >
          <div class="mb-3 flex items-start gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-800">
              <Trophy class="h-5 w-5" />
            </span>
            <div class="min-w-0">
              <div class="text-sm font-semibold">实验完成</div>
              <div class="mt-1 text-xs leading-5 text-muted-foreground">
                {{ activeLesson.title }} 的 {{ lessonProgress.total }} 个步骤已经全部完成。
              </div>
            </div>
            <Button variant="ghost" size="icon" title="关闭完成提示" @click="closeLessonCompletePanel">
              <X class="h-4 w-4" />
            </Button>
          </div>
          <div class="mb-3 h-2 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-emerald-500" style="width: 100%" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" @click="closeLessonCompletePanel">
              继续探索
            </Button>
            <Button size="sm" @click="loadNextLesson">
              下一个实验
            </Button>
          </div>
        </section>

        <section
          v-if="pwaUpdateRegistration"
          class="fixed bottom-24 left-3 right-3 z-40 rounded-md border bg-card/95 p-3 shadow-panel sm:left-auto sm:w-[22rem] xl:bottom-5 xl:right-[340px]"
        >
          <div class="mb-3 flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-900">
              <RotateCcw class="h-4 w-4" />
            </span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold">新版本可用</div>
              <div class="mt-1 text-xs leading-5 text-muted-foreground">刷新后会加载最新实验台。</div>
            </div>
            <Button variant="ghost" size="icon" title="稍后" @click="dismissPwaUpdate">
              <X class="h-4 w-4" />
            </Button>
          </div>
          <Button class="w-full" size="sm" @click="applyPwaUpdate">
            <RotateCcw class="h-4 w-4" />
            刷新到新版
          </Button>
        </section>

        <div class="hidden w-max max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-md border bg-card/95 px-3 py-2 shadow-panel xl:absolute xl:left-4 xl:top-4 xl:z-20 xl:flex">
          <CircuitBoard class="h-4 w-4 text-cyan-700" />
          <span class="text-sm font-medium">Workbench</span>
          <span v-if="endpointDrag?.over" class="text-xs text-muted-foreground">
            松开连接到 {{ terminalLabel(endpointDrag.over) }}
          </span>
          <span v-else-if="endpointDrag" class="text-xs text-muted-foreground">
            拖到新的端子上松开
          </span>
          <span v-else-if="newWireDrag?.over" class="text-xs text-muted-foreground">
            松开连接到 {{ terminalLabel(newWireDrag.over) }}
          </span>
          <span v-else-if="newWireDrag" class="text-xs text-muted-foreground">
            拖到另一个端子上松开
          </span>
          <span v-else-if="rewiring && selectedWire" class="text-xs text-muted-foreground">
            重接{{ rewiring.end === "from" ? "左端" : "右端" }}：点击新的端子
          </span>
          <span v-if="selectedTerminal" class="text-xs text-muted-foreground">
            {{ getPart(selectedTerminal.partId)?.name }} {{ getSpec(getPart(selectedTerminal.partId) ?? "battery").terminals[selectedTerminal.terminal].label }}
          </span>
        </div>

        <div
          ref="workbenchRef"
          class="relative mx-3 mb-24 mt-3 origin-top-left overflow-hidden rounded-md border bg-[#f8faf7] shadow-panel xl:absolute xl:left-1/2 xl:top-1/2 xl:m-0 xl:origin-center xl:-translate-x-1/2 xl:-translate-y-1/2"
          data-circuit-surface="true"
          :style="{
            width: `${workbench.width}px`,
            height: `${workbench.height}px`,
            scale: `${board.zoom / 100}`,
          }"
          @pointermove="handleWorkbenchPointerMove"
          @pointerup="endDrag"
          @pointerleave="endDrag"
          @pointerdown.self="clearCanvasSelection"
        >
          <svg class="pointer-events-none absolute inset-0 z-30 h-full w-full">
            <path
              v-if="newWireDrag"
              class="wire-draft"
              :d="newWireDragPath()"
              fill="none"
              stroke-linecap="round"
              stroke-width="6"
            />
            <circle
              v-if="newWireDrag?.over"
              class="wire-snap-halo"
              :cx="getTerminalPosition(newWireDrag.over).x"
              :cy="getTerminalPosition(newWireDrag.over).y"
              r="18"
            />
            <g
              v-for="wire in renderedWires"
              :key="wire.id"
            >
              <path
                class="pointer-events-auto cursor-pointer"
                data-circuit-interactive="true"
                :d="wirePath(wire)"
                fill="none"
                pointer-events="stroke"
                stroke="transparent"
                stroke-linecap="round"
                stroke-width="22"
                @click.stop="selectWire(wire.id)"
                @pointerdown.stop
                @pointerenter="setWireHover(wire.id)"
                @pointerleave="clearWireHover(wire.id)"
              />
              <path
                :class="isWireHighlighted(wire) ? 'wire-hover-glow' : ''"
                :d="wirePath(wire)"
                fill="none"
                :stroke="wireStroke(wire)"
                stroke-linecap="round"
                :stroke-width="wireStrokeWidth(wire)"
              />
              <path
                v-if="simulation.wires[wire.id]?.active"
                class="wire-current"
                :class="simulation.wires[wire.id]?.reverse ? 'wire-current-reverse' : ''"
                :d="wirePath(wire)"
                fill="none"
                stroke="#fef3c7"
                stroke-linecap="round"
                stroke-width="4"
                :style="{ '--wire-current-duration': currentAnimationDuration }"
              />
              <circle
                v-if="endpointDrag?.over && endpointDrag.wireId === wire.id"
                class="wire-snap-halo"
                :cx="getTerminalPosition(endpointDrag.over).x"
                :cy="getTerminalPosition(endpointDrag.over).y"
                r="18"
              />
              <circle
                class="pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
                data-circuit-interactive="true"
                :cx="wireEndpointPosition(wire, 'from').x"
                :cy="wireEndpointPosition(wire, 'from').y"
                :r="endpointRadius(wire, 'from')"
                :fill="endpointFill(wire, 'from')"
                stroke="#fff"
                :stroke-width="endpointStrokeWidth(wire, 'from')"
                @click.stop="selectWire(wire.id)"
                @pointerdown.stop="startEndpointDrag($event, wire, 'from')"
                @pointerenter="setEndpointHover(wire.id, 'from')"
                @pointerleave="clearEndpointHover(wire.id, 'from')"
              />
              <circle
                class="pointer-events-auto cursor-grab touch-none active:cursor-grabbing"
                data-circuit-interactive="true"
                :cx="wireEndpointPosition(wire, 'to').x"
                :cy="wireEndpointPosition(wire, 'to').y"
                :r="endpointRadius(wire, 'to')"
                :fill="endpointFill(wire, 'to')"
                stroke="#fff"
                :stroke-width="endpointStrokeWidth(wire, 'to')"
                @click.stop="selectWire(wire.id)"
                @pointerdown.stop="startEndpointDrag($event, wire, 'to')"
                @pointerenter="setEndpointHover(wire.id, 'to')"
                @pointerleave="clearEndpointHover(wire.id, 'to')"
              />
            </g>
          </svg>

          <div
            v-for="part in parts"
            :key="part.id"
            class="absolute z-10 cursor-grab touch-none select-none rounded-md border bg-card shadow-sm transition-shadow active:cursor-grabbing"
            data-circuit-interactive="true"
            :class="[
              selectedPartId === part.id ? 'border-primary shadow-panel' : 'border-border',
              isLessonPartTarget(part) ? 'lesson-workbench-target z-20' : '',
              part.type === 'battery' ? 'bg-slate-950 text-white' : '',
              part.type === 'switch' ? 'bg-white' : '',
              part.type === 'bulb' ? 'bg-amber-50' : '',
              part.type === 'resistor' ? 'bg-cyan-50' : '',
              part.type === 'led' ? 'bg-rose-50' : '',
            ]"
            :style="partStyle(part)"
            @pointerdown="handlePartPointerDown($event, part)"
          >
            <button
              v-for="terminal in (['a', 'b'] as TerminalKey[])"
              :key="terminal"
              class="absolute z-40 flex h-8 w-8 touch-none items-center justify-center rounded-full border-2 border-card bg-foreground text-[11px] font-bold text-background shadow-sm transition-transform hover:scale-110"
              data-circuit-interactive="true"
              :class="[
                isTerminalSelected(part, terminal) ? 'ring-4 ring-amber-300' : '',
                isTerminalDropTarget(part, terminal) ? 'scale-125 bg-amber-500 text-amber-950' : '',
                isLessonTerminalTarget(part, terminal) ? 'lesson-terminal-target' : '',
              ]"
              :style="terminalStyle(part, terminal)"
              :title="getSpec(part).terminals[terminal].label"
              @pointerdown.stop="startNewWireDrag($event, part, terminal)"
              @pointermove.stop="updateNewWireDrag"
              @pointerup.stop="finishNewWireDrag"
              @pointercancel.stop="finishNewWireDrag"
              @click.stop="handleTerminalClick(part, terminal)"
            >
              {{ getSpec(part).terminals[terminal].label }}
            </button>

            <div v-if="part.type === 'battery'" class="flex h-full flex-col justify-between p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs text-white/60">Power</div>
                  <div class="text-sm font-semibold">{{ part.name }}</div>
                </div>
                <BatteryCharging class="h-5 w-5 text-cyan-300" />
              </div>
              <div class="flex items-center gap-2">
                <span class="h-9 w-4 rounded-sm border border-white/30 bg-white/10" />
                <span class="h-12 w-4 rounded-sm border border-white/30 bg-white/20" />
                <span class="h-9 flex-1 rounded-sm bg-gradient-to-r from-cyan-400 to-emerald-300" />
              </div>
            </div>

            <div v-else-if="part.type === 'switch'" class="flex h-full flex-col justify-between p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs text-muted-foreground">Switch</div>
                  <div class="text-sm font-semibold">{{ part.name }}</div>
                </div>
                <component :is="part.closed ? ToggleRight : ToggleLeft" class="h-5 w-5" />
              </div>
              <button
                class="relative h-8 rounded-full border bg-muted px-2"
                :class="part.closed ? 'border-emerald-400 bg-emerald-50' : 'border-rose-200 bg-rose-50'"
                @pointerdown.stop
                @click.stop="toggleSwitch(part)"
              >
                <span
                  class="absolute top-1 h-6 w-12 rounded-full transition-all"
                  :class="part.closed ? 'left-[92px] bg-emerald-500' : 'left-1 bg-rose-400'"
                />
                <span class="relative z-10 flex h-full items-center justify-between text-xs font-medium">
                  <span>断开</span>
                  <span>闭合</span>
                </span>
              </button>
            </div>

            <div v-else-if="part.type === 'bulb'" class="flex h-full flex-col items-center justify-center gap-3 p-4">
              <div
                class="flex h-20 w-20 items-center justify-center rounded-full border transition-all"
                :class="bulbBrightness(part) > 0 ? 'border-amber-400' : 'border-amber-200'"
                :style="{
                  backgroundColor: `rgba(251, 191, 36, ${0.16 + bulbBrightness(part) * 0.72})`,
                  boxShadow:
                    bulbBrightness(part) > 0
                      ? `0 0 ${18 + bulbBrightness(part) * 42}px rgba(245, 158, 11, ${0.3 + bulbBrightness(part) * 0.5})`
                      : 'none',
                }"
              >
                <Lightbulb class="h-10 w-10 text-amber-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ simulation.bulbs[part.id]?.brightnessPercent ?? 0 }}%
                </div>
              </div>
            </div>

            <div v-else-if="part.type === 'led'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div
                class="relative flex h-16 w-16 items-center justify-center rounded-full border transition-all"
                :class="[
                  ledStatus(part).reversed ? 'border-slate-300 bg-slate-100' : 'border-rose-300',
                  ledStatus(part).overCurrent ? 'ring-4 ring-rose-300' : '',
                ]"
                :style="{
                  backgroundColor: `rgba(244, 63, 94, ${0.12 + ledStatus(part).brightness * 0.76})`,
                  boxShadow:
                    ledStatus(part).brightness > 0
                      ? `0 0 ${14 + ledStatus(part).brightness * 36}px rgba(225, 29, 72, ${0.25 + ledStatus(part).brightness * 0.48})`
                      : 'none',
                }"
              >
                <CircleDot class="h-9 w-9 text-rose-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-rose-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ ledStatus(part).reversed ? "反接" : `${ledStatus(part).brightnessPercent}%` }}
                </div>
              </div>
            </div>

            <div v-else-if="part.type === 'resistor'" class="flex h-full flex-col justify-between p-4">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs text-cyan-800/70">Rheostat</div>
                  <div class="text-sm font-semibold text-cyan-950">{{ part.name }}</div>
                </div>
                <SlidersHorizontal class="h-5 w-5 text-cyan-700" />
              </div>
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs text-cyan-950">
                  <span>0 Ω</span>
                  <span class="font-semibold">{{ part.resistance ?? 0 }} Ω</span>
                  <span>140 Ω</span>
                </div>
                <input
                  class="w-full accent-cyan-700"
                  max="140"
                  min="0"
                  type="range"
                  :value="part.resistance ?? 0"
                  @input="setResistance(part, Number(($event.target as HTMLInputElement).value))"
                  @pointerdown.stop
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside
        class="fixed inset-x-3 bottom-20 z-40 flex max-h-[70dvh] min-h-0 flex-col rounded-md border bg-card shadow-panel transition-all duration-200 xl:static xl:inset-auto xl:z-auto xl:max-h-none xl:rounded-none xl:border-l xl:border-r-0 xl:border-t-0 xl:shadow-none"
        :class="statusPanelOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0 xl:pointer-events-auto xl:translate-y-0 xl:opacity-100'"
      >
        <div class="flex items-center justify-between border-b px-3 py-2 xl:px-4 xl:py-3">
          <div>
            <div class="text-sm font-semibold">状态</div>
            <div class="text-xs text-muted-foreground">{{ selectedWire ? "导线" : selectedPart?.name ?? "未选择" }}</div>
          </div>
          <Button class="xl:hidden" variant="ghost" size="icon" title="关闭状态面板" @click="statusPanelOpen = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 xl:p-4">
          <section class="rounded-md border bg-background p-3">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div>
                <div class="text-xs text-muted-foreground">Lesson</div>
                <div class="text-sm font-semibold">{{ activeLesson.title }}</div>
              </div>
              <div class="rounded-md bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-900">
                {{ lessonProgress.completed }}/{{ lessonProgress.total }}
              </div>
            </div>
            <p class="mb-3 text-xs leading-5 text-muted-foreground">
              {{ activeLesson.objective }}
            </p>
            <div class="mb-3 grid grid-cols-1 gap-2">
              <button
                v-for="lesson in lessonCatalog"
                :key="lesson.id"
                class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
                :class="
                  activeLessonId === lesson.id
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-950'
                    : 'bg-card text-muted-foreground hover:bg-muted'
                "
                @click="activeLessonId = lesson.id"
              >
                <span class="block truncate font-medium">{{ lesson.title }}</span>
              </button>
            </div>
            <Button class="mb-3 w-full" variant="outline" size="sm" @click="loadLessonWorkspace()">
              <RotateCcw class="h-4 w-4" />
              加载实验初始状态
            </Button>
            <div class="mb-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-cyan-600 transition-all"
                :style="{ width: `${lessonProgress.percent}%` }"
              />
            </div>
            <div
              v-if="nextLessonStep"
              class="mb-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950"
            >
              <div class="mb-1 font-medium">下一步提示</div>
              <div class="leading-5">{{ nextLessonStep.hint }}</div>
            </div>
            <div
              v-else
              class="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950"
            >
              <div class="font-medium">实验完成，可以切换到下一个实验。</div>
            </div>
            <div class="space-y-2">
              <div
                v-for="step in lessonStepStates"
                :key="step.id"
                class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                :class="[
                  step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'bg-card',
                  nextLessonStep?.id === step.id ? 'border-cyan-300 ring-2 ring-cyan-100' : '',
                ]"
              >
                <span
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="
                    step.complete
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : nextLessonStep?.id === step.id
                        ? 'border-cyan-500 bg-cyan-500 text-white'
                        : 'border-muted-foreground/40'
                  "
                >
                  <Check v-if="step.complete" class="h-3.5 w-3.5" />
                </span>
                <span class="leading-5">{{ step.description }}</span>
              </div>
            </div>
          </section>

          <section class="rounded-md border bg-background p-3">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium">记录</span>
              <span class="text-xs text-muted-foreground">{{ savedRecords.length }}/12</span>
            </div>
            <input
              ref="workspaceImportRef"
              accept="application/json,.json"
              class="hidden"
              type="file"
              @change="importWorkspaceJson"
            />
            <div class="mb-3 flex gap-2">
              <input
                v-model="recordTitle"
                class="h-9 min-w-0 flex-1 rounded-md border bg-card px-3 text-sm"
                placeholder="记录名称"
                @keydown.enter="saveWorkspaceRecord"
              />
              <Button variant="outline" size="icon" title="暂存当前记录" @click="saveWorkspaceRecord">
                <Save class="h-4 w-4" />
              </Button>
            </div>
            <div class="mb-3 grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" @click="openWorkspaceImport">
                <FileUp class="h-4 w-4" />
                导入 JSON
              </Button>
              <Button variant="outline" size="sm" @click="exportWorkspaceJson">
                <FileDown class="h-4 w-4" />
                导出 JSON
              </Button>
            </div>
            <Button class="mb-3 w-full" variant="outline" size="sm" @click="copyWorkspaceShareLink">
              <Link class="h-4 w-4" />
              {{ shareLinkCopied ? "链接已复制" : "复制分享链接" }}
            </Button>
            <div v-if="savedRecords.length" class="space-y-2">
              <div
                v-for="record in savedRecords"
                :key="record.id"
                class="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium">{{ record.title }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatSavedTime(record.savedAt) }}</div>
                </div>
                <div class="flex shrink-0 items-center gap-1">
                  <Button variant="ghost" size="icon" title="加载记录" @click="loadSavedRecord(record)">
                    <FolderOpen class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="删除记录" @click="removeSavedRecord(record.id)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div v-else class="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
              暂无暂存记录
            </div>
          </section>

          <section class="grid grid-cols-2 gap-3">
            <div class="rounded-md border bg-background p-3">
              <div class="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap class="h-3.5 w-3.5" />
                电流
              </div>
              <div class="mt-2 text-2xl font-semibold tabular-nums">{{ simulation.currentMilliAmps }}</div>
              <div class="text-xs text-muted-foreground">mA</div>
            </div>
            <div class="rounded-md border bg-background p-3">
              <div class="text-xs text-muted-foreground">灯泡</div>
              <div class="mt-2 text-2xl font-semibold tabular-nums">
                {{ Math.round(mainBulbBrightness * 100) }}
              </div>
              <div class="text-xs text-muted-foreground">brightness</div>
            </div>
          </section>

          <section class="rounded-md border bg-background p-3">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium">回路</span>
              <span
                class="rounded-md px-2 py-1 text-xs font-medium"
                :class="simulation.closed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
              >
                {{ simulation.closed ? "闭合" : "断开" }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div class="text-xs text-muted-foreground">电源</div>
                <div class="font-medium">9 V</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">等效电阻</div>
                <div class="font-medium tabular-nums">{{ simulation.equivalentResistance }} Ω</div>
              </div>
            </div>
            <div v-if="ledWarnings.length" class="mt-3 space-y-2">
              <div
                v-for="(warning, index) in ledWarnings"
                :key="index"
                class="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950"
              >
                <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{{ warning.reversed ? "有 LED 反接，当前不会导通。" : "LED 电流偏大，请调高限流电阻。" }}</span>
              </div>
            </div>
          </section>

          <section v-if="selectedPart" class="rounded-md border bg-background p-3">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium">选中元件</span>
              <Button variant="ghost" size="icon" title="删除" @click="removeSelectedPart">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
            <div class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">类型</span>
                <span class="font-medium">{{ getSpec(selectedPart).label }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <label class="space-y-1">
                  <span class="text-xs text-muted-foreground">X</span>
                  <input
                    class="h-9 w-full rounded-md border bg-card px-3 text-sm"
                    type="number"
                    v-model.number="selectedPart.x"
                  />
                </label>
                <label class="space-y-1">
                  <span class="text-xs text-muted-foreground">Y</span>
                  <input
                    class="h-9 w-full rounded-md border bg-card px-3 text-sm"
                    type="number"
                    v-model.number="selectedPart.y"
                  />
                </label>
              </div>
              <Button
                v-if="selectedPart.type === 'switch'"
                class="w-full"
                :variant="selectedPart.closed ? 'default' : 'outline'"
                @click="toggleSwitch(selectedPart)"
              >
                <component :is="selectedPart.closed ? ToggleRight : ToggleLeft" class="h-4 w-4" />
                {{ selectedPart.closed ? "开关已闭合" : "开关已断开" }}
              </Button>
              <label v-if="selectedPart.type === 'resistor'" class="block space-y-2">
                <span class="text-xs text-muted-foreground">阻值 {{ selectedPart.resistance ?? 0 }} Ω</span>
                <input
                  class="w-full accent-cyan-700"
                  max="140"
                  min="0"
                  type="range"
                  :value="selectedPart.resistance ?? 0"
                  @input="setResistance(selectedPart, Number(($event.target as HTMLInputElement).value))"
                />
              </label>
              <div v-if="selectedPart.type === 'led'" class="rounded-md border bg-card px-3 py-2 text-xs">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-muted-foreground">方向</span>
                  <span class="font-medium" :class="ledStatus(selectedPart).reversed ? 'text-rose-700' : 'text-emerald-700'">
                    {{ ledStatus(selectedPart).reversed ? "反接" : ledStatus(selectedPart).forward ? "正接" : "未接入" }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted-foreground">亮度</span>
                  <span class="font-medium tabular-nums">{{ ledStatus(selectedPart).brightnessPercent }}%</span>
                </div>
              </div>
            </div>
          </section>

          <section v-if="selectedWire" class="rounded-md border border-amber-300 bg-amber-50 p-3">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-amber-950">选中导线</span>
              <Button variant="ghost" size="icon" title="断开导线" @click="removeWire(selectedWire.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
            <div class="space-y-3 text-sm">
              <div class="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-amber-950">
                {{ wireLabel(selectedWire) }}
              </div>
              <div class="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  @click="startRewire(selectedWire.id, 'from')"
                >
                  <Cable class="h-4 w-4" />
                  重接左端
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  @click="startRewire(selectedWire.id, 'to')"
                >
                  <Cable class="h-4 w-4" />
                  重接右端
                </Button>
              </div>
              <div v-if="rewiring" class="text-xs text-amber-800">
                正在重接{{ rewiring.end === "from" ? "左端" : "右端" }}，请点击新的端子。
              </div>
              <div v-else class="text-xs text-amber-800">
                拖动画布上这条线两端的圆点可重接；按住 Alt 拖动端点可从同一端子新建导线。
              </div>
            </div>
          </section>

          <section>
            <div class="mb-3 flex items-center justify-between">
              <div class="text-xs font-medium uppercase text-muted-foreground">Wires</div>
              <span class="text-xs text-muted-foreground">{{ wires.length }}</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="wire in wires"
                :key="wire.id"
                class="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors"
                :class="selectedWireId === wire.id ? 'border-amber-300 bg-amber-50' : 'bg-background hover:bg-muted'"
                @click="selectWire(wire.id)"
              >
                <span class="truncate">
                  {{ wireLabel(wire) }}
                </span>
                <button class="ml-2 text-muted-foreground hover:text-foreground" @click.stop="removeWire(wire.id)">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </section>
  </main>
</template>
