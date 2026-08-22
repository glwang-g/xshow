<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ArrowRight, Binary, CircuitBoard, Cpu, Sparkles, Swords, Wrench } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import { useRepairProgress } from "@/composables/useRepairProgress";
import { lessonCatalog } from "@/data/lessons";
import { buildMachineLogicManifest } from "@/lib/machine-build";
import { loadPublishedRelayModules, type PublishedRelayModule } from "@/lib/published-modules";

const { hasCurrentRepair, markRepairStarted, missionCount, nextRepairLevel, progressPercent, repairTaskStatusLabel } = useRepairProgress();
const firstLesson = lessonCatalog.find((lesson) => !lesson.nextStage);
const firstRepairLevel = computed(() => nextRepairLevel.value);
const firstRepairRoute = computed(() => ({ path: "/repair-lab", query: { level: firstRepairLevel.value?.id } }));
const startHereTitle = computed(() => firstLesson?.title ?? "点亮第一个回路");
const publishedModules = ref<PublishedRelayModule[]>([]);
const publishedGateCount = computed(() => publishedModules.value.filter((module) => module.kind === "logic-gate").length);
const machineLogic = computed(() => buildMachineLogicManifest(publishedModules.value));
const workshopNextStep = computed(() => publishedModules.value.length ? `已发布 ${publishedModules.value.length} 个模块` : "从继电器开始制作");
const logicNextStep = computed(() => publishedGateCount.value ? `使用 ${publishedGateCount.value} 个已发布逻辑门` : "先在器件工坊发布逻辑门");
const machineNextStep = computed(() => machineLogic.value.ready ? "逻辑基座已就绪" : `还差 ${machineLogic.value.missing.map((slot) => slot.gate).join(" / ")}`);

