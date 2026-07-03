<script setup lang="ts">
/**
 * Execution log. Auto-scrolls to the bottom on each new line so the most
 * recent instruction stays in view during Run.
 */

import { computed, nextTick, ref, watch } from "vue";
import { useCpu } from "@/composables/useCpu";

const { state } = useCpu();

const scroller = ref<HTMLDivElement | null>(null);
const lines = computed(() => state.value?.log ?? []);

watch(
  () => lines.value.length,
  async () => {
    await nextTick();
    const el = scroller.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);
</script>

<template>
  <section class="flex flex-col bg-panel border border-border rounded-lg overflow-hidden">
    <header class="px-4 py-2 bg-panelAlt border-b border-border flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Execution Log
      </h2>
      <span class="text-xs text-slate-500 tabular-nums">{{ lines.length }} lines</span>
    </header>
    <div
      ref="scroller"
      class="flex-1 min-h-0 overflow-auto px-4 py-2 text-xs leading-relaxed"
    >
      <div v-if="lines.length === 0" class="text-slate-500 italic">
        Load a program and press Step or Run.
      </div>
      <div
        v-for="(line, idx) in lines"
        :key="idx"
        class="text-slate-300 tabular-nums whitespace-pre"
      >{{ line }}</div>
    </div>
  </section>
</template>
