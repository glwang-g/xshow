<script setup lang="ts">
import { Download, GitFork, RotateCcw, Save, Sparkles, Unplug, X, ZoomIn, ZoomOut } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import type { CircuitSimulation } from "@/lib/circuit";

defineProps<{
  clearWires: () => void;
  exportWorkbenchImage: () => void;
  githubRepositoryUrl: string;
  resetDemo: () => void;
  savedWorkspaceLabel: string;
  setZoom: (value: number) => void;
  simulation: CircuitSimulation;
  zoom: number;
}>();
</script>

<template>
  <header class="hidden h-14 items-center justify-between gap-2 border-b bg-card px-3 xl:flex">
    <div class="flex items-center gap-3">
      <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sparkles class="h-4 w-4" />
      </div>
      <div class="leading-tight">
        <div class="text-sm font-semibold">xshow circuits</div>
        <div class="text-xs text-muted-foreground">电子积木实验台</div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 rounded-md border bg-muted/60 px-3 py-1.5 text-sm">
        <span
          class="h-2.5 w-2.5 rounded-full"
          :class="simulation.closed ? 'bg-emerald-500' : 'bg-rose-500'"
        />
        <span class="font-medium">{{ simulation.closed ? "回路闭合" : "回路断开" }}</span>
        <span class="text-muted-foreground">{{ simulation.currentMilliAmps }} mA</span>
      </div>
      <div class="hidden items-center gap-2 rounded-md border bg-muted/60 px-3 py-1.5 text-sm text-muted-foreground md:flex">
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
      <Button variant="outline" size="sm" @click="clearWires">
        <span class="relative h-4 w-4">
          <Unplug class="h-4 w-4" />
          <X class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 stroke-[3] text-rose-600" />
        </span>
        清线
      </Button>
      <Button variant="outline" size="sm" @click="exportWorkbenchImage">
        <Download class="h-4 w-4" />
        导出
      </Button>
      <Button size="sm" @click="resetDemo">
        <RotateCcw class="h-4 w-4" />
        复位
      </Button>
    </div>
  </header>
</template>
