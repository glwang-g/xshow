<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  ArrowLeft,
  ArrowRight,
  Binary,
  Cpu,
  Database,
  FastForward,
  GitBranch,
  Home,
  ListRestart,
  Play,
  RotateCcw,
  StepForward,
  Upload,
} from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import {
  canPreviewSource,
  computerCoreBridgeStatus,
  createComputerCore,
  flagChips,
  formatByte,
  formatHex,
  instructionSetV1,
  integrationSteps,
  machineStats,
  memoryRows,
  previewLoadedCpuSnapshot,
  registerRows,
  sampleAssemblySource,
  type ComputerCoreApi,
} from "@/lib/computer-core";
import { buildMachineLogicManifest } from "@/lib/machine-build";
import { loadPublishedRelayModules, type PublishedRelayModule } from "@/lib/published-modules";

const core = ref<ComputerCoreApi | null>(null);
const bridgeMode = ref<"preview" | "wasm">("preview");
const source = ref(sampleAssemblySource);
const snapshot = ref(previewLoadedCpuSnapshot);
const isBusy = ref(false);
const maxSteps = ref(64);
const actionMessage = ref("正在连接 Rust/WASM 核心…");
const publishedModules = ref<PublishedRelayModule[]>([]);

onMounted(async () => {
  publishedModules.value = loadPublishedRelayModules();
  const bridge = await createComputerCore();
  core.value = bridge.api;
  bridgeMode.value = bridge.mode;
  actionMessage.value = bridge.message;
});
const sampleLines = sampleAssemblySource.split("\n");

const registers = computed(() => registerRows(snapshot.value));
const flags = computed(() => flagChips(snapshot.value));
const rows = computed(() => memoryRows(snapshot.value));
const sourcePreviewable = computed(() => canPreviewSource(source.value));
const hasPreviewProgram = computed(
  () => sourcePreviewable.value && snapshot.value.log.some((line) => line.startsWith("Loaded")),
);
const machineLogic = computed(() => buildMachineLogicManifest(publishedModules.value));

async function applyCoreAction(message: string, action: () => Promise<typeof snapshot.value>) {
  isBusy.value = true;
  try {
    snapshot.value = await action();
    actionMessage.value = message;
  } finally {
    isBusy.value = false;
  }
}

async function loadProgram() {
  const engine = core.value;
  if (!engine) return;
  const wasm = bridgeMode.value === "wasm";
  await applyCoreAction(
    sourcePreviewable.value
      ? wasm
        ? "示例程序已由 Rust/WASM 核心加载。"
        : "示例程序已加载（预览适配层）。"
      : wasm
        ? "程序已由 Rust 核心汇编并加载。"
        : "预览适配层仅执行 A + B 教学程序；其他自定义源码等待 WASM bridge。",
    () => engine.loadProgram(source.value),
  );
}

async function stepProgram() {
  const engine = core.value;
  if (!engine) return;
  await applyCoreAction(
    bridgeMode.value === "wasm" ? "已执行一个机器步。" : "已执行一个预览步。",
    () => engine.step(),
  );
}

async function runProgram() {
  const engine = core.value;
  if (!engine) return;
  await applyCoreAction(
    bridgeMode.value === "wasm"
      ? `已运行到 HALT；最大步数 ${maxSteps.value}。`
      : "已运行到 HALT；最大步数会在 WASM bridge 接入后生效。",
    () => engine.runUntilHalt(maxSteps.value),
  );
}

async function resetProgram() {
  const engine = core.value;
  if (!engine) return;
  await applyCoreAction("机器已复位，内存清空。", () => engine.reset());
}

