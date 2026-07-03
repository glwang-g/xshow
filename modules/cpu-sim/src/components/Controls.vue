<script setup lang="ts">
/**
 * Step / Run / Pause / Reset controls. All disabled logic is driven by the
 * composable's own state — never local booleans — so buttons re-enable
 * correctly after halt/reset.
 */

import { computed } from "vue";
import { useCpu } from "@/composables/useCpu";

const { state, step, run, pause, reset, running } = useCpu();

const halted = computed(() => state.value?.halted ?? true);
const noProgram = computed(() => !state.value);

const canStep = computed(() => !noProgram.value && !halted.value && !running.value);
const canRun = computed(() => !noProgram.value && !halted.value && !running.value);
const canPause = computed(() => running.value);
</script>

<template>
  <div class="flex items-center gap-2 px-4 py-3 bg-panel border border-border rounded-lg">
    <button
      class="px-3 py-1.5 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-40 disabled:hover:bg-slate-700 transition-colors"
      :disabled="!canStep"
      @click="step()"
    >
      Step
    </button>
    <button
      class="px-3 py-1.5 text-xs rounded-md bg-good hover:brightness-110 text-slate-950 font-semibold disabled:opacity-40 transition-all"
      :disabled="!canRun"
      @click="run(60)"
    >
      Run ▶
    </button>
    <button
      class="px-3 py-1.5 text-xs rounded-md bg-accent hover:brightness-110 text-slate-950 font-semibold disabled:opacity-40 transition-all"
      :disabled="!canPause"
      @click="pause()"
    >
      Pause
    </button>
    <button
      class="px-3 py-1.5 text-xs rounded-md bg-bad hover:brightness-110 text-slate-50 font-semibold transition-all"
      @click="reset()"
    >
      Reset
    </button>

    <div class="flex-1" />

    <div class="text-xs text-slate-400 tabular-nums">
      <span v-if="halted && !noProgram" class="text-bad">● HALTED</span>
      <span v-else-if="running" class="text-good">● RUNNING</span>
      <span v-else-if="!noProgram" class="text-accent">● READY</span>
      <span v-else class="text-slate-500">● no program</span>
    </div>
  </div>
</template>
