<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight, CircuitBoard, Sparkles, Swords, Wrench } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import { useRepairProgress } from "@/composables/useRepairProgress";
import { repairLevelPresets } from "@/lib/repair-lab";

const {
  completedCount,
  currentLevel,
  currentLevelId,
  hasCurrentRepair,
  markRepairStarted,
  missionCount,
  progressPercent,
  recentActivity,
  repairTaskStatus,
  repairTaskStatusLabel,
} = useRepairProgress();

const currentActionLabel = computed(() => (hasCurrentRepair.value ? "继续维修" : "开始维修"));

function taskActionLabel(levelId: string) {
  const status = repairTaskStatus(levelId);

  if (status === "completed") {
    return "复查";
  }

  return levelId === currentLevelId.value ? "继续" : "开始";
}

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

      <section class="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div class="flex min-w-0 flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-medium text-cyan-700">主线学习路径</p>
                <h1 class="mt-2 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
                  从信号、电路、机器到算法
                </h1>
                <p class="mt-3 max-w-3xl break-words text-sm leading-6 text-slate-600">
                  先看见信号如何流动，再理解电路如何表达逻辑，继续走到存储、CPU、程序执行和算法行为。
                </p>
              </div>
              <img class="h-12 w-12 shrink-0 object-contain" :src="logoUrl" alt="明石空间 logo large" />
            </div>

            <div class="mt-5 grid gap-3 lg:grid-cols-3">
              <RouterLink
                to="/workbench"
                class="group flex min-w-0 flex-col justify-between rounded-lg border border-cyan-200 bg-cyan-50/70 p-4 transition-colors hover:bg-cyan-50"
              >
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-cyan-700">
                      <CircuitBoard class="h-4 w-4" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-cyan-700">已可用</span>
                  </div>
                  <h2 class="mt-3 text-sm font-semibold text-slate-950">信号与电路层</h2>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    用电池、开关、导线、电表和元器件观察通断、方向、测量和故障。
                  </p>
                </div>
                <span class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-700">
                  进入工作台
                  <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </RouterLink>

              <div class="flex min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-700">
                      <CircuitBoard class="h-4 w-4" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">设计中</span>
                  </div>
                  <h2 class="mt-3 text-sm font-semibold text-slate-950">机器层</h2>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    8-bit 小计算机原型已经起步，下一步会进入主线学习路径。
                  </p>
                </div>
                <span class="mt-4 text-xs font-medium text-slate-500">机器核心融合中</span>
              </div>

              <div class="flex min-w-0 flex-col justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-700">
                      <Sparkles class="h-4 w-4" />
                    </span>
                    <span class="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-600">规划中</span>
                  </div>
                  <h2 class="mt-3 text-sm font-semibold text-slate-950">算法层</h2>
                  <p class="mt-2 text-xs leading-5 text-slate-600">
                    排序、搜索、栈、队列、树和图算法，后续可以下钻到内存、寄存器和指令。
                  </p>
                </div>
                <span class="mt-4 text-xs font-medium text-slate-500">算法行为可视化</span>
              </div>
            </div>
          </section>

          <section
            class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:p-7"
          >
            <div class="flex min-w-0 items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-medium text-cyan-700">{{ hasCurrentRepair ? "继续信号诊断" : "推荐信号诊断" }}</p>
                <h2 class="mt-3 text-2xl font-semibold tracking-tight text-slate-950 lg:text-3xl">
                  {{ currentLevel?.title }}
                </h2>
              </div>
              <Wrench class="h-8 w-8 shrink-0 text-cyan-700" />
            </div>

            <div class="mt-6 min-w-0 border-t border-slate-200 pt-5">
              <div class="flex flex-wrap gap-2">
                <span class="inline-flex h-7 items-center rounded-md bg-slate-100 px-2.5 text-xs font-medium text-slate-600">
                  {{ repairTaskStatusLabel(currentLevel?.id) }}
                </span>
                <span
                  v-for="tag in currentLevel?.tags"
                  :key="tag"
                  class="inline-flex h-7 items-center rounded-md bg-cyan-50 px-2.5 text-xs font-medium text-cyan-800"
                >
                  {{ tag }}
                </span>
              </div>

              <p class="mt-4 max-w-2xl break-words text-sm leading-6 text-slate-600">
                {{ currentLevel?.summary }}
              </p>

              <RouterLink
                :to="{ path: '/repair-lab', query: { level: currentLevel?.id } }"
                class="mt-6 inline-flex h-11 w-full max-w-full min-w-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-medium text-white hover:bg-slate-800 sm:w-auto"
                @click="markRepairStarted(currentLevel?.id)"
              >
                <Wrench class="h-4 w-4" />
                {{ currentActionLabel }}
              </RouterLink>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold">信号诊断进度</h2>
                <p class="text-xs text-slate-500">完成 {{ completedCount }} / {{ missionCount }}</p>
              </div>
              <div class="text-sm font-semibold text-cyan-700">{{ progressPercent }}%</div>
            </div>

            <div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full bg-cyan-500 transition-all" :style="{ width: `${progressPercent}%` }" />
            </div>

            <div class="mt-4 space-y-2">
              <div
                v-for="record in recentActivity"
                :key="record.levelId"
                class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <div class="min-w-0">
                  <div class="truncate font-medium text-slate-900">{{ record.level.title }}</div>
                  <div class="text-xs text-slate-500">{{ repairTaskStatusLabel(record.levelId) }}</div>
                </div>
                <div class="shrink-0 text-xs text-slate-500">{{ formatProgressDate(record.lastOpenedAt) }}</div>
              </div>

              <div v-if="recentActivity.length === 0" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                还没有维修记录。
              </div>
            </div>
          </section>
        </div>

        <aside class="flex w-full min-w-0 max-w-full flex-col gap-4">
          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">选择信号诊断任务</h2>
                <p class="text-xs text-slate-500">共 {{ missionCount }} 个</p>
              </div>
            </div>

            <div class="mt-4 space-y-3">
              <RouterLink
                v-for="preset in repairLevelPresets"
                :key="preset.id"
                :to="{ path: '/repair-lab', query: { level: preset.id } }"
                class="flex items-start justify-between gap-3 rounded-lg border px-3 py-3 transition-colors"
                :class="
                  preset.id === currentLevelId
                    ? 'border-cyan-200 bg-cyan-50/70 hover:bg-cyan-50'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                "
                @click="markRepairStarted(preset.id)"
              >
                <div class="min-w-0">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <div class="text-sm font-semibold text-slate-950">{{ preset.title }}</div>
                    <span
                      v-if="preset.id === currentLevelId"
                      class="inline-flex h-5 items-center rounded bg-white px-1.5 text-[11px] font-medium text-cyan-700"
                    >
                      当前
                    </span>
                    <span
                      v-else-if="repairTaskStatus(preset.id) !== 'not-started'"
                      class="inline-flex h-5 items-center rounded bg-white px-1.5 text-[11px] font-medium text-slate-600"
                    >
                      {{ repairTaskStatusLabel(preset.id) }}
                    </span>
                  </div>
                  <div class="mt-1 break-words text-xs leading-5 text-slate-500">{{ preset.failure }}</div>
                </div>
                <span class="mt-0.5 inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cyan-700">
                  {{ taskActionLabel(preset.id) }}
                  <ArrowRight class="h-4 w-4" />
                </span>
              </RouterLink>
            </div>
          </section>

          <section class="w-full min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">探索实验区</h2>
                <p class="text-xs text-slate-500">不抢主线的独立原型</p>
              </div>
            </div>

            <div class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
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
