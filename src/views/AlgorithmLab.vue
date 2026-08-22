<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Braces, Cpu, Home, Play, RotateCcw, StepForward } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import { blankCpuSnapshot, createComputerCore, formatHex, type ComputerCoreApi } from "@/lib/computer-core";

const left = ref(1);
const right = ref(2);
const core = ref<ComputerCoreApi | null>(null);
const snapshot = ref(blankCpuSnapshot);
const isBusy = ref(false);
const message = ref("正在连接机器核心…");
const loadedSource = ref("");
const normalizedLeft = computed(() => Math.max(0, Math.min(255, Math.trunc(Number(left.value) || 0))));
const normalizedRight = computed(() => Math.max(0, Math.min(255, Math.trunc(Number(right.value) || 0))));
const mathematicalSum = computed(() => normalizedLeft.value + normalizedRight.value);
const expectedByteResult = computed(() => mathematicalSum.value & 0xff);
const overflowsByte = computed(() => mathematicalSum.value > 0xff);
const source = computed(() => [`MOV A, #${normalizedLeft.value}`, `MOV B, #${normalizedRight.value}`, "ADD A, B", "STORE A, 0x40", "HALT"].join("\n"));
const result = computed(() => snapshot.value.memory[0x40] ?? 0);

async function loadAndRun() {
  if (!core.value) return;
  isBusy.value = true;
  try {
    await core.value.loadProgram(source.value);
    loadedSource.value = source.value;
    snapshot.value = await core.value.runUntilHalt(16);
    message.value = "已将两个输入相加，并把结果写入内存 0x40。";
  } finally { isBusy.value = false; }
}
async function loadAndStep() {
  if (!core.value) return;
  isBusy.value = true;
  try {
    const needsLoad = loadedSource.value !== source.value || snapshot.value.halted;
    if (needsLoad) {
      await core.value.loadProgram(source.value);
      loadedSource.value = source.value;
    }
    snapshot.value = await core.value.step();
    message.value = snapshot.value.halted
      ? "程序已到达 HALT；改动输入后可重新从第一步执行。"
      : needsLoad
        ? "已执行程序的第一步；继续单步可观察寄存器和内存如何变化。"
        : "已继续执行下一步。";
  } finally { isBusy.value = false; }
}
async function resetMachine() {
  if (!core.value) return;
  isBusy.value = true;
  try { snapshot.value = await core.value.reset(); loadedSource.value = ""; message.value = "机器已复位。"; } finally { isBusy.value = false; }
}
onMounted(async () => { const bridge = await createComputerCore(); core.value = bridge.api; message.value = bridge.mode === "wasm" ? "Rust/WASM 核心已就绪。" : "正在使用预览机器核心。"; await loadAndRun(); });
</script>

<template>
  <main class="min-h-screen bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col gap-5 px-4 py-4 lg:px-6">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4"><div class="flex items-center gap-3"><img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" /><div><div class="text-sm font-semibold">算法层</div><div class="text-xs text-slate-500">程序、数据与机器状态</div></div></div><div class="flex gap-2"><RouterLink to="/" class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"><Home class="h-4 w-4" />学习路径</RouterLink><RouterLink to="/computer-lab" class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"><Cpu class="h-4 w-4" />机器层</RouterLink></div></header>
      <section class="rounded-xl border border-cyan-200 bg-white p-5 shadow-sm lg:p-7"><p class="text-xs font-medium text-cyan-700">主线第 5 单元 · 最小可运行切片</p><h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-950">让一个算法真正改变机器</h1><p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">这里的算法是“读取两个数、相加、写回内存”。改动输入后，程序、寄存器和内存会一起变化。</p></section>
      <section class="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-center gap-2 text-sm font-semibold"><Braces class="h-4 w-4 text-cyan-700" />输入数据</div><label class="mt-4 block text-xs font-medium text-slate-500">第一个数 A<input v-model.number="left" type="number" min="0" max="255" class="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900" /></label><label class="mt-3 block text-xs font-medium text-slate-500">第二个数 B<input v-model.number="right" type="number" min="0" max="255" class="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-900" /></label><div class="mt-5 grid grid-cols-2 gap-2"><button type="button" :disabled="isBusy" class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white disabled:bg-slate-300" @click="loadAndRun"><Play class="h-4 w-4" />运行</button><button type="button" :disabled="isBusy" class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 disabled:text-slate-300" @click="loadAndStep"><StepForward class="h-4 w-4" />单步</button></div><button type="button" :disabled="isBusy" class="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50" @click="resetMachine"><RotateCcw class="h-3.5 w-3.5" />复位机器</button></div>
        <div class="min-w-0 space-y-4"><section class="rounded-xl border border-slate-200 bg-slate-950 p-5 text-slate-100 shadow-sm"><div class="flex items-center justify-between gap-3"><div class="text-sm font-semibold">程序</div><span class="rounded bg-white/10 px-2 py-1 text-xs">A + B → 0x40</span></div><pre class="mt-4 overflow-x-auto font-mono text-sm leading-6 text-cyan-100">{{ source }}</pre></section><section class="grid gap-3 sm:grid-cols-3"><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div class="text-xs text-slate-500">寄存器 A</div><div class="mt-2 font-mono text-2xl font-semibold">{{ snapshot.a }}</div></div><div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div class="text-xs text-slate-500">寄存器 B</div><div class="mt-2 font-mono text-2xl font-semibold">{{ snapshot.b }}</div></div><div class="rounded-xl border border-cyan-200 bg-cyan-50 p-4 shadow-sm"><div class="text-xs text-cyan-700">内存 0x40</div><div class="mt-2 font-mono text-2xl font-semibold text-cyan-950">{{ result }} <span class="text-sm font-normal">(0x{{ formatHex(result) }})</span></div></div></section><section class="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600"><div class="font-medium text-slate-900">机器观察</div><p class="mt-1">{{ message }}</p><p class="mt-2 text-xs text-slate-500">数学结果：{{ normalizedLeft }} + {{ normalizedRight }} = {{ mathematicalSum }} · 8-bit 写入：{{ expectedByteResult }}{{ overflowsByte ? '（超过 255，进位保留在 FLAGS.C）' : '' }}</p><p class="mt-2 text-xs text-slate-500">PC：0x{{ formatHex(snapshot.pc) }} · {{ snapshot.currentInstruction }} · {{ snapshot.halted ? "已停止" : "执行中" }} · Carry：{{ Number(snapshot.flags.c) }}</p></section></div>
      </section>
    </div>
  </main>
</template>
