<script setup lang="ts">
import { computed, ref } from "vue";
import { Activity, Binary, CircleDot, Maximize2, Minimize2, MousePointer2, RotateCcw, Send, Waypoints, Zap } from "@lucide/vue";
import { advanceRegisterWorkbenchCycle, createRegisterWorkbenchState, setWorkbenchData } from "@/lib/digital-workbench";

type NodeId = "data" | "register" | "clock" | "probe";
type DigitalNode = { id: NodeId; kind: "clock" | "input" | "output" | "register"; label: string; note: string; x: number; y: number };

const starterNodes: DigitalNode[] = [
  { id: "data", kind: "input", label: "数据输入 D", note: "设置待写入的 0 / 1", x: 56, y: 122 },
  { id: "register", kind: "register", label: "REGISTER[0]", note: "仅在上升沿写入 D", x: 338, y: 108 },
  { id: "clock", kind: "clock", label: "CLOCK", note: "推进完整离散周期", x: 354, y: 338 },
  { id: "probe", kind: "output", label: "观察端 Q", note: "读取已存储的状态", x: 657, y: 122 },
];

const board = ref(createRegisterWorkbenchState());
const nodes = ref(starterNodes.map((node) => ({ ...node })));
const canvasSize = ref({ height: 500, width: 900 });
const selectedId = ref<NodeId>("register");
const isFullscreen = ref(false);
const dragging = ref<{ id: NodeId; offsetX: number; offsetY: number } | null>(null);
const q = computed(() => board.value.register.data.q);
const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedId.value) ?? nodes.value[0]);
const nodeById = computed(() => Object.fromEntries(nodes.value.map((node) => [node.id, node])) as Record<NodeId, DigitalNode>);

function portPosition(id: NodeId, port: "d" | "clk" | "in" | "out" | "q") {
  const node = nodeById.value[id];
  if (id === "register") {
    if (port === "d") return { x: node.x, y: node.y + 106 };
    if (port === "clk") return { x: node.x + 96, y: node.y + 130 };
    return { x: node.x + 190, y: node.y + 106 };
  }
  if (id === "clock") return { x: node.x + 84, y: node.y };
  if (id === "data") return { x: node.x + 168, y: node.y + 35 };
  return { x: node.x, y: node.y + 35 };
}

function wirePath(from: NodeId, fromPort: "d" | "clk" | "in" | "out" | "q", to: NodeId, toPort: "d" | "clk" | "in" | "out" | "q") {
  const source = portPosition(from, fromPort);
  const target = portPosition(to, toPort);
  const startX = source.x;
  const startY = source.y;
  const endX = target.x;
  const endY = target.y;
  const middleX = Math.round((startX + endX) / 2);
  const middleY = Math.round((startY + endY) / 2);
  return from === "clock" || toPort === "clk"
    ? `M ${startX} ${startY} L ${startX} ${middleY} L ${endX} ${middleY} L ${endX} ${endY}`
    : `M ${startX} ${startY} L ${middleX} ${startY} L ${middleX} ${endY} L ${endX} ${endY}`;
}

function toggleData() { board.value = setWorkbenchData(board.value, board.value.data === 1 ? 0 : 1); }
function advanceCycle() { board.value = advanceRegisterWorkbenchCycle(board.value); selectedId.value = "clock"; }
function reset() { board.value = createRegisterWorkbenchState(); nodes.value = starterNodes.map((node) => ({ ...node })); canvasSize.value = { height: 500, width: 900 }; selectedId.value = "register"; }
function selectNode(id: NodeId) { selectedId.value = id; }

function startDrag(event: PointerEvent, id: NodeId) {
  const node = nodeById.value[id];
  const bounds = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
  if (!bounds) return;
  selectedId.value = id;
  dragging.value = { id, offsetX: event.clientX - bounds.left - node.x, offsetY: event.clientY - bounds.top - node.y };
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}

function dragNode(event: PointerEvent) {
  if (!dragging.value) return;
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = Math.max(12, event.clientX - bounds.left - dragging.value.offsetX);
  const y = Math.max(12, event.clientY - bounds.top - dragging.value.offsetY);
  const isRegister = dragging.value.id === "register";
  canvasSize.value = {
    width: Math.max(canvasSize.value.width, Math.ceil(x + (isRegister ? 192 : 168) + 144)),
    height: Math.max(canvasSize.value.height, Math.ceil(y + (isRegister ? 132 : 112) + 144)),
  };
  nodes.value = nodes.value.map((node) => node.id === dragging.value?.id ? { ...node, x, y } : node);
}
function stopDrag() { dragging.value = null; }
function toggleFullscreen() { isFullscreen.value = !isFullscreen.value; }
</script>

