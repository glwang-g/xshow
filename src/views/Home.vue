<script setup lang="ts">
import { computed, ref } from "vue";
import { lessonCatalog, type LessonCheckId } from "@/data/lessons";
import {
  BatteryCharging,
  Cable,
  Check,
  CircuitBoard,
  Lightbulb,
  MousePointer2,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Zap,
  ZoomIn,
  ZoomOut,
} from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import { useBoardStore, type Tool } from "@/stores/board";

type PartType = "battery" | "bulb" | "switch" | "resistor";
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

const board = useBoardStore();
const workbenchRef = ref<HTMLElement | null>(null);
const activeLessonId = ref(lessonCatalog[0].id);
const hoveredWireId = ref<string | null>(null);
const hoveredEndpoint = ref<{ wireId: string; end: WireEnd } | null>(null);
const selectedTerminal = ref<TerminalRef | null>(null);
const selectedWireId = ref<string | null>(null);
const selectedPartId = ref("bulb-1");
const rewiring = ref<{ wireId: string; end: WireEnd } | null>(null);
const endpointDrag = ref<{ wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null } | null>(
  null,
);
const dragging = ref<{ id: string; offsetX: number; offsetY: number } | null>(null);

const workbench = {
  width: 1060,
  height: 640,
};

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
};

const tools: Array<{ icon: unknown; key: Tool; title: string }> = [
  { icon: MousePointer2, key: "select", title: "选择" },
  { icon: Cable, key: "wire", title: "连线" },
];

const palette: Array<{ type: PartType; description: string }> = [
  { type: "battery", description: "9V 电源" },
  { type: "switch", description: "控制通断" },
  { type: "bulb", description: "显示亮度" },
  { type: "resistor", description: "调节电流" },
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
const currentAnimationDuration = computed(() => {
  if (!simulation.value.closed || simulation.value.currentMilliAmps <= 0) {
    return "1.6s";
  }

  const duration = Math.max(0.45, Math.min(1.8, 1.8 - simulation.value.currentMilliAmps / 160));
  return `${duration.toFixed(2)}s`;
});

const lessonCheckers: Record<LessonCheckId, () => boolean> = {
  hasAdjustedResistor: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) !== 48),
  hasBrightBulb: () => mainBulbBrightness.value >= 0.4,
  hasClosedCircuit: () => simulation.value.closed,
  hasClosedSwitch: () => parts.value.some((part) => part.type === "switch" && part.closed),
  hasDarkBulb: () => mainBulbBrightness.value === 0,
  hasLitBulb: () => mainBulbBrightness.value > 0,
  hasLowResistance: () => parts.value.some((part) => part.type === "resistor" && (part.resistance ?? 0) <= 24),
  hasOpenCircuit: () => !simulation.value.closed,
  hasOpenSwitch: () => parts.value.some((part) => part.type === "switch" && !part.closed),
  hasStarterParts: () =>
    ["battery", "switch", "bulb", "resistor"].every((type) => parts.value.some((part) => part.type === type)),
};
const activeLesson = computed(() => lessonCatalog.find((lesson) => lesson.id === activeLessonId.value) ?? lessonCatalog[0]);
const lessonStepStates = computed(() =>
  activeLesson.value.steps.map((step) => ({
    ...step,
    complete: lessonCheckers[step.checkId](),
  })),
);
const lessonProgress = computed(() => {
  const completed = lessonStepStates.value.filter((step) => step.complete).length;
  const total = lessonStepStates.value.length;
  return {
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    total,
  };
});

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
    left: `${offset.x - 12}px`,
    top: `${offset.y - 12}px`,
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
    return 10;
  }

  if (selectedWireId.value === wire.id) {
    return 8;
  }

  if (isEndpointHovered(wire, end)) {
    return 8;
  }

  return hoveredWireId.value === wire.id ? 7 : 5;
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
  if (board.activeTool !== "select") {
    return;
  }

  selectedWireId.value = null;
  rewiring.value = null;
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
}

function clearCanvasSelection() {
  hoveredEndpoint.value = null;
  hoveredWireId.value = null;
  selectedTerminal.value = null;
  selectedWireId.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
}