onMounted(() => {
  publishedModules.value = loadPublishedRelayModules();
});
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <header class="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <RouterLink to="/" class="flex min-w-0 items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="min-w-0 leading-tight"><div class="text-sm font-semibold tracking-tight">明石空间</div><div class="text-xs text-slate-500">从信号到算法</div></div>
        </RouterLink>
        <RouterLink to="/workbench/free" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><CircuitBoard class="h-4 w-4" />工作台</RouterLink>
      </header>

      <section class="grid gap-5 rounded-2xl border border-cyan-200 bg-[linear-gradient(135deg,#f2fbf8_0%,#eef7ff_100%)] p-6 shadow-sm lg:grid-cols-[minmax(0,1fr)_280px] lg:p-8">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">Interactive Computer Playground</p>
          <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">从一条电路，亲手走到一台计算机</h1>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-slate-600">不必先记概念。先让信号流动，再制作继电器和逻辑门，最后看见存储、机器与算法如何逐层出现。</p>
          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink to="/workbench/free" class="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800">开始：{{ startHereTitle }}<ArrowRight class="h-4 w-4" /></RouterLink>
            <RouterLink to="/workbench/workshop" class="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-200 bg-white px-4 text-sm font-medium text-cyan-800 hover:bg-cyan-50"><Wrench class="h-4 w-4" />进入器件工坊</RouterLink>
          </div>
        </div>
        <div class="rounded-xl border border-white/80 bg-white/80 p-5">
          <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">学习方式</div>
          <div class="mt-3 text-lg font-semibold text-slate-950">每一步都留下下一步能用的东西</div>
          <ol class="mt-4 space-y-3 text-sm">
            <li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-mono text-xs font-semibold text-cyan-800">1</span><div><div class="font-medium text-slate-800">搭建</div><p class="text-xs leading-5 text-slate-600">让信号流过亲手连接的电路。</p></div></li>
            <li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-mono text-xs font-semibold text-cyan-800">2</span><div><div class="font-medium text-slate-800">验证</div><p class="text-xs leading-5 text-slate-600">用真值表确认继电器和门的行为。</p></div></li>
            <li class="flex gap-3"><span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-100 font-mono text-xs font-semibold text-cyan-800">3</span><div><div class="font-medium text-slate-800">使用</div><p class="text-xs leading-5 text-slate-600">在逻辑、机器和算法层继续展开来源。</p></div></li>
          </ol>
          <div class="mt-5 border-t border-slate-200/80 pt-3 text-xs font-medium text-cyan-800">五个独立单元 · 每层都可回溯</div>
        </div>
      </section>

      <section>
        <div class="flex flex-wrap items-end justify-between gap-2"><div><p class="text-xs font-medium text-cyan-700">主线学习路径</p><h2 class="mt-1 text-2xl font-semibold tracking-tight text-slate-950">五个单元，按顺序深入</h2></div><p class="text-xs text-slate-500">每个单元只回答一个问题</p></div>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <RouterLink to="/workbench/free" class="group rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 hover:bg-cyan-50"><div class="flex items-center justify-between"><CircuitBoard class="h-5 w-5 text-cyan-700" /><span class="font-mono text-xs font-semibold text-cyan-700">01</span></div><h3 class="mt-6 text-sm font-semibold text-slate-950">信号与电路</h3><p class="mt-1 text-xs leading-5 text-slate-600">电怎样流动，哪里断了？</p><span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-700">开始 <ArrowRight class="h-3.5 w-3.5" /></span></RouterLink>
          <RouterLink to="/workbench/workshop" class="group rounded-xl border border-amber-200 bg-amber-50/70 p-4 hover:bg-amber-50"><div class="flex items-center justify-between"><Wrench class="h-5 w-5 text-amber-700" /><span class="font-mono text-xs font-semibold text-amber-700">02</span></div><h3 class="mt-6 text-sm font-semibold text-slate-950">器件工坊</h3><p class="mt-1 text-xs leading-5 text-slate-600">怎样做出继电器和逻辑门？</p><span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-amber-700">{{ workshopNextStep }} <ArrowRight class="h-3.5 w-3.5" /></span></RouterLink>
          <RouterLink to="/logic-lab" class="group rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"><div class="flex items-center justify-between"><Binary class="h-5 w-5 text-slate-600" /><span class="font-mono text-xs font-semibold text-slate-500">03</span></div><h3 class="mt-6 text-sm font-semibold text-slate-950">逻辑与存储</h3><p class="mt-1 text-xs leading-5 text-slate-600">0/1 怎样运算并留下状态？</p><span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600">{{ logicNextStep }} <ArrowRight class="h-3.5 w-3.5" /></span></RouterLink>
          <RouterLink to="/computer-lab" class="group rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"><div class="flex items-center justify-between"><Cpu class="h-5 w-5 text-slate-600" /><span class="font-mono text-xs font-semibold text-slate-500">04</span></div><h3 class="mt-6 text-sm font-semibold text-slate-950">机器</h3><p class="mt-1 text-xs leading-5 text-slate-600">小计算机怎样执行指令？</p><span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600">{{ machineNextStep }} <ArrowRight class="h-3.5 w-3.5" /></span></RouterLink>
          <RouterLink to="/algorithm-lab" class="group rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"><div class="flex items-center justify-between"><Sparkles class="h-5 w-5 text-slate-600" /><span class="font-mono text-xs font-semibold text-slate-500">05</span></div><h3 class="mt-6 text-sm font-semibold text-slate-950">算法</h3><p class="mt-1 text-xs leading-5 text-slate-600">程序如何改变数据和机器状态？</p><span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600">运行 <ArrowRight class="h-3.5 w-3.5" /></span></RouterLink>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-4"><div><p class="text-xs font-medium text-slate-500">番外篇</p><h2 class="mt-1 text-lg font-semibold text-slate-950">信号诊断</h2><p class="mt-2 text-sm leading-6 text-slate-600">一组独立的故障排查关卡，不属于五单元主线。</p></div><Wrench class="h-5 w-5 shrink-0 text-slate-500" /></div><RouterLink :to="firstRepairRoute" class="mt-4 inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50" @click="markRepairStarted(firstRepairLevel?.id)">{{ hasCurrentRepair ? "继续诊断" : (firstRepairLevel?.title ?? "进入诊断练习") }}<span class="text-xs text-slate-500">{{ repairTaskStatusLabel(firstRepairLevel?.id) }}</span><ArrowRight class="h-4 w-4" /></RouterLink></section>
        <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p class="text-xs font-medium text-slate-500">探索实验区</p><h2 class="mt-1 text-lg font-semibold text-slate-950">主线之外的原型</h2><p class="mt-2 text-sm leading-6 text-slate-600">它们保持可见，但不占用学习路径的注意力。</p><div class="mt-4 flex flex-wrap gap-2"><RouterLink to="/tank-lab" class="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Swords class="h-4 w-4" />战车试验场</RouterLink><RouterLink to="/rubiks-cube" class="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Sparkles class="h-4 w-4" />3D 魔方</RouterLink></div></section>
      </section>
    </div>
  </main>
</template>