<template>
  <section :class="['digital-workbench overflow-hidden border border-slate-300 bg-slate-100 shadow-sm', isFullscreen ? 'fixed inset-0 z-50 overflow-auto rounded-none' : 'rounded-xl']" :style="{ '--digital-canvas-height': `${canvasSize.height}px`, '--digital-canvas-width': `${canvasSize.width}px` }">
    <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-cyan-300"><Binary class="h-5 w-5" /></span><div><div class="text-sm font-semibold text-slate-950">数字工作台</div><div class="text-xs text-slate-500">逻辑与存储 · 模块、信号、时钟与状态</div></div></div>
      <div class="flex items-center gap-2 text-xs"><span class="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-slate-600">tick {{ board.register.tick }}</span><span class="rounded border border-cyan-200 bg-cyan-50 px-2 py-1 text-cyan-800">离散运行模式</span><button type="button" class="inline-flex h-8 items-center gap-1.5 rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50" :title="isFullscreen ? '退出工作台全屏' : '工作台全屏'" @click="toggleFullscreen"><Minimize2 v-if="isFullscreen" class="h-3.5 w-3.5" /><Maximize2 v-else class="h-3.5 w-3.5" />{{ isFullscreen ? '退出全屏' : '全屏工作台' }}</button></div>
    </header>

    <div :class="['grid xl:grid-cols-[210px_minmax(0,1fr)_250px]', isFullscreen ? 'min-h-[calc(100vh-65px)]' : 'min-h-[570px]']">
      <aside class="border-b border-slate-200 bg-white p-3 xl:border-b-0 xl:border-r"><div class="flex items-center gap-2 text-xs font-semibold text-slate-600"><Waypoints class="h-4 w-4 text-cyan-700" />数字模块库</div><p class="mt-2 text-xs leading-5 text-slate-500">逻辑层不放电池、灯泡、电阻等自由电路件；画布只使用离散模块。</p><div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1"><button v-for="node in nodes" :key="node.id" type="button" class="flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors" :class="selectedId === node.id ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'" @click="selectNode(node.id)"><span class="font-medium">{{ node.label }}</span><span class="font-mono">{{ node.kind === 'input' ? `D${board.data}` : node.kind === 'output' ? `Q${q}` : node.kind === 'clock' ? 'CLK' : '1 bit' }}</span></button></div><div class="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-xs leading-5 text-slate-500"><MousePointer2 class="mr-1 inline h-3.5 w-3.5" />拖动画布中的模块调整布局；连线表达当前寄存器起步拓扑。</div></aside>

      <div class="flex min-w-0 flex-col bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[size:18px_18px]"><div class="flex items-center justify-between border-b border-slate-200 bg-white/85 px-4 py-2 text-xs"><span class="font-medium text-slate-700">画布 · Register starter</span><span class="text-slate-500">D → Register → Q · CLOCK → Register</span></div><div class="relative min-h-[480px] overflow-hidden touch-none" @pointermove="dragNode" @pointerup="stopDrag" @pointercancel="stopDrag"><svg class="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true"><path :d="wirePath('data', 'out', 'register', 'd')" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><path :d="wirePath('register', 'q', 'probe', 'in')" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /><path :d="wirePath('clock', 'out', 'register', 'clk')" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg><div v-for="node in nodes" :key="node.id" role="button" tabindex="0" class="absolute select-none rounded-lg border-2 bg-white p-3 text-left shadow-sm transition-shadow" :class="[node.id === 'register' ? 'h-[132px] w-[192px]' : 'w-[168px]', selectedId === node.id ? 'border-cyan-400 shadow-cyan-100' : 'border-slate-300 hover:border-slate-400']" :style="{ left: `${node.x}px`, top: `${node.y}px` }" @click="selectNode(node.id)" @pointerdown.stop="startDrag($event, node.id)"><template v-if="node.id === 'data'"><span class="absolute -right-2 top-7 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-white"></span><span class="absolute -right-9 top-5 font-mono text-[10px] font-bold text-emerald-700">OUT</span></template><template v-else-if="node.id === 'clock'"><span class="absolute -top-2 left-[78px] h-3.5 w-3.5 rounded-full border-2 border-violet-600 bg-white"></span><span class="absolute -top-6 left-[96px] font-mono text-[10px] font-bold text-violet-700">OUT</span></template><template v-else-if="node.id === 'probe'"><span class="absolute -left-2 top-7 h-3.5 w-3.5 rounded-full border-2 border-amber-600 bg-white"></span><span class="absolute -left-8 top-5 font-mono text-[10px] font-bold text-amber-700">IN</span></template><template v-else><span class="absolute -left-2 top-[102px] h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-white"></span><span class="absolute -left-9 top-[100px] font-mono text-[10px] font-bold text-emerald-700">D</span><span class="absolute bottom-[-8px] left-[90px] h-3.5 w-3.5 rounded-full border-2 border-violet-600 bg-white"></span><span class="absolute bottom-[-24px] left-[78px] font-mono text-[10px] font-bold text-violet-700">CLK</span><span class="absolute -right-2 top-[102px] h-3.5 w-3.5 rounded-full border-2 border-amber-600 bg-white"></span><span class="absolute -right-9 top-[100px] font-mono text-[10px] font-bold text-amber-700">Q</span></template><div class="flex items-center justify-between gap-2"><span class="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{{ node.kind }}</span><span v-if="node.id === 'data'" class="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-xs text-emerald-800">{{ board.data }}</span><span v-else-if="node.id === 'probe'" class="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-800">{{ q }}</span><span v-else class="h-2 w-2 rounded-full" :class="node.id === 'clock' ? 'bg-violet-500' : 'bg-cyan-500'"></span></div><div class="mt-2 font-mono text-sm font-bold text-slate-950">{{ node.label }}</div><div class="mt-1 text-[11px] leading-4 text-slate-500">{{ node.note }}</div><button v-if="node.id === 'data'" type="button" class="mt-3 inline-flex h-7 w-full items-center justify-center rounded border border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-100" @pointerdown.stop @click.stop="toggleData">设为 {{ board.data === 1 ? 0 : 1 }}</button><button v-else-if="node.id === 'clock'" type="button" class="mt-3 inline-flex h-7 w-full items-center justify-center rounded border border-violet-300 bg-violet-50 text-[11px] font-semibold text-violet-900 hover:bg-violet-100" @pointerdown.stop @click.stop="advanceCycle">执行 1 周期</button><div v-if="node.id === 'register'" class="mt-3 grid grid-cols-3 gap-1 text-center font-mono text-[10px]"><span class="rounded border border-emerald-200 bg-emerald-50 py-1 text-emerald-800">D {{ board.data }}</span><span class="rounded border border-violet-200 bg-violet-50 py-1 text-violet-800">CLK ↑</span><span class="rounded border border-amber-200 bg-amber-50 py-1 text-amber-800">Q {{ q }}</span></div></div></div></div>

      <aside class="border-t border-slate-200 bg-white p-4 xl:border-l xl:border-t-0"><div class="text-xs font-semibold text-slate-500">当前模块</div><div class="mt-1 font-mono text-base font-bold text-slate-950">{{ selectedNode.label }}</div><p class="mt-1 text-xs leading-5 text-slate-500">{{ selectedNode.note }}</p><div class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3"><div class="text-xs font-medium text-slate-600">状态</div><div class="mt-3 grid grid-cols-2 gap-2"><div class="rounded border border-emerald-200 bg-white px-2 py-2"><div class="text-[10px] text-slate-500">DATA D</div><div class="font-mono text-xl font-bold text-emerald-800">{{ board.data }}</div></div><div class="rounded border border-amber-200 bg-white px-2 py-2"><div class="text-[10px] text-slate-500">OUTPUT Q</div><div class="font-mono text-xl font-bold text-amber-800">{{ q }}</div></div></div></div><div class="mt-4 grid gap-2"><button type="button" class="inline-flex h-10 items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-100" @click="toggleData"><span><CircleDot class="mr-1.5 inline h-4 w-4" />设置数据 D</span><span class="font-mono">{{ board.data }}</span></button><button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800" @click="advanceCycle"><Activity class="h-4 w-4" />执行 1 个时钟周期</button><button type="button" class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50" @click="reset"><RotateCcw class="h-3.5 w-3.5" />复位布局与状态</button></div><p class="mt-3 text-xs leading-5 text-slate-500"><Zap class="mr-1 inline h-3.5 w-3.5 text-violet-700" />一次周期：低 → 高（Q ← D）→ 低。</p><div v-if="board.lastMission" class="mt-4 rounded-md border border-violet-200 bg-violet-50 px-3 py-3 text-xs text-violet-900"><div class="flex items-center justify-between font-medium"><span>Rule Mission 回执</span><span class="font-mono">t{{ board.lastMission.tick }}</span></div><p class="mt-1.5">{{ board.lastMission.facts.join(' · ') }}</p><p class="mt-1"><Send class="mr-1 inline h-3 w-3" />{{ board.lastMission.consequences.join(' · ') }}</p></div></aside>
    </div>
  </section>
</template>

<style scoped>
.digital-workbench > div:nth-child(2) > div:nth-child(2) {
  overflow: auto;
}

.digital-workbench > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) {
  min-height: var(--digital-canvas-height) !important;
  min-width: var(--digital-canvas-width) !important;
  overflow: visible !important;
}
</style>
