<script setup lang="ts">
import { ArrowLeft, ArrowRight, Binary, Download, FileText, FlaskConical, GitFork, HelpCircle, Home, PackageCheck, RotateCcw, Save, Unplug, X, ZoomIn, ZoomOut } from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/logo.png";
import Button from "@/components/ui/Button.vue";
import type { CircuitSimulation } from "@/lib/circuit";

defineProps<{
  clearWires: () => void;
  exportWorkbenchImage: () => void;
  githubRepositoryUrl: string;
  openGuideAssistant: () => void;
  openReportPanel: () => void;
  resetDemo: () => void;
  savedWorkspaceLabel: string;
  setZoom: (value: number) => void;
  simulation: CircuitSimulation;
  workbenchMode: "free" | "workshop";
  zoom: number;
}>();
</script>

<template>
  <header class="hidden h-14 items-center justify-between gap-2 border-b bg-card px-3 xl:flex">
    <div class="flex items-center gap-3">
      <img class="h-8 w-8 object-contain" :src="logoUrl" alt="明石空间 logo" />
      <div class="leading-tight">
        <div class="text-sm font-semibold">明石空间</div>
        <div class="text-xs text-muted-foreground">{{ workbenchMode === 'workshop' ? '第 2 单元 · 制作并发布器件' : '第 1 单元 · 观察信号与电路' }}</div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md border bg-muted/60 px-3 py-1.5 text-sm">
        <span
          class="h-2.5 w-2.5 rounded-full"
          :class="simulation.closed ? 'bg-emerald-500' : 'bg-rose-500'"
        />
        <span class="font-medium">{{ simulation.closed ? "回路闭合" : "回路断开" }}</span>
        <span class="text-muted-foreground">{{ simulation.currentMilliAmps }} mA</span>
      </div>
      <div class="hidden items-center gap-2 rounded-md border bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground 2xl:flex">
        <Save class="h-4 w-4" />
        <span>{{ savedWorkspaceLabel }}</span>
      </div>
      <div class="hidden items-center gap-1 rounded-md border bg-muted/60 p-1 md:flex">
        <Button variant="ghost" size="icon" title="缩小" @click="setZoom(zoom - 5)">
          <ZoomOut class="h-4 w-4" />
        </Button>
        <div class="min-w-14 text-center text-sm tabular-nums">{{ zoom }}%</div>
        <Button variant="ghost" size="icon" title="放大" @click="setZoom(zoom + 5)">
          <ZoomIn class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <RouterLink
        to="/workbench/free"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
        :class="workbenchMode === 'free' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-border bg-card hover:bg-muted'"
      >
        <FlaskConical class="h-4 w-4" />
        自由实验
      </RouterLink>
      <RouterLink
        to="/workbench/workshop"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors"
        :class="workbenchMode === 'workshop' ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-border bg-card hover:bg-muted'"
      >
        <PackageCheck class="h-4 w-4" />
        器件工坊
      </RouterLink>
      <RouterLink
        to="/"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Home class="h-4 w-4" />
        学习路径
      </RouterLink>
      <RouterLink
        v-if="workbenchMode === 'workshop'"
        to="/logic-lab"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 text-sm font-medium text-cyan-900 transition-colors hover:bg-cyan-100"
      >
        <ArrowRight class="h-4 w-4" />
        下一步：逻辑层
      </RouterLink>
      <Button variant="outline" size="sm" @click="openGuideAssistant()">
        <HelpCircle class="h-4 w-4" />
        新手
      </Button>
      <a
        :href="githubRepositoryUrl"
        target="_blank"
        rel="noreferrer"
        class="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted"
        title="GitHub 仓库"
        aria-label="打开 GitHub 仓库"
      >
        <GitFork class="h-4 w-4" />
        <span class="hidden sm:inline">GitHub</span>
      </a>
      <Button variant="outline" size="sm" title="清除所有导线" @click="clearWires">
        <span class="relative h-4 w-4">
          <Unplug class="h-4 w-4" />
          <X class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 stroke-[3] text-rose-600" />
        </span>
        <span class="hidden 2xl:inline">清线</span>
      </Button>
      <Button variant="outline" size="sm" title="导出工作台图片" @click="exportWorkbenchImage">
        <Download class="h-4 w-4" />
        <span class="hidden 2xl:inline">导出</span>
      </Button>
      <Button variant="outline" size="sm" title="打开实验报告" @click="openReportPanel">
        <FileText class="h-4 w-4" />
        <span class="hidden 2xl:inline">报告</span>
      </Button>
      <Button size="sm" title="复位当前演示" @click="resetDemo">
        <RotateCcw class="h-4 w-4" />
        <span class="hidden 2xl:inline">复位</span>
      </Button>
    </div>
  </header>
</template>
