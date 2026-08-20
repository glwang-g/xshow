<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Activity, ArrowRight, Binary, CircuitBoard, Cpu, Home, RotateCcw, Zap } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import {
  buildRegisterTrace,
  buildSrLatchTrace,
  defaultRegisterSamples,
  evaluateGate,
  logicGateSummaries,
  srLatchStep,
  truthTable,
  type LogicBit,
  type LogicGateKind,
} from "@/lib/logic-core";
import {
  loadPublishedRelayModules,
  relayOutputForInput,
  type PublishedRelayModule,
} from "@/lib/published-modules";

const selectedGate = ref<LogicGateKind>("AND");
const inputA = ref(true);
const inputB = ref(false);
const latchQ = ref<LogicBit>(0);
const latchSet = ref(false);
const latchReset = ref(false);
const registerData = ref<LogicBit>(1);
const registerQ = ref<LogicBit>(0);
const publishedRelays = ref<PublishedRelayModule[]>([]);
const relayInputs = ref<Record<string, boolean>>({});

onMounted(() => {
  publishedRelays.value = loadPublishedRelayModules();
  relayInputs.value = Object.fromEntries(publishedRelays.value.map((module) => [module.id, false]));
});

const selectedGateSummary = computed(
  () => logicGateSummaries.find((gate) => gate.kind === selectedGate.value) ?? logicGateSummaries[0],
);
const gateRows = computed(() => truthTable(selectedGate.value));
const liveGateOutput = computed(() => evaluateGate(selectedGate.value, inputA.value, inputB.value));
const latchPreview = computed(() => srLatchStep(latchQ.value, { set: latchSet.value, reset: latchReset.value }));
const latchTrace = computed(() => buildSrLatchTrace());
const registerTrace = computed(() => buildRegisterTrace());

function bitClass(bit: LogicBit) {
  return bit === 1 ? "border-cyan-300 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-400";
}

function selectGate(kind: LogicGateKind) {
  selectedGate.value = kind;
}

function applyLatch() {
  const next = latchPreview.value;
  if (next.mode !== "invalid") {
    latchQ.value = next.q;
  }
}

function resetLatch() {
  latchQ.value = 0;
  latchSet.value = false;
  latchReset.value = false;
}

function pulseRegister() {
  registerQ.value = registerData.value;
}

function resetRegister() {
  registerQ.value = 0;
  registerData.value = 1;
}

function toggleRelayInput(module: PublishedRelayModule) {
  relayInputs.value[module.id] = !relayInputs.value[module.id];
}