function selectWire(wireId: string) {
  hoveredWireId.value = wireId;
  selectedWireId.value = wireId;
  selectedTerminal.value = null;
  rewiring.value = null;
  board.setTool("select");
}

function startRewire(wireId: string, end: WireEnd) {
  selectedWireId.value = wireId;
  selectedTerminal.value = null;
  endpointDrag.value = null;
  rewiring.value = { wireId, end };
  board.setTool("wire");
}

function startEndpointDrag(event: PointerEvent, wire: Wire, end: WireEnd) {
  if (selectedWireId.value !== wire.id) {
    selectWire(wire.id);
  }

  const point = boardPoint(event);
  selectedTerminal.value = null;
  selectedWireId.value = wire.id;
  hoveredWireId.value = wire.id;
  hoveredEndpoint.value = { wireId: wire.id, end };
  rewiring.value = { wireId: wire.id, end };
  endpointDrag.value = {
    wireId: wire.id,
    end,
    x: point.x,
    y: point.y,
    over: null,
  };
  board.setTool("wire");
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
  board.setTool("select");
}

function handleTerminalClick(part: CircuitPart, terminal: TerminalKey) {
  selectedPartId.value = part.id;
  board.setTool("wire");
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

  if (sameTerminal(selectedTerminal.value, target)) {
    selectedTerminal.value = null;
    return;
  }

  const hasSameWire = wires.value.some(
    (wire) =>
      (sameTerminal(wire.from, selectedTerminal.value as TerminalRef) && sameTerminal(wire.to, target)) ||
      (sameTerminal(wire.to, selectedTerminal.value as TerminalRef) && sameTerminal(wire.from, target)),
  );

  if (!hasSameWire) {
    wires.value.push({
      id: `wire-${Date.now()}`,
      from: selectedTerminal.value,
      to: target,
    });
  }

  selectedTerminal.value = null;
}

function isTerminalSelected(part: CircuitPart, terminal: TerminalKey) {
  const terminalRef = { partId: part.id, terminal };
  const isPendingNewWire =
    selectedTerminal.value?.partId === part.id &&
    selectedTerminal.value.terminal === terminal;

  if (!rewiring.value) {
    const isDropTarget =
      endpointDrag.value?.over?.partId === part.id &&
      endpointDrag.value.over.terminal === terminal;

    return isPendingNewWire || isDropTarget;
  }

  const wire = wires.value.find((item) => item.id === rewiring.value?.wireId);
  const isRewireEnd = wire ? sameTerminal(wire[rewiring.value.end], terminalRef) : false;
  const isDropTarget =
    endpointDrag.value?.over?.partId === part.id &&
    endpointDrag.value.over.terminal === terminal;

  return isPendingNewWire || isRewireEnd || isDropTarget;
}

