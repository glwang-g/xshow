<script setup lang="ts">
import {
  Activity,
  BatteryCharging,
  BatteryMedium,
  CircuitBoard,
  CircleDot,
  Cog,
  Download,
  Gauge,
  GitFork,
  Lightbulb,
  LocateFixed,
  PackagePlus,
  RotateCcw,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  TriangleRight,
  Trophy,
  Unplug,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import {
  batteryPositiveTerminal,
  type AmmeterState,
  type BuzzerState,
  type CapacitorState,
  type CircuitPart,
  type CircuitSimulation,
  type DiodeState,
  type LedState,
  type MotorState,
  type TerminalKey,
  type TerminalRef,
  type VoltmeterState,
  type Wire,
  type WireEnd,
} from "@/lib/circuit";
import { workbench, type StatusPanelTab } from "@/lib/workbench-ui";

type LessonProgress = { completed: number; percent: number; total: number };
type Point = { x: number; y: number };
type NewWireDrag = { from: TerminalRef; moved: boolean; over: TerminalRef | null; x: number; y: number };
type EndpointDrag = { wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null };

const terminalKeys: TerminalKey[] = ["a", "b"];

const props = defineProps<{
  activeLesson: { title: string };
  applyPwaUpdate: () => void;
  batteryPolarityLabel: (part: CircuitPart) => string;
  ammeterStatus: (part: CircuitPart) => AmmeterState;
  bulbBrightness: (part: CircuitPart) => number;
  buzzerStatus: (part: CircuitPart) => BuzzerState;
  capacitorStatus: (part: CircuitPart) => CapacitorState;
  clearCanvasSelection: () => void;
  clearEndpointHover: (wireId: string, end: WireEnd) => void;
  clearWireHover: (wireId: string) => void;
  clearWires: () => void;
  closeLessonCompletePanel: () => void;
  currentAnimationDuration: string;
  dismissPwaUpdate: () => void;
  endCanvasGesture: (event: PointerEvent) => void;
  endDrag: () => void;
  endpointDrag: EndpointDrag | null;
  endpointFill: (wire: Wire, end: WireEnd) => string;
  endpointRadius: (wire: Wire, end: WireEnd) => number;
  endpointStrokeWidth: (wire: Wire, end: WireEnd) => number;
  exportWorkbenchImage: () => void;
  githubRepositoryUrl: string;
  finishNewWireDrag: () => void;
  getTerminalPosition: (ref: TerminalRef) => Point;
  handleCanvasPointerDown: (event: PointerEvent) => void;
  handleCanvasPointerMove: (event: PointerEvent) => void;
  handlePartPointerDown: (event: PointerEvent, part: CircuitPart) => void;
  handleTerminalClick: (part: CircuitPart, terminal: TerminalKey) => void;
  handleWorkbenchPointerMove: (event: PointerEvent) => void;
  isLessonPartTarget: (part: CircuitPart) => boolean;
  isLessonTerminalTarget: (part: CircuitPart, terminal: TerminalKey) => boolean;
  isTerminalDropTarget: (part: CircuitPart, terminal: TerminalKey) => boolean;
  isTerminalSelected: (part: CircuitPart, terminal: TerminalKey) => boolean;
  isWireHighlighted: (wire: Wire) => boolean;
  diodeStatus: (part: CircuitPart) => DiodeState;
  ledStatus: (part: CircuitPart) => LedState;
  lessonComplete: boolean;
  lessonCompletePanelOpen: boolean;
  lessonProgress: LessonProgress;
  loadNextLesson: () => void;
  mobileLessonStripText: string;
  motorStatus: (part: CircuitPart) => MotorState;
  newWireDrag: NewWireDrag | null;
  newWireDragPath: () => string;
  palettePanelOpen: boolean;
  partStyle: (part: CircuitPart) => Record<string, string>;
  parts: CircuitPart[];
  pwaUpdateRegistration: ServiceWorkerRegistration | null;
  renderedWires: Wire[];
  resetDemo: () => void;
  resetMobileView: () => void;
  rewiring: { wireId: string; end: WireEnd } | null;
  selectWire: (wireId: string) => void;
  selectedPartId: string;
  selectedTerminal: TerminalRef | null;
  selectedWire: Wire | undefined;
  setCanvasViewport: (element: HTMLElement | null) => void;
  setEndpointHover: (wireId: string, end: WireEnd) => void;
  setResistance: (part: CircuitPart, value: number) => void;
  setWireHover: (wireId: string) => void;
  setWorkbenchElement: (element: HTMLElement | null) => void;
  setZoom: (value: number) => void;
  simulation: CircuitSimulation;
  startEndpointDrag: (event: PointerEvent, wire: Wire, end: WireEnd) => void;
  startNewWireDrag: (event: PointerEvent, part: CircuitPart, terminal: TerminalKey) => void;
  statusPanelOpen: boolean;
  terminalDisplayLabel: (part: CircuitPart, terminal: TerminalKey) => string;
  terminalLabel: (ref: TerminalRef) => string;
  terminalStyle: (part: CircuitPart, terminal: TerminalKey) => Record<string, string>;
  toggleBatteryPolarity: (part: CircuitPart) => void;
  toggleSwitch: (part: CircuitPart) => void;
  updateNewWireDrag: (event: PointerEvent) => void;
  voltmeterStatus: (part: CircuitPart) => VoltmeterState;
  wireEndpointPosition: (wire: Wire, end: WireEnd) => Point;
  wirePath: (wire: Wire) => string;
  wireStroke: (wire: Wire) => string;
  wireStrokeWidth: (wire: Wire) => number;
  zoom: number;
}>();

const emit = defineEmits<{
  "open-palette": [];
  "open-status-tab": [tab: StatusPanelTab];
  "toggle-status": [];
}>();

function bindCanvasViewport(element: unknown) {
  props.setCanvasViewport(element instanceof HTMLElement ? element : null);
}

function bindWorkbench(element: unknown) {
  props.setWorkbenchElement(element instanceof HTMLElement ? element : null);
}
</script>

<template>
      <section
        :ref="bindCanvasViewport"
        class="relative min-h-0 touch-none overflow-auto canvas-grid xl:touch-auto xl:overflow-hidden"
        @pointerdown="handleCanvasPointerDown"
        @pointermove="handleCanvasPointerMove"
        @pointerup="endCanvasGesture"
        @pointercancel="endCanvasGesture"
        @pointerleave="endCanvasGesture"
      >
        <div
          class="fixed left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-20 flex w-max max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-md border bg-card/95 p-1 shadow-panel xl:hidden"
        >
          <a
            :href="githubRepositoryUrl"
            target="_blank"
            rel="noreferrer"
            class="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors hover:bg-muted"
            title="GitHub 仓库"
            aria-label="打开 GitHub 仓库"
            data-circuit-interactive="true"
          >
            <GitFork class="h-4 w-4" />
            <span>GitHub</span>
          </a>
          <Button class="shrink-0" variant="ghost" size="sm" title="清空导线" @click="clearWires">
            <Unplug class="h-4 w-4" />
            清线
          </Button>
          <Button class="shrink-0" size="sm" title="复位演示电路" @click="resetDemo">
            <RotateCcw class="h-4 w-4" />
            复位
          </Button>
        </div>

        <button
          class="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-3 right-3 z-20 flex h-10 items-center gap-2 overflow-hidden rounded-md border bg-card/95 px-3 text-left text-sm shadow-panel xl:hidden"
          :class="lessonComplete ? 'border-emerald-200 text-emerald-950' : 'border-cyan-200 text-cyan-950'"
          @click="emit('open-status-tab', 'lesson')"
        >
          <span
            class="flex h-6 min-w-12 shrink-0 items-center justify-center rounded-md text-xs font-medium tabular-nums"
            :class="lessonComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'"
          >
            {{ lessonProgress.completed }}/{{ lessonProgress.total }}
          </span>
          <span class="min-w-0 flex-1 truncate">{{ mobileLessonStripText }}</span>
          <Gauge class="h-4 w-4 shrink-0 opacity-70" />
        </button>

        <div class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-md border bg-card/95 p-1 shadow-panel xl:hidden">
          <Button
            :class="palettePanelOpen ? 'bg-cyan-100 text-cyan-950 hover:bg-cyan-100' : ''"
            :aria-pressed="palettePanelOpen"
            variant="ghost"
            size="icon"
            title="打开器件面板"
            @click="emit('open-palette')"
          >
            <PackagePlus class="h-4 w-4" />
          </Button>
          <Button
            :class="statusPanelOpen ? 'bg-cyan-100 text-cyan-950 hover:bg-cyan-100' : ''"
            :aria-pressed="statusPanelOpen"
            variant="ghost"
            size="icon"
            title="显示状态面板"
            @click="emit('toggle-status')"
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
          <Button variant="ghost" size="icon" title="缩小" @click="setZoom(zoom - 5)">
            <ZoomOut class="h-4 w-4" />
          </Button>
          <div class="min-w-12 text-center text-xs tabular-nums">{{ zoom }}%</div>
          <Button variant="ghost" size="icon" title="放大" @click="setZoom(zoom + 5)">
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
              <div class="text-sm font-semibold">有新版本啦</div>
              <div class="mt-1 text-xs leading-5 text-muted-foreground">
                刷新一下就能用最新实验台，本地记录会继续保留。
              </div>
            </div>
            <Button variant="ghost" size="icon" title="稍后" @click="dismissPwaUpdate">
              <X class="h-4 w-4" />
            </Button>
          </div>
          <Button class="w-full" size="sm" @click="applyPwaUpdate">
            <RotateCcw class="h-4 w-4" />
            立即刷新
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
            {{ terminalLabel(selectedTerminal) }}
          </span>
        </div>

        <div
          :ref="bindWorkbench"
          class="relative mx-3 mb-24 mt-3 origin-top-left overflow-hidden rounded-md border bg-[#f8faf7] shadow-panel xl:absolute xl:left-1/2 xl:top-1/2 xl:m-0 xl:origin-center xl:-translate-x-1/2 xl:-translate-y-1/2"
          data-circuit-surface="true"
          :style="{
            width: `${workbench.width}px`,
            height: `${workbench.height}px`,
            scale: `${zoom / 100}`,
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
              part.type === 'diode' ? 'bg-fuchsia-50' : '',
              part.type === 'capacitor' ? 'bg-violet-50' : '',
              part.type === 'ammeter' ? 'bg-orange-50' : '',
              part.type === 'voltmeter' ? 'bg-indigo-50' : '',
              part.type === 'buzzer' ? 'bg-sky-50' : '',
              part.type === 'motor' ? 'bg-emerald-50' : '',
            ]"
            :style="partStyle(part)"
            @pointerdown="handlePartPointerDown($event, part)"
          >
            <button
              v-for="terminal in terminalKeys"
              :key="terminal"
              class="absolute z-40 flex h-8 w-8 touch-none items-center justify-center rounded-full border-2 border-card bg-foreground text-[11px] font-bold text-background shadow-sm transition-transform hover:scale-110"
              data-circuit-interactive="true"
              :class="[
                isTerminalSelected(part, terminal) ? 'ring-4 ring-amber-300' : '',
                isTerminalDropTarget(part, terminal) ? 'scale-125 bg-amber-500 text-amber-950' : '',
                isLessonTerminalTarget(part, terminal) ? 'lesson-terminal-target' : '',
              ]"
              :style="terminalStyle(part, terminal)"
              :title="terminalDisplayLabel(part, terminal)"
              @pointerdown.stop="startNewWireDrag($event, part, terminal)"
              @pointermove.stop="updateNewWireDrag"
              @pointerup.stop="finishNewWireDrag"
              @pointercancel.stop="finishNewWireDrag"
              @click.stop="handleTerminalClick(part, terminal)"
            >
              {{ terminalDisplayLabel(part, terminal) }}
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
                <span
                  class="h-9 flex-1 rounded-sm from-cyan-400 to-emerald-300"
                  :class="batteryPositiveTerminal(part) === 'b' ? 'bg-gradient-to-r' : 'bg-gradient-to-l'"
                />
              </div>
              <div class="flex items-center justify-between text-xs text-white/70">
                <span>{{ batteryPolarityLabel(part) }}</span>
                <button class="rounded border border-white/20 px-2 py-1 text-white hover:bg-white/10" @pointerdown.stop @click.stop="toggleBatteryPolarity(part)">
                  反转
                </button>
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

            <div v-else-if="part.type === 'diode'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div
                class="relative flex h-14 w-20 items-center justify-center rounded-md border transition-all"
                :class="[
                  diodeStatus(part).reversed ? 'border-slate-300 bg-slate-100' : 'border-fuchsia-300 bg-fuchsia-100',
                  diodeStatus(part).overCurrent ? 'ring-4 ring-fuchsia-300' : '',
                ]"
              >
                <TriangleRight class="h-9 w-9 text-fuchsia-900" />
                <span class="h-10 w-1 rounded-full bg-fuchsia-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-fuchsia-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ diodeStatus(part).reversed ? "反向截止" : diodeStatus(part).conducting ? "正向导通" : "未导通" }}
                </div>
              </div>
            </div>

            <div v-else-if="part.type === 'capacitor'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div class="flex h-14 w-20 items-center justify-center gap-3 rounded-md border border-violet-300 bg-violet-100">
                <span class="h-10 w-1.5 rounded-full bg-violet-900" />
                <span class="h-10 w-1.5 rounded-full bg-violet-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-violet-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ capacitorStatus(part).connected ? `${capacitorStatus(part).chargePercent}% 充电` : "未接入" }}
                </div>
              </div>
            </div>

            <div v-else-if="part.type === 'ammeter'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border border-orange-300 bg-orange-100">
                <Activity class="h-9 w-9 text-orange-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-orange-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">{{ ammeterStatus(part).currentMilliAmps }} mA</div>
              </div>
            </div>

            <div v-else-if="part.type === 'voltmeter'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div class="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-300 bg-indigo-100">
                <BatteryMedium class="h-9 w-9 text-indigo-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-indigo-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">{{ voltmeterStatus(part).voltage.toFixed(1) }} V</div>
              </div>
            </div>

            <div v-else-if="part.type === 'buzzer'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div
                class="relative flex h-16 w-16 items-center justify-center rounded-full border border-sky-300 bg-sky-100 transition-all"
                :style="{
                  boxShadow:
                    buzzerStatus(part).active
                      ? `0 0 ${12 + buzzerStatus(part).volume * 34}px rgba(2, 132, 199, ${0.22 + buzzerStatus(part).volume * 0.36})`
                      : 'none',
                }"
              >
                <span
                  v-if="buzzerStatus(part).active"
                  class="absolute h-16 w-16 animate-ping rounded-full border border-sky-400 opacity-40"
                />
                <Volume2 class="h-9 w-9 text-sky-900" />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-sky-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ buzzerStatus(part).active ? `${buzzerStatus(part).volumePercent}% 响` : "静音" }}
                </div>
              </div>
            </div>

            <div v-else-if="part.type === 'motor'" class="flex h-full flex-col items-center justify-center gap-2 p-4">
              <div
                class="relative flex h-16 w-16 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 transition-all"
                :style="{
                  boxShadow:
                    motorStatus(part).active
                      ? `0 0 ${10 + motorStatus(part).speed * 30}px rgba(22, 163, 74, ${0.18 + motorStatus(part).speed * 0.32})`
                      : 'none',
                }"
              >
                <Cog
                  class="h-10 w-10 text-emerald-900"
                  :class="motorStatus(part).active ? 'animate-spin' : ''"
                  :style="{ animationDuration: `${Math.max(0.55, 2 - motorStatus(part).speed * 1.25)}s` }"
                />
              </div>
              <div class="text-center">
                <div class="text-sm font-semibold text-emerald-950">{{ part.name }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ motorStatus(part).active ? `${motorStatus(part).speedPercent}% 转` : "停止" }}
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
</template>
