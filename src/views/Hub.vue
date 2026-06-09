<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight, CircuitBoard, PackageCheck, Sparkles, Swords, Wrench } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/mingshi-mark.svg";
import { repairLevelPresets } from "@/lib/repair-lab";

const missionCount = computed(() => repairLevelPresets.length);
</script>

<template>
  <main class="min-h-screen bg-[linear-gradient(180deg,#f8fbfa_0%,#eef5f3_100%)] text-slate-900">
    <div class="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:px-6">
      <header class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <div class="flex items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="leading-tight">
            <div class="text-sm font-semibold tracking-tight">明石空间</div>
            <div class="text-xs text-slate-500">xshow repair lab</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            to="/workbench"
            class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50"
          >
            <CircuitBoard class="h-4 w-4" />
            工作台
          </RouterLink>
          <RouterLink
            to="/repair-lab"
            class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Wrench class="h-4 w-4" />
            开始修理
          </RouterLink>
        </div>
      </header>

      <section class="grid flex-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div class="flex min-w-0 flex-col gap-6">
          <div class="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
            <div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
              <div class="flex flex-col justify-between gap-5">
                <div class="space-y-4">
                  <p class="text-xs font-medium uppercase tracking-[0.26em] text-cyan-700">Mission Center</p>
                  <h1 class="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 lg:text-5xl">
                    把电路修好，再把关卡做出来
                  </h1>
                  <p class="max-w-2xl text-sm leading-7 text-slate-600 lg:text-base">
                    这里不是实验说明页，而是维修任务的入口。先从现成关卡开跑，再把模板整理成微信小游戏能持续生产的内容。
                  </p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                  <RouterLink
                    to="/repair-lab"
                    class="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <PackageCheck class="h-4 w-4" />
                    进入任务
                  </RouterLink>
                  <RouterLink
                    to="/workbench"
                    class="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <CircuitBoard class="h-4 w-4" />
                    打开工作台
                  </RouterLink>
                  <RouterLink to="/tank-lab" class="inline-flex h-9 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
                    <Swords class="h-4 w-4" />
                    战车实验场
                  </RouterLink>
                </div>
              </div>

              <div class="relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#f7faf7] p-4">
                <div class="canvas-grid relative flex h-full min-h-[320px] items-center justify-center overflow-hidden rounded-[20px] border border-slate-200 bg-white/70">
                  <div class="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(180deg,rgba(15,23,42,0.06)_0%,rgba(15,23,42,0)_100%)]" />
                  <div class="flex flex-col items-center gap-4 text-center">
                    <img class="h-24 w-24 object-contain" :src="logoUrl" alt="明石空间 logo large" />
                    <div>
                      <div class="text-lg font-semibold text-slate-950">明石空间</div>
                      <div class="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">xshow circuits</div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
                        <div class="text-xs text-slate-500">当前任务</div>
                        <div class="mt-1 text-lg font-semibold">{{ missionCount }}</div>
                      </div>
                      <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm">
                        <div class="text-xs text-slate-500">主入口</div>
                        <div class="mt-1 text-lg font-semibold">修理大厅</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-800">
                <Wrench class="h-5 w-5" />
              </div>
              <h2 class="mt-4 text-base font-semibold">修理任务</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">从故障态到修复路径，再到可复制模板，形成可持续投放的关卡生产线。</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <CircuitBoard class="h-5 w-5" />
              </div>
              <h2 class="mt-4 text-base font-semibold">工作台</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">保留电子积木沙盒，作为更复杂关卡和玩法验证的底层实验场。</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <Sparkles class="h-5 w-5" />
              </div>
              <h2 class="mt-4 text-base font-semibold">模板生产</h2>
              <p class="mt-2 text-sm leading-6 text-slate-600">把关卡定义成模板字段，后续就能批量产出适合小游戏分发的内容。</p>
            </div>
          </div>
        </div>

        <aside class="flex min-w-0 flex-col gap-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">当前可用任务</h2>
                <p class="text-xs text-slate-500">直接从大厅进入。</p>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <RouterLink
                v-for="preset in repairLevelPresets"
                :key="preset.id"
                to="/repair-lab"
                class="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 transition-colors hover:bg-slate-100"
              >
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-950">{{ preset.title }}</div>
                  <div class="mt-1 text-xs leading-5 text-slate-500">{{ preset.failure }}</div>
                </div>
                <ArrowRight class="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              </RouterLink>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="text-sm font-semibold">下一步</h2>
            <ol class="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>1. 进修理大厅，先跑通一个关卡。</li>
              <li>2. 把修复路径整理成模板字段。</li>
              <li>3. 用同一套模板继续生关卡。</li>
            </ol>
          </div>
        </aside>
      </section>
    </div>
  </main>
</template>
