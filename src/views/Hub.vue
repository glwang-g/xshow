<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight, CircuitBoard, PackageCheck, Swords, Wrench } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import { repairLevelPresets } from "@/lib/repair-lab";

const featuredMission = computed(() => repairLevelPresets[0]);
const missionCount = computed(() => repairLevelPresets.length);
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen w-full max-w-[1500px] min-w-0 flex-col gap-5 px-4 py-4 lg:px-6">
      <header class="flex min-w-0 flex-col gap-3 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="min-w-0 leading-tight">
            <div class="text-sm font-semibold tracking-tight">明石空间</div>
            <div class="text-xs text-slate-500">维修任务大厅</div>
          </div>
        </div>

        <div class="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <RouterLink
            to="/workbench"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <CircuitBoard class="h-4 w-4" />
            <span class="truncate">工作台</span>
          </RouterLink>
          <RouterLink
            to="/tank-lab"
            class="inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Swords class="h-4 w-4" />
            <span class="truncate">战车试验场</span>
          </RouterLink>
        </div>
      </header>

      <section class="grid min-w-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="flex w-full min-w-0 max-w-full flex-col gap-5">
          <div class="grid w-full min-w-0 max-w-full gap-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[minmax(0,1fr)_280px] lg:p-7">
            <div class="flex min-w-0 flex-col justify-between gap-6">
              <div class="space-y-4">
                <p class="text-xs font-medium uppercase tracking-[0.24em] text-cyan-700">Mission Center</p>
                <h1 class="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
                  先修一个任务
                </h1>
                <p class="max-w-2xl whitespace-normal break-all text-sm leading-7 text-slate-600 lg:break-words lg:text-base">
                  大厅只负责指路：左侧继续当前维修，右侧选择具体任务。工作台和战车试验场放在顶部，作为全局工具入口。
                </p>
              </div>

              <div class="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <RouterLink
                  :to="{ path: '/repair-lab', query: { level: featuredMission?.id } }"
                  class="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
                >
                  <Wrench class="h-4 w-4" />
                  继续修理
                </RouterLink>
                <div class="text-sm leading-6 text-slate-500">
                  推荐从「{{ featuredMission?.title }}」开始。
                </div>
              </div>
            </div>

            <div class="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center gap-3">
                <img class="h-14 w-14 object-contain" :src="logoUrl" alt="明石空间 logo large" />
                <div>
                  <div class="text-sm font-semibold text-slate-950">当前大厅</div>
                  <div class="text-xs text-slate-500">维修任务优先</div>
                </div>
              </div>
              <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                <div class="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div class="text-xs text-slate-500">可用任务</div>
                  <div class="mt-1 text-xl font-semibold text-slate-950">{{ missionCount }}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <div class="text-xs text-slate-500">主路径</div>
                  <div class="mt-1 text-xl font-semibold text-slate-950">维修</div>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div class="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-800">1</span>
                选一个故障任务
              </div>
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-800">2</span>
                在修理台里调通
              </div>
              <div class="flex items-center gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-semibold text-cyan-800">3</span>
                产出可复用模板
              </div>
            </div>
          </div>
        </div>

        <aside class="flex w-full min-w-0 max-w-full flex-col gap-4">
          <div class="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">当前可用任务</h2>
                <p class="text-xs text-slate-500">这里是具体任务入口。</p>
              </div>
              <PackageCheck class="h-4 w-4 text-cyan-700" />
            </div>

            <div class="mt-4 space-y-3">
              <RouterLink
                v-for="preset in repairLevelPresets"
                :key="preset.id"
                :to="{ path: '/repair-lab', query: { level: preset.id } }"
                class="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition-colors hover:bg-slate-100"
              >
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-950">{{ preset.title }}</div>
                  <div class="mt-1 text-xs leading-5 text-slate-500">{{ preset.failure }}</div>
                </div>
                <span class="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cyan-700">
                  开始
                  <ArrowRight class="h-4 w-4" />
                </span>
              </RouterLink>
            </div>
          </div>

          <div class="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4 text-sm leading-6 text-cyan-950">
            <div class="font-semibold">提示</div>
            <p class="mt-1 text-cyan-900/80">
              不确定从哪开始时，点左侧「继续修理」或右侧第一个任务即可。
            </p>
          </div>
        </aside>
      </section>
    </div>
  </main>
</template>