async function loadSampleProgram() {
  source.value = sampleAssemblySource;
  await loadProgram();
}
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1500px] min-w-0 flex-col gap-5 px-4 py-4 lg:px-6">
      <header class="flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="min-w-0 leading-tight">
            <div class="text-sm font-semibold tracking-tight">机器层</div>
            <div class="text-xs text-slate-500">8-bit 小计算机融合入口</div>
          </div>
        </div>

        <div class="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <RouterLink
            to="/"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Home class="h-4 w-4" />
            <span class="truncate">学习路径</span>
          </RouterLink>
          <RouterLink
            to="/logic-lab"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ArrowLeft class="h-4 w-4" />
            <span class="truncate">上一步：逻辑层</span>
          </RouterLink>
          <RouterLink
            to="/algorithm-lab"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-cyan-200 bg-cyan-50 px-2 text-xs font-medium text-cyan-800 hover:bg-cyan-100 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ArrowRight class="h-4 w-4" />
            <span class="truncate">下一步：算法层</span>
          </RouterLink>
        </div>
      </header>

      <section class="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="flex min-w-0 flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-medium text-cyan-700">主线第 4 单元</p>
                <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">
                  从电路信号走向可执行机器
                </h1>
                <p class="mt-4 max-w-3xl break-words text-sm leading-6 text-slate-600">
                  当前 8-bit CPU 原型已经验证了寄存器、内存、指令和执行日志。下一步是把 Rust 核心通过 WASM 接入主站，让机器状态成为学习路径里的可观察对象。
                </p>
              </div>
              <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Cpu class="h-6 w-6" />
              </span>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="stat in machineStats"
                :key="stat.label"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div class="text-xs font-medium text-slate-500">{{ stat.label }}</div>
                <div class="mt-2 break-words text-sm font-semibold text-slate-950">{{ stat.value }}</div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-sm font-semibold">Assembly Console</h2>
                <p class="text-xs text-slate-500">{{ computerCoreBridgeStatus.title }}</p>
              </div>
              <span
                class="rounded px-2 py-1 text-[11px] font-medium"
                :class="sourcePreviewable ? 'bg-cyan-50 text-cyan-700' : 'bg-amber-50 text-amber-700'"
              >
                {{ bridgeMode === "wasm" ? "WASM 已连接" : sourcePreviewable ? "示例可预览" : "等待 WASM" }}
              </span>
            </div>

            <div class="mt-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
              <textarea
                v-model="source"
                spellcheck="false"
                class="min-h-56 w-full resize-y rounded-lg border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />

              <div class="flex min-w-0 flex-col gap-3">
                <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div class="text-xs font-medium text-slate-500">Bridge</div>
                  <div class="mt-1 text-sm font-semibold text-slate-950">{{ computerCoreBridgeStatus.mode }}</div>
                  <p class="mt-2 text-xs leading-5 text-slate-500">{{ computerCoreBridgeStatus.detail }}</p>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    :disabled="isBusy"
                    @click="loadProgram"
                  >
                    <Upload class="h-4 w-4" />
                    加载
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    :disabled="isBusy"
                    @click="loadSampleProgram"
                  >
                    <ListRestart class="h-4 w-4" />
                    示例
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    :disabled="isBusy || snapshot.halted || !hasPreviewProgram"
                    @click="stepProgram"
                  >
                    <StepForward class="h-4 w-4" />
                    单步
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    :disabled="isBusy || snapshot.halted || !hasPreviewProgram"
                    @click="runProgram"
                  >
                    <FastForward class="h-4 w-4" />
                    运行
                  </button>
                </div>

                <label class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                  <span class="text-xs font-medium text-slate-500">Max steps</span>
                  <input
                    v-model.number="maxSteps"
                    min="1"
                    max="500"
                    type="number"
                    class="h-8 w-24 rounded-md border border-slate-200 px-2 text-right font-mono text-sm outline-none focus:border-cyan-400"
                  />
                </label>

                <button
                  type="button"
                  class="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  :disabled="isBusy"
                  @click="resetProgram"
                >
                  <RotateCcw class="h-4 w-4" />
                  复位机器
                </button>

                <div class="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs leading-5 text-cyan-800">
                  {{ actionMessage }}
                </div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">机器快照</h2>
                <p class="text-xs text-slate-500">{{ bridgeMode === "wasm" ? "Rust/WASM 执行核心" : "预览态 · WASM 未连接" }}</p>
              </div>
              <span class="rounded bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-700">
                PC = 0x{{ formatHex(snapshot.pc) }}
              </span>
            </div>

            <div class="mt-4 grid min-w-0 gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div class="min-w-0 rounded-lg border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <h3 class="text-sm font-semibold">Registers</h3>
                  <Cpu class="h-4 w-4 text-cyan-700" />
                </div>
                <div class="divide-y divide-slate-200">
                  <div
                    v-for="register in registers"
                    :key="register.label"
                    class="grid grid-cols-[64px_minmax(0,1fr)] gap-2 px-3 py-2 text-sm"
                  >
                    <div class="font-semibold text-slate-500">{{ register.label }}</div>
                    <div class="min-w-0 break-words font-mono text-xs text-slate-900">{{ formatByte(register.value) }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-2 border-t border-slate-200 px-3 py-3">
                  <span class="text-xs font-medium text-slate-500">FLAGS</span>
                  <span
                    v-for="flag in flags"
                    :key="flag.label"
                    class="inline-flex h-6 w-7 items-center justify-center rounded border text-xs font-bold"
                    :class="flag.set ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-400'"
                  >
                    {{ flag.label }}
                  </span>
                </div>

                <div class="border-t border-slate-200 px-3 py-3">
                  <div class="text-xs text-slate-500">Next instruction @ PC</div>
                  <div class="mt-1 font-mono text-sm font-semibold text-cyan-700">{{ snapshot.currentInstruction }}</div>
                </div>
              </div>

              <div class="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <h3 class="text-sm font-semibold">Memory</h3>
                  <span class="text-xs text-slate-500">256 B</span>
                </div>
                <div class="max-h-[360px] overflow-auto">
                  <table class="w-full border-separate border-spacing-0 text-xs tabular-nums">
                    <thead class="sticky top-0 bg-slate-100">
                      <tr>
                        <th class="w-14 px-2 py-1 text-left font-normal text-slate-500">addr</th>
                        <th
                          v-for="col in 16"
                          :key="col"
                          class="px-1.5 py-1 text-center font-normal text-slate-500"
                        >
                          {{ formatHex(col - 1, 1) }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in rows" :key="row.base">
                        <td class="border-t border-slate-200 px-2 py-0.5 text-slate-500">0x{{ formatHex(row.base) }}</td>
                        <td
                          v-for="cell in row.cells"
                          :key="cell.addr"
                          class="border-t border-slate-200 px-1.5 py-0.5 text-center"
                          :class="
                            cell.addr === snapshot.pc
                              ? 'bg-cyan-500 font-bold text-white'
                              : cell.byte === 0
                                ? 'text-slate-300'
                                : 'text-slate-900'
                          "
                          :title="`addr 0x${formatHex(cell.addr)} = ${cell.byte}`"
                        >
                          {{ formatHex(cell.byte) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">指令集合 v1</h2>
                <p class="text-xs text-slate-500">面向教学的小型 Von Neumann 机器</p>
              </div>
              <Binary class="h-5 w-5 text-cyan-700" />
            </div>

            <div class="mt-4 grid gap-2 md:grid-cols-2">
              <div
                v-for="instruction in instructionSetV1"
                :key="instruction.mnemonic"
                class="flex min-w-0 items-start justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div class="min-w-0">
                  <div class="font-mono text-sm font-semibold text-slate-950">{{ instruction.mnemonic }}</div>
                  <div class="mt-1 text-xs leading-5 text-slate-500">{{ instruction.note }}</div>
                </div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">Execution Log</h2>
                <p class="text-xs text-slate-500">{{ snapshot.log.length }} lines · {{ bridgeMode === "wasm" ? "Rust 核心" : "预览态" }}</p>
              </div>
            </div>

            <div class="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-950 px-3 py-2">
              <div
                v-for="line in snapshot.log"
                :key="line"
                class="whitespace-pre font-mono text-xs leading-6 text-slate-200"
              >
                {{ line }}
              </div>
            </div>
          </section>
        </div>

        <aside class="flex w-full min-w-0 max-w-full flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <p class="text-xs font-medium text-cyan-700">来自逻辑与存储层</p>
                <h2 class="mt-1 text-sm font-semibold">我的机器逻辑基座</h2>
              </div>
              <span class="rounded px-2 py-1 text-[11px] font-medium" :class="machineLogic.ready ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'">
                {{ machineLogic.ready ? '3 / 3 已接入' : `${3 - machineLogic.missing.length} / 3 已接入` }}
              </span>
            </div>
            <p class="mt-2 text-xs leading-5 text-slate-500">
              只接纳完成真值表验证的工坊模块。它说明机器的加法与控制路径来自哪些可展开逻辑门；执行仍由 CPU 核心负责。
            </p>
            <div class="mt-3 space-y-2">
              <div v-for="slot in machineLogic.slots" :key="slot.gate" class="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div class="min-w-0"><span class="font-mono text-xs font-semibold text-slate-950">{{ slot.gate }}</span><span class="ml-2 text-xs text-slate-500">{{ slot.role }}</span></div>
                <RouterLink
                  v-if="slot.module"
                  :to="{ path: '/workbench/workshop', query: { module: slot.module.id } }"
                  class="max-w-32 truncate rounded bg-emerald-50 px-2 py-1 font-mono text-[11px] text-emerald-800 hover:bg-emerald-100 hover:underline"
                  :title="`在器件工坊展开 ${slot.module.name}`"
                >
                  {{ slot.module.name }}
                </RouterLink>
                <span v-else class="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">待制作</span>
              </div>
            </div>
            <RouterLink to="/logic-lab" class="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-medium text-cyan-800 hover:bg-cyan-100">
              {{ machineLogic.ready ? '查看已接入的逻辑模块' : '去逻辑层补齐模块' }}
              <ArrowLeft class="h-4 w-4" />
            </RouterLink>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">融合状态</h2>
                <p class="text-xs text-slate-500">Rust core -> WASM -> Vue UI</p>
              </div>
              <GitBranch class="h-5 w-5 text-cyan-700" />
            </div>

            <div class="mt-4 space-y-3">
              <div
                v-for="step in integrationSteps"
                :key="step.title"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="text-sm font-semibold text-slate-950">{{ step.title }}</div>
                  <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-cyan-700">{{ step.status }}</span>
                </div>
                <p class="mt-2 text-xs leading-5 text-slate-500">{{ step.detail }}</p>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">当前原型</h2>
                <p class="text-xs text-slate-500">modules/cpu-sim</p>
              </div>
              <Database class="h-5 w-5 text-cyan-700" />
            </div>

            <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="font-mono text-xs leading-5 text-slate-600">
                <template v-for="line in sampleLines" :key="line">
                  {{ line }}<br />
                </template>
              </div>
            </div>

            <div class="mt-4 grid gap-2">
              <div
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
              >
                <Play class="h-4 w-4" />
                融合方案已整理
              </div>
              <RouterLink
                to="/workbench"
                class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                回到信号与电路
                <ArrowRight class="h-4 w-4" />
              </RouterLink>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </main>
</template>