function relayOutput(module: PublishedRelayModule) {
  return relayOutputForInput(module, relayInputs.value[module.id] ?? false) ? 1 : 0;
}
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1500px] min-w-0 flex-col gap-5 px-4 py-4 lg:px-6">
      <header class="flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="min-w-0 leading-tight">
            <div class="text-sm font-semibold tracking-tight">逻辑与存储层</div>
            <div class="text-xs text-slate-500">门电路、锁存器、寄存器</div>
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
            to="/workbench/workshop"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <CircuitBoard class="h-4 w-4" />
            <span class="truncate">电路层</span>
          </RouterLink>
          <RouterLink
            to="/computer-lab"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <Cpu class="h-4 w-4" />
            <span class="truncate">机器层</span>
          </RouterLink>
        </div>
      </header>

      <section class="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="flex min-w-0 flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-medium text-cyan-700">主线第二层</p>
                <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-950 lg:text-4xl">
                  把通断信号组合成可记忆状态
                </h1>
                <p class="mt-4 max-w-3xl break-words text-sm leading-6 text-slate-600">
                  从布尔门开始，继续看见 latch 如何保持 1 bit，再走到寄存器如何在时钟边沿保存数据。
                </p>
              </div>
              <span class="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Binary class="h-6 w-6" />
              </span>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div class="text-xs font-medium text-slate-500">门电路</div>
                <div class="mt-2 text-sm font-semibold text-slate-950">AND / OR / XOR / NOT</div>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div class="text-xs font-medium text-slate-500">存储单元</div>
                <div class="mt-2 text-sm font-semibold text-slate-950">SR latch · 1 bit</div>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                <div class="text-xs font-medium text-slate-500">机器连接点</div>
                <div class="mt-2 text-sm font-semibold text-slate-950">Register -> CPU</div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-cyan-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium text-cyan-700">来自信号与电路层</p>
                <h2 class="mt-1 text-sm font-semibold">我的电路模块</h2>
                <p class="mt-1 text-xs leading-5 text-slate-500">已发布的手搓继电器以端口组件进入逻辑层；它们仍保留来源电路快照。</p>
              </div>
              <RouterLink
                to="/workbench/workshop"
                class="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-xs font-medium text-cyan-800 hover:bg-cyan-100"
              >
                <CircuitBoard class="h-4 w-4" />
                去制作继电器
              </RouterLink>
            </div>

            <div v-if="publishedRelays.length" class="mt-4 grid gap-3 lg:grid-cols-2">
              <article v-for="module in publishedRelays" :key="module.id" class="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-mono text-sm font-semibold text-slate-950">{{ module.name }}</div>
                    <div class="mt-1 text-xs text-slate-500">{{ module.behavior.contactMode === 'normally-closed' ? 'NC：输入为 0 时触点导通' : 'NO：输入为 1 时触点导通' }}</div>
                  </div>
                  <span class="rounded border px-2 py-1 font-mono text-xs font-semibold" :class="relayOutput(module) ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-700'">
                    OUT {{ relayOutput(module) }}
                  </span>
                </div>
                <div class="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="flex h-10 items-center justify-between rounded-md border px-3 text-sm font-medium"
                    :class="relayInputs[module.id] ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500'"
                    @click="toggleRelayInput(module)"
                  >
                    线圈输入
                    <span class="font-mono font-bold">{{ Number(relayInputs[module.id] ?? false) }}</span>
                  </button>
                  <div class="flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 font-mono text-xs text-slate-600">
                    {{ module.ports.map((port) => port.label).join(' · ') }}
                  </div>
                </div>
                <details class="mt-3 text-xs text-slate-500">
                  <summary class="cursor-pointer text-cyan-700">查看来源快照（{{ module.implementation.parts.length }} 个元件，{{ module.implementation.wires.length }} 根导线）</summary>
                  <p class="mt-2 leading-5">已保存线圈、触点、接线与端口映射。下一步将支持直接在工作台展开此快照。</p>
                </details>
              </article>
            </div>
            <p v-else class="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">还没有已发布模块。回到电路层，绑定线圈和弹簧开关后，在属性面板发布 RelaySwitch。</p>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">Logic Gates</h2>
                <p class="text-xs text-slate-500">{{ selectedGateSummary.description }}</p>
              </div>
              <span class="rounded bg-cyan-50 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-700">
                {{ selectedGateSummary.symbol }}
              </span>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <button
                v-for="gate in logicGateSummaries"
                :key="gate.kind"
                type="button"
                class="inline-flex h-9 items-center rounded-md border px-3 font-mono text-sm font-semibold"
                :class="gate.kind === selectedGate ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
                @click="selectGate(gate.kind)"
              >
                {{ gate.kind }}
              </button>
            </div>

            <div class="mt-4 grid min-w-0 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div class="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="flex h-12 items-center justify-between rounded-md border px-3 text-sm font-medium"
                    :class="inputA ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500'"
                    @click="inputA = !inputA"
                  >
                    A
                    <span class="font-mono text-base font-bold">{{ Number(inputA) }}</span>
                  </button>
                  <button
                    type="button"
                    class="flex h-12 items-center justify-between rounded-md border px-3 text-sm font-medium"
                    :class="inputB ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-500'"
                    :disabled="selectedGate === 'NOT'"
                    @click="inputB = !inputB"
                  >
                    B
                    <span class="font-mono text-base font-bold">{{ selectedGate === "NOT" ? "-" : Number(inputB) }}</span>
                  </button>
                </div>

                <div class="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3">
                  <div class="text-xs font-medium text-slate-500">OUT</div>
                  <div class="mt-2 font-mono text-3xl font-semibold text-slate-950">{{ liveGateOutput }}</div>
                </div>
              </div>

              <div class="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <table class="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr class="bg-slate-100 text-left text-xs text-slate-500">
                      <th class="px-3 py-2 font-medium">A</th>
                      <th class="px-3 py-2 font-medium">B</th>
                      <th class="px-3 py-2 font-medium">OUT</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in gateRows" :key="`${row.a}-${row.b}-${row.out}`">
                      <td class="border-t border-slate-200 px-3 py-2 font-mono">{{ row.a }}</td>
                      <td class="border-t border-slate-200 px-3 py-2 font-mono">{{ row.b ?? "-" }}</td>
                      <td class="border-t border-slate-200 px-3 py-2">
                        <span class="inline-flex h-7 w-9 items-center justify-center rounded border font-mono text-sm font-bold" :class="bitClass(row.out)">
                          {{ row.out }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section class="grid min-w-0 gap-4 xl:grid-cols-2">
            <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-sm font-semibold">SR Latch</h2>
                  <p class="text-xs text-slate-500">Q = {{ latchQ }}</p>
                </div>
                <Activity class="h-5 w-5 text-cyan-700" />
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex h-11 items-center justify-between rounded-md border px-3 text-sm font-medium"
                  :class="latchSet ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-slate-50 text-slate-600'"
                  @click="latchSet = !latchSet"
                >
                  S
                  <span class="font-mono font-bold">{{ Number(latchSet) }}</span>
                </button>
                <button
                  type="button"
                  class="flex h-11 items-center justify-between rounded-md border px-3 text-sm font-medium"
                  :class="latchReset ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-slate-50 text-slate-600'"
                  @click="latchReset = !latchReset"
                >
                  R
                  <span class="font-mono font-bold">{{ Number(latchReset) }}</span>
                </button>
              </div>

              <div class="mt-3 grid grid-cols-2 gap-2">
                <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div class="text-xs font-medium text-slate-500">Next Q</div>
                  <div class="mt-2 font-mono text-2xl font-semibold text-slate-950">{{ latchPreview.q }}</div>
                </div>
                <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                  <div class="text-xs font-medium text-slate-500">Next !Q</div>
                  <div class="mt-2 font-mono text-2xl font-semibold text-slate-950">{{ latchPreview.notQ }}</div>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                  @click="applyLatch"
                >
                  <Zap class="h-4 w-4" />
                  写入
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  @click="resetLatch"
                >
                  <RotateCcw class="h-4 w-4" />
                  复位
                </button>
              </div>

              <div
                class="mt-3 rounded-lg border px-3 py-2 text-xs font-medium"
                :class="latchPreview.mode === 'invalid' ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-cyan-100 bg-cyan-50 text-cyan-800'"
              >
                {{ latchPreview.note }}
              </div>
            </section>

            <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-sm font-semibold">1-bit Register</h2>
                  <p class="text-xs text-slate-500">Rising edge capture</p>
                </div>
                <Binary class="h-5 w-5 text-cyan-700" />
              </div>

              <div class="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="flex h-11 items-center justify-between rounded-md border px-3 text-sm font-medium"
                  :class="registerData === 1 ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-slate-50 text-slate-600'"
                  @click="registerData = registerData === 1 ? 0 : 1"
                >
                  D
                  <span class="font-mono font-bold">{{ registerData }}</span>
                </button>
                <div class="flex h-11 items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                  Q
                  <span class="font-mono font-bold">{{ registerQ }}</span>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                  @click="pulseRegister"
                >
                  <Activity class="h-4 w-4" />
                  上升沿
                </button>
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  @click="resetRegister"
                >
                  <RotateCcw class="h-4 w-4" />
                  复位
                </button>
              </div>

              <div class="mt-4 grid grid-cols-6 gap-1.5">
                <div
                  v-for="sample in defaultRegisterSamples"
                  :key="sample.label"
                  class="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-center"
                >
                  <div class="text-[11px] text-slate-500">{{ sample.label }}</div>
                  <div class="mt-1 font-mono text-xs text-slate-700">C{{ Number(sample.clock) }}</div>
                  <div class="font-mono text-xs text-slate-700">D{{ sample.data }}</div>
                </div>
              </div>
            </section>
          </section>
        </div>

        <aside class="flex w-full min-w-0 max-w-full flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">层级连接</h2>
                <p class="text-xs text-slate-500">Signal -> Logic -> Machine</p>
              </div>
              <ArrowRight class="h-5 w-5 text-cyan-700" />
            </div>

            <div class="mt-4 grid gap-2">
              <RouterLink
                to="/workbench/workshop"
                class="inline-flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                信号与电路层
                <CircuitBoard class="h-4 w-4" />
              </RouterLink>
              <RouterLink
                to="/computer-lab"
                class="inline-flex h-10 items-center justify-between rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                机器层
                <Cpu class="h-4 w-4" />
              </RouterLink>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">Latch Trace</h2>
                <p class="text-xs text-slate-500">{{ latchTrace.length }} steps</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div
                v-for="(step, index) in latchTrace"
                :key="`${index}-${step.mode}`"
                class="grid grid-cols-[36px_1fr_44px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <div class="font-mono text-slate-500">t{{ index }}</div>
                <div class="min-w-0">
                  <div class="font-medium text-slate-900">{{ step.note }}</div>
                  <div class="font-mono text-slate-500">S{{ Number(step.set) }} R{{ Number(step.reset) }}</div>
                </div>
                <span class="inline-flex h-7 items-center justify-center rounded border font-mono font-bold" :class="bitClass(step.q)">
                  Q{{ step.q }}
                </span>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">Register Trace</h2>
                <p class="text-xs text-slate-500">{{ registerTrace.filter((step) => step.captured).length }} captures</p>
              </div>
            </div>

            <div class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <table class="w-full border-separate border-spacing-0 text-xs">
                <thead>
                  <tr class="bg-slate-100 text-left text-slate-500">
                    <th class="px-2 py-2 font-medium">t</th>
                    <th class="px-2 py-2 font-medium">CLK</th>
                    <th class="px-2 py-2 font-medium">D</th>
                    <th class="px-2 py-2 font-medium">Q</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="step in registerTrace" :key="step.label">
                    <td class="border-t border-slate-200 px-2 py-2 font-mono">{{ step.label }}</td>
                    <td class="border-t border-slate-200 px-2 py-2 font-mono">{{ Number(step.clock) }}</td>
                    <td class="border-t border-slate-200 px-2 py-2 font-mono">{{ step.data }}</td>
                    <td class="border-t border-slate-200 px-2 py-2">
                      <span class="inline-flex h-6 w-8 items-center justify-center rounded border font-mono font-bold" :class="bitClass(step.q)">
                        {{ step.q }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </main>
</template>
