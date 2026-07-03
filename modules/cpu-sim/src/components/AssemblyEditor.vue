<script setup lang="ts">
/**
 * Assembly source editor + Load button. Holds its own draft text so we don't
 * fight the parent over cursor position on every state change.
 */

import { ref } from "vue";
import { useCpu } from "@/composables/useCpu";

const { load, error } = useCpu();

const SAMPLE = `; Sum 1 + 2 + 3 into A, then loop again from the top.
; Registers on this teaching CPU are 8-bit; overflow wraps.

        MOV  A, #0        ; A is the accumulator
        MOV  B, #1        ; B holds the addend
        ADD  A, B         ; A = 1
        MOV  B, #2
        ADD  A, B         ; A = 3
        MOV  B, #3
        ADD  A, B         ; A = 6
        STORE A, 0x40     ; save the running total
        HALT
`;

const source = ref<string>(SAMPLE);

async function handleLoad() {
  await load(source.value);
}

function loadSample() {
  source.value = SAMPLE;
}
</script>

<template>
  <section class="flex flex-col h-full bg-panel border border-border rounded-lg overflow-hidden">
    <header class="flex items-center justify-between px-4 py-2 bg-panelAlt border-b border-border">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Assembly
      </h2>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 text-xs rounded-md bg-slate-700 hover:bg-slate-600 text-slate-100 transition-colors"
          @click="loadSample"
        >
          Sample
        </button>
        <button
          class="px-3 py-1 text-xs rounded-md bg-accent hover:bg-accentDim text-slate-950 font-semibold transition-colors"
          @click="handleLoad"
        >
          Load ▶
        </button>
      </div>
    </header>
    <textarea
      v-model="source"
      spellcheck="false"
      class="flex-1 min-h-0 w-full resize-none bg-transparent p-4 text-sm leading-relaxed text-slate-100 focus:outline-none"
    />
    <footer
      v-if="error"
      class="px-4 py-2 text-xs bg-bad/20 border-t border-bad/40 text-red-200 font-medium"
    >
      {{ error }}
    </footer>
  </section>
</template>