function isTerminalDropTarget(part: CircuitPart, terminal: TerminalKey) {
  return (
    endpointDrag.value?.over?.partId === part.id &&
    endpointDrag.value.over.terminal === terminal
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
  selectedWireId.value = null;
  hoveredWireId.value = null;
  hoveredEndpoint.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
  selectedPartId.value = nextPart.id;
  board.setTool("select");
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
  selectedTerminal.value = null;
  selectedWireId.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
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
  selectedTerminal.value = null;
  selectedWireId.value = null;
  hoveredWireId.value = null;
  hoveredEndpoint.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
}

function resetDemo() {
  parts.value = [
    { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
    { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: true },
    { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
    { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance: 48 },
  ];
  wires.value = [
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
  ];
  selectedPartId.value = "bulb-1";
  selectedTerminal.value = null;
  selectedWireId.value = null;
  hoveredWireId.value = null;
  hoveredEndpoint.value = null;
  rewiring.value = null;
  endpointDrag.value = null;
  board.setZoom(86);
  board.setTool("select");
}

function toggleSwitch(part: CircuitPart) {
  part.closed = !part.closed;
}

function setResistance(part: CircuitPart, value: number) {
  part.resistance = Math.round(value);
}

function buildEdges(sourceParts: CircuitPart[], sourceWires: Wire[], excludedPartId?: string) {
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

function partBridgesBattery(part: CircuitPart, battery: CircuitPart, edges: Edge[]) {
  const positive = `${battery.id}:b`;
  const negative = `${battery.id}:a`;
  const a = `${part.id}:a`;
  const b = `${part.id}:b`;
  const edgesWithoutPart = edges.filter((edge) => edge.partId !== part.id);

  return (
    (hasPath(positive, a, edgesWithoutPart) && hasPath(b, negative, edgesWithoutPart)) ||
    (hasPath(positive, b, edgesWithoutPart) && hasPath(a, negative, edgesWithoutPart))
  );
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
  const edges = buildEdges(sourceParts, sourceWires);
  const bulbStates: Record<string, { brightness: number; brightnessPercent: number }> = {};
  const wireStates: Record<string, { active: boolean; reverse: boolean }> = {};

  if (!battery) {
    return {
      closed: false,
      currentMilliAmps: 0,
      equivalentResistance: 0,
      bulbs: bulbStates,
      wires: wireStates,
    };
  }

  const positive = `${battery.id}:b`;
  const negative = `${battery.id}:a`;
  const closed = hasPath(positive, negative, edges);
  const seriesResistors = sourceParts.filter(
    (part) => part.type === "resistor" && partBridgesBattery(part, battery, edges),
  );
  const resistorOhms = seriesResistors.reduce((total, part) => total + (part.resistance ?? 0), 0);
  const bulbOhms = 18;
  const equivalentResistance = closed ? bulbOhms + resistorOhms : 0;
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
    const conducting = closed && partBridgesBattery(bulb, battery, edges);
    const normalized = conducting && equivalentResistance > 0 ? bulbOhms / equivalentResistance : 0;
    const brightness = conducting ? Math.min(1, Math.max(0.1, normalized)) : 0;

    bulbStates[bulb.id] = {
      brightness,
      brightnessPercent: Math.round(brightness * 100),
    };
  }

  return {
    closed,
    currentMilliAmps,
    equivalentResistance,
    bulbs: bulbStates,
    wires: wireStates,
  };
}
</script>

<template>
  <main class="flex h-screen min-h-[720px] flex-col overflow-hidden bg-background">
    <header class="flex h-14 items-center justify-between border-b bg-card px-3">
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
        <div class="flex items-center gap-1 rounded-md border bg-muted/60 p-1">
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
        <Button variant="outline" size="sm" @click="clearWires">
          <Trash2 class="h-4 w-4" />
          清线
        </Button>
        <Button size="sm" @click="resetDemo">
          <RotateCcw class="h-4 w-4" />
          复位
        </Button>
      </div>
    </header>

    <section class="grid min-h-0 flex-1 grid-cols-[260px_minmax(0,1fr)_320px]">
      <aside class="flex min-h-0 flex-col border-r bg-card">
        <div class="border-b px-4 py-3">
          <div class="text-sm font-semibold">元器件</div>
          <div class="text-xs text-muted-foreground">点击添加到桌面</div>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
          <section>
            <div class="mb-2 text-xs font-medium uppercase text-muted-foreground">Tool</div>
            <div class="grid grid-cols-2 gap-2">
              <Button
                v-for="tool in tools"
                :key="tool.key"
                :variant="board.activeTool === tool.key ? 'default' : 'outline'"
                size="sm"
                @click="board.setTool(tool.key)"
              >
                <component :is="tool.icon" class="h-4 w-4" />
                {{ tool.title }}
              </Button>
            </div>
          </section>

          <section class="space-y-2">
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
                  <span class="block text-xs text-muted-foreground">{{ item.description }}</span>
                </span>
              </span>
              <Plus class="h-4 w-4 text-muted-foreground" />
            </button>
          </section>
        </div>
      </aside>

      <section class="relative overflow-hidden canvas-grid">
        <div class="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-md border bg-card/95 px-3 py-2 shadow-panel">
          <CircuitBoard class="h-4 w-4 text-cyan-700" />
          <span class="text-sm font-medium">Workbench</span>
          <span v-if="endpointDrag?.over" class="text-xs text-muted-foreground">
            松开连接到 {{ terminalLabel(endpointDrag.over) }}
          </span>
          <span v-else-if="endpointDrag" class="text-xs text-muted-foreground">
            拖到新的端子上松开
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
          class="absolute left-1/2 top-1/2 overflow-hidden rounded-md border bg-[#f8faf7] shadow-panel"
          :style="{
            width: `${workbench.width}px`,
            height: `${workbench.height}px`,
            transform: `translate(-50%, -50%) scale(${board.zoom / 100})`,
          }"
          @pointermove="handleWorkbenchPointerMove"
          @pointerup="endDrag"
          @pointerleave="endDrag"
          @pointerdown.self="clearCanvasSelection"
        >
          <svg class="pointer-events-none absolute inset-0 z-30 h-full w-full">
            <g
              v-for="wire in renderedWires"
              :key="wire.id"
            >
              <path
                class="pointer-events-auto cursor-pointer"
                :d="wirePath(wire)"
                fill="none"
                pointer-events="stroke"
                stroke="transparent"
                stroke-linecap="round"
                stroke-width="18"
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
                class="pointer-events-auto cursor-grab active:cursor-grabbing"
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
                class="pointer-events-auto cursor-grab active:cursor-grabbing"
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
            class="absolute z-10 cursor-grab select-none rounded-md border bg-card shadow-sm transition-shadow active:cursor-grabbing"
            :class="[
              selectedPartId === part.id ? 'border-primary shadow-panel' : 'border-border',
              part.type === 'battery' ? 'bg-slate-950 text-white' : '',
              part.type === 'switch' ? 'bg-white' : '',
              part.type === 'bulb' ? 'bg-amber-50' : '',
              part.type === 'resistor' ? 'bg-cyan-50' : '',
            ]"
            :style="partStyle(part)"
            @pointerdown="handlePartPointerDown($event, part)"
          >
            <button
              v-for="terminal in (['a', 'b'] as TerminalKey[])"
              :key="terminal"
              class="absolute z-40 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-foreground text-[10px] font-bold text-background shadow-sm transition-transform hover:scale-110"
              :class="[
                isTerminalSelected(part, terminal) ? 'ring-4 ring-amber-300' : '',
                isTerminalDropTarget(part, terminal) ? 'scale-125 bg-amber-500 text-amber-950' : '',
              ]"
              :style="terminalStyle(part, terminal)"
              :title="getSpec(part).terminals[terminal].label"
              @pointerdown.stop
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
                :class="mainBulbBrightness > 0 ? 'border-amber-400' : 'border-amber-200'"
                :style="{
                  backgroundColor: `rgba(251, 191, 36, ${0.16 + mainBulbBrightness * 0.72})`,
                  boxShadow:
                    mainBulbBrightness > 0
                      ? `0 0 ${18 + mainBulbBrightness * 42}px rgba(245, 158, 11, ${0.3 + mainBulbBrightness * 0.5})`
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

            <div v-else class="flex h-full flex-col justify-between p-4">
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

      <aside class="flex min-h-0 flex-col border-l bg-card">
        <div class="border-b px-4 py-3">
          <div class="text-sm font-semibold">状态</div>
          <div class="text-xs text-muted-foreground">{{ selectedWire ? "导线" : selectedPart?.name ?? "未选择" }}</div>
        </div>

        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-4">
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
            <div class="mb-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-cyan-600 transition-all"
                :style="{ width: `${lessonProgress.percent}%` }"
              />
            </div>
            <div class="space-y-2">
              <div
                v-for="step in lessonStepStates"
                :key="step.id"
                class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                :class="step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'bg-card'"
              >
                <span
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
                  :class="step.complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/40'"
                >
                  <Check v-if="step.complete" class="h-3.5 w-3.5" />
                </span>
                <span class="leading-5">{{ step.description }}</span>
              </div>
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
                也可以直接拖动画布上这条线两端的圆点来重接。
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
