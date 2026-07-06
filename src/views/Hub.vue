<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight, Binary, CircuitBoard, Cpu, Sparkles, Swords, Wrench } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import { useRepairProgress } from "@/composables/useRepairProgress";
import { lessonCatalog } from "@/data/lessons";

const {
  completedCount,
  currentLevel,
  hasCurrentRepair,
  markRepairStarted,
  missionCount,
  nextRepairLevel,
  progressPercent,
  recentActivity,
  repairTaskStatusLabel,
} = useRepairProgress();

const firstLesson = lessonCatalog[0];
const firstRepairLevel = computed(() => nextRepairLevel.value ?? currentLevel.value);
const firstRepairRoute = computed(() => ({ path: "/repair-lab", query: { level: firstRepairLevel.value?.id } }));
const startHereTitle = computed(() => firstLesson?.title ?? "实验 1：点亮小灯泡");
const systemMap = [
  {
    id: "signal",
    step: "01",
    title: "信号与电路层",
    question: "电为什么会流动，哪里断了？",
    detail: "看见通断、方向、亮度和测量结果。",
  },
  {
    id: "logic",
    step: "02",
    title: "逻辑与存储层",
    question: "信号怎么变成 0/1 和记忆？",
    detail: "门电路、latch、寄存器把瞬时状态留下来。",
  },
  {
    id: "machine",
    step: "03",
    title: "机器层",
    question: "一台小计算机怎样一步步执行？",
    detail: "寄存器、PC、内存和指令开始形成机器。",
  },
  {
    id: "algorithm",
    step: "04",
    title: "算法层",
    question: "程序和数据结构怎样落到机器上？",
    detail: "排序、搜索和结构变化最终会回到内存与执行过程。",
  },
];

function formatProgressDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1500px] min-w-0 flex-col gap-5 px-4 py-4 lg:px-6">
      <header class="flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="min-w-0 leading-tight">
            <div class="text-sm font-semibold tracking-tight">明石空间</div>
            <div class="text-xs text-slate-500">从信号到算法的学习路径</div>
          </div>
        </div>

        <div class="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <RouterLink
            to="/workbench"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <CircuitBoard class="h-4 w-4" />
            <span class="truncate">工作台</span>
          </RouterLink>
        </div>
      </header>

      <section class="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex min-w-0 flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-cyan-200 bg-[linear-gradient(135deg,#f2fbf8_0%,#eef7ff_100%)] p-5 shadow-sm lg:p-6">
            <div class="max-w-4xl min-w-0">
              <p class="text-xs font-medium uppercase tracking-[0.18em] text-cyan-700">Interactive Computer Playground</p>
              <h1 class="mt-3 text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl lg:text-[3.15rem]">
                把计算机从电流一路拆开给你看
              </h1>
              <p class="mt-4 max-w-3xl break-words text-sm leading-6 text-slate-600 sm:text-[15px]">
                明石空间不是资料堆，也不是孤立的小工具集合。它是一块可上手、可观察、可调试的演示平台，
                带你从信号、电路、逻辑、存储、CPU 一直走到程序执行和算法行为。
              </p>
            </div>

            <div class="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
              <section class="min-w-0 rounded-xl border border-slate-900 bg-slate-950 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] lg:p-6">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-cyan-200">主入口</span>
                  <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-200">从手电筒与小灯泡出发</span>
                </div>

                <h2 class="mt-4 text-2xl font-semibold leading-tight tracking-tight text-white">
                  从一个回路开始，走到逻辑、机器和算法
                </h2>
                <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  这里最重要的不是“功能多”，而是你能亲手把抽象概念一个个接上。先让信号流起来，后面的 0/1、
                  寄存器、CPU 和程序执行就都会变得具体。
                </p>

                <div class="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="grid gap-3 sm:grid-cols-4">
                    <div class="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                        <CircuitBoard class="h-5 w-5" />
                      </div>
                      <div class="mt-3 text-sm font-semibold text-white">信号</div>
                      <div class="mt-1 text-xs leading-5 text-slate-300">先看见电流怎么流。</div>
                    </div>
                    <div class="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                        <Binary class="h-5 w-5" />
                      </div>
                      <div class="mt-3 text-sm font-semibold text-white">逻辑</div>
                      <div class="mt-1 text-xs leading-5 text-slate-300">再看 0/1 怎么留下来。</div>
                    </div>
                    <div class="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                        <Cpu class="h-5 w-5" />
                      </div>
                      <div class="mt-3 text-sm font-semibold text-white">机器</div>
                      <div class="mt-1 text-xs leading-5 text-slate-300">寄存器和指令开始配合。</div>
                    </div>
                    <div class="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
                        <Sparkles class="h-5 w-5" />
                      </div>
                      <div class="mt-3 text-sm font-semibold text-white">算法</div>
                      <div class="mt-1 text-xs leading-5 text-slate-300">最后回到程序行为本身。</div>
                    </div>
                  </div>
                </div>

                <div class="mt-5 flex flex-wrap gap-3">
                  <RouterLink
                    to="/workbench"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
                  >
                    <CircuitBoard class="h-4 w-4" />
                    从工作台开始
                  </RouterLink>
                  <RouterLink
                    :to="firstRepairRoute"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/15"
                    @click="markRepairStarted(firstRepairLevel?.id)"
                  >
                    <Wrench class="h-4 w-4" />
                    再做一个诊断练习
                  </RouterLink>
                </div>

                <div class="mt-6 flex flex-wrap gap-2 text-xs">
                  <span class="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-slate-200">
                    起步实验: {{ startHereTitle }}
                  </span>
                  <span class="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-slate-200">
                    {{ missionCount }} 个诊断关卡
                  </span>
                  <span class="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-slate-200">
                    当前进度 {{ progressPercent }}%
                  </span>
                </div>
              </section>

              <section class="min-w-0 rounded-xl border border-white/70 bg-white/80 p-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-sm font-semibold text-slate-950">新手从这里建立整体观感</div>
                    <div class="mt-1 text-xs leading-5 text-slate-500">一张卡同时告诉你先走哪一步，以及后面的四层分别在回答什么。</div>
                  </div>
                  <span class="rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-medium text-cyan-700">约 10 分钟</span>
                </div>

                <div class="mt-4 space-y-2.5">
                  <RouterLink
                    to="/workbench"
                    class="group grid grid-cols-[34px_minmax(0,1fr)_16px] items-center gap-3 rounded-lg border border-cyan-200 bg-cyan-50/60 px-3 py-3 transition-colors hover:bg-cyan-50"
                  >
                    <div class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-xs font-semibold text-cyan-700">01</div>
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold text-slate-950">点亮第一个回路</div>
                      <div class="text-xs text-slate-500">先把抽象问题变成一个能看见的电路现象。</div>
                    </div>
                    <ArrowRight class="h-4 w-4 text-cyan-700 transition-transform group-hover:translate-x-0.5" />
                  </RouterLink>

                  <RouterLink
                    :to="firstRepairRoute"
                    class="group grid grid-cols-[34px_minmax(0,1fr)_16px] items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 transition-colors hover:bg-slate-100"
                    @click="markRepairStarted(firstRepairLevel?.id)"
                  >
                    <div class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-xs font-semibold text-slate-700">02</div>
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold text-slate-950">{{ firstRepairLevel?.title }}</div>
                      <div class="text-xs text-slate-500">开始判断哪里有信号、哪里已经断开。</div>
                    </div>
                    <ArrowRight class="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5" />
                  </RouterLink>
                </div>

                <div class="mt-5 border-t border-slate-200 pt-4">
                  <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">四层地图</div>
                  <div class="mt-3 space-y-2.5">
                    <div
                      v-for="item in systemMap"
                      :key="item.id"
                      class="grid grid-cols-[32px_minmax(0,1fr)] gap-3 rounded-lg bg-slate-50 px-3 py-3"
                    >
                      <div class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white font-mono text-[11px] font-semibold text-cyan-700">
                        {{ item.step }}
                      </div>
                      <div class="min-w-0">
                        <div class="text-sm font-semibold text-slate-950">{{ item.title }}</div>
                        <div class="mt-1 text-xs leading-5 text-slate-500">{{ item.question }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium text-cyan-700">主线学习路径</p>
                <h2 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">四个入口，一条主线</h2>
                <p class="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-600">
                  每个入口都对应一层理解深度。先抓住它是干什么的，再决定你现在想从哪一层切进去。
                </p>
              </div>
              <img class="h-12 w-12 shrink-0 object-contain" :src="logoUrl" alt="明石空间 logo large" />
            </div>

            <div class="mt-5 grid gap-3 lg:grid-cols-4">
              <RouterLink
                to="/workbench"
                class="group flex min-w-0 flex-col justify-between rounded-xl border border-cyan-200 bg-cyan-50/70 p-4 transition-colors hover:bg-cyan-50"
              >
                <div>
                  <div class="h-24 overflow-hidden rounded-md bg-white/85 px-3 py-3">
                    <div class="flex h-full items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <div class="flex h-12 w-7 flex-col justify-between rounded bg-slate-900 px-1 py-1">
                          <div class="h-1.5 rounded bg-cyan-300"></div>
                          <div class="h-1.5 rounded bg-white/30"></div>
                        </div>
                        <div class="h-0.5 w-10 bg-cyan-500"></div>
                      </div>
                      <div class="flex items-center gap-2">
                        <div class="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-100 text-sm font-semibold text-amber-700">
                          灯
                          <div class="absolute inset-0 rounded-full bg-amber-200/60 blur-md"></div>
                        </div>
                        <div class="h-0.5 w-10 bg-cyan-500"></div>
                        <div class="relative h-10 w-14">
                          <div class="absolute left-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-slate-400"></div>
                          <div class="absolute right-0 top-1/2 h-0.5 w-6 -translate-y-1/2 bg-slate-400"></div>
                          <div class="absolute left-1/2 top-[40%] h-0.5 w-6 origin-left rotate-[-28deg] bg-slate-700"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm">
                      <CircuitBoard class="h-5 w-5" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-cyan-700">第 1 层</span>
                  </div>
                  <h3 class="mt-3 text-base font-semibold text-slate-950">信号与电路层</h3>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    用电池、开关、导线、电表和元器件直接看见通断、方向、测量和故障。
                  </p>
                </div>
                <span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-700">
                  进入工作台
                  <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </RouterLink>

              <RouterLink
                to="/logic-lab"
                class="group flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <div>
                  <div class="h-24 overflow-hidden rounded-md bg-white/85 px-3 py-3">
                    <div class="flex h-full items-center justify-between gap-3">
                      <div class="flex flex-col gap-2">
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">1</div>
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">0</div>
                      </div>
                      <div class="flex min-w-0 flex-1 items-center gap-2">
                        <div class="h-0.5 flex-1 bg-slate-300"></div>
                        <div class="inline-flex h-11 w-14 items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 font-mono text-sm font-semibold text-cyan-800">
                          AND
                        </div>
                        <div class="h-0.5 flex-1 bg-slate-300"></div>
                      </div>
                      <div class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 font-mono text-sm font-semibold text-cyan-800">
                        0
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                      <Binary class="h-5 w-5" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">第 2 层</span>
                  </div>
                  <h3 class="mt-3 text-base font-semibold text-slate-950">逻辑与存储层</h3>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    用门电路、latch 和寄存器观察布尔逻辑如何保存状态。
                  </p>
                </div>
                <span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  查看逻辑层
                  <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </RouterLink>

              <RouterLink
                to="/computer-lab"
                class="group flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100"
              >
                <div>
                  <div class="h-24 overflow-hidden rounded-md bg-white/85 px-3 py-3">
                    <div class="grid h-full grid-cols-[56px_1fr_68px] items-center gap-3">
                      <div class="space-y-1.5">
                        <div class="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">A 03</div>
                        <div class="rounded bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">B 02</div>
                      </div>
                      <div class="flex items-center justify-center gap-2">
                        <div class="h-0.5 w-6 bg-slate-300"></div>
                        <div class="inline-flex h-10 w-12 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 font-mono text-xs font-semibold text-emerald-800">
                          ALU
                        </div>
                        <div class="h-0.5 w-6 bg-slate-300"></div>
                      </div>
                      <div class="grid grid-cols-4 gap-1">
                        <div
                          v-for="cell in 8"
                          :key="cell"
                          class="h-4 rounded-sm"
                          :class="cell === 2 || cell === 6 ? 'bg-cyan-300' : 'bg-slate-200'"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                      <Cpu class="h-5 w-5" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">第 3 层</span>
                  </div>
                  <h3 class="mt-3 text-base font-semibold text-slate-950">机器层</h3>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    8-bit 小计算机已进入主站预览，可查看汇编、寄存器、内存和执行日志。
                  </p>
                </div>
                <span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                  查看机器层
                  <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </RouterLink>

              <div class="flex min-w-0 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div class="h-24 overflow-hidden rounded-md bg-white/85 px-3 py-3">
                    <div class="flex h-full flex-col justify-between">
                      <div class="flex items-center justify-between gap-2">
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">3</div>
                        <div class="h-0.5 flex-1 bg-slate-300"></div>
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">1</div>
                        <div class="h-0.5 flex-1 bg-slate-300"></div>
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-slate-200 bg-slate-50 font-mono text-xs font-semibold text-slate-700">2</div>
                      </div>
                      <div class="flex items-center justify-center">
                        <div class="rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] font-semibold text-white">sort()</div>
                      </div>
                      <div class="flex items-center justify-between gap-2">
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-cyan-200 bg-cyan-50 font-mono text-xs font-semibold text-cyan-800">1</div>
                        <div class="h-0.5 flex-1 bg-cyan-300"></div>
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-cyan-200 bg-cyan-50 font-mono text-xs font-semibold text-cyan-800">2</div>
                        <div class="h-0.5 flex-1 bg-cyan-300"></div>
                        <div class="inline-flex h-7 w-9 items-center justify-center rounded border border-cyan-200 bg-cyan-50 font-mono text-xs font-semibold text-cyan-800">3</div>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                      <Sparkles class="h-5 w-5" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">第 4 层</span>
                  </div>
                  <h3 class="mt-3 text-base font-semibold text-slate-950">算法层</h3>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    排序、搜索、栈、队列、树和图算法，后续可以下钻到内存、寄存器和指令。
                  </p>
                </div>
                <span class="mt-4 text-xs font-medium text-slate-500">算法行为可视化</span>
              </div>
            </div>
          </section>
        </div>

        <aside class="flex w-full min-w-0 max-w-full flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">信号诊断练习</h2>
                <p class="text-xs text-slate-500">作为信号层的第二步，用来练“哪里断了”</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="rounded bg-cyan-50 px-2 py-1 text-[11px] font-medium text-cyan-700">第 2 步训练</span>
                <Wrench class="h-5 w-5 text-cyan-700" />
              </div>
            </div>

            <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-950">{{ firstRepairLevel?.title }}</div>
                  <div class="mt-1 text-xs text-slate-500">{{ hasCurrentRepair ? "你上次练到这里" : "建议在熟悉工作台后再做这个" }}</div>
                </div>
                <span class="inline-flex h-6 items-center rounded bg-white px-2 text-[11px] font-medium text-slate-600">
                  {{ repairTaskStatusLabel(firstRepairLevel?.id) }}
                </span>
              </div>

              <p class="mt-3 break-words text-xs leading-5 text-slate-600">
                {{ firstRepairLevel?.summary }}
              </p>

              <div class="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>完成 {{ completedCount }} / {{ missionCount }}</span>
                <span class="font-semibold text-cyan-700">{{ progressPercent }}%</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div class="h-full rounded-full bg-cyan-500 transition-all" :style="{ width: `${progressPercent}%` }" />
              </div>

              <div class="mt-4 grid gap-2">
                <RouterLink
                  :to="firstRepairRoute"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
                  @click="markRepairStarted(firstRepairLevel?.id)"
                >
                  <Wrench class="h-4 w-4" />
                  {{ hasCurrentRepair ? "继续信号诊断" : "进入训练模式" }}
                </RouterLink>
                <RouterLink
                  to="/workbench"
                  class="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  先去工作台熟悉一下
                  <ArrowRight class="h-4 w-4" />
                </RouterLink>
              </div>

              <div class="mt-5 border-t border-slate-200 pt-4">
                <div class="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">最近练习</div>
                <div class="mt-3 space-y-2">
                  <div
                    v-for="record in recentActivity"
                    :key="record.levelId"
                    class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <div class="min-w-0">
                      <div class="truncate font-medium text-slate-900">{{ record.level.title }}</div>
                      <div class="text-xs text-slate-500">{{ repairTaskStatusLabel(record.levelId) }}</div>
                    </div>
                    <div class="shrink-0 text-xs text-slate-500">{{ formatProgressDate(record.lastOpenedAt) }}</div>
                  </div>

                  <div
                    v-if="recentActivity.length === 0"
                    class="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-500"
                  >
                    还没有维修记录。
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">探索实验区</h2>
                <p class="text-xs text-slate-500">不抢主线的独立原型</p>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <div
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500"
              >
                这些是旁支实验，不会盖过主线。等你对平台有感觉之后，再来这里玩会更舒服。
              </div>
            </div>

            <div class="mt-3 grid gap-2">
              <RouterLink
                to="/tank-lab"
                class="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition-colors hover:bg-slate-100"
              >
                <span class="inline-flex min-w-0 items-center gap-2">
                  <Swords class="h-4 w-4 shrink-0 text-slate-600" />
                  <span class="truncate font-medium text-slate-900">战车试验场</span>
                </span>
                <ArrowRight class="h-4 w-4 shrink-0 text-cyan-700" />
              </RouterLink>

              <RouterLink
                to="/rubiks-cube"
                class="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm transition-colors hover:bg-slate-100"
              >
                <span class="inline-flex min-w-0 items-center gap-2">
                  <Sparkles class="h-4 w-4 shrink-0 text-slate-600" />
                  <span class="truncate font-medium text-slate-900">3D 魔方</span>
                </span>
                <ArrowRight class="h-4 w-4 shrink-0 text-cyan-700" />
              </RouterLink>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </main>
</template>
