<script setup lang="ts">
/**
 * Register panel: A / B / PC / FLAGS shown in hex, decimal, and binary. The
 * "current instruction" line disassembles whatever byte PC points at so
 * students see what will run *next*.
 */

import { computed } from "vue";
import { useCpu } from "@/composables/useCpu";

const { state } = useCpu();

/** Return e.g. "0x2A · 42 · 0010_1010" for a byte. */
function fmt(byte: number | undefined): string {
  if (byte === undefined) return "—";
  const hex = byte.toString(16).padStart(2, "0").toUpperCase();
  const bin = byte.toString(2).padStart(8, "0");
  return `0x${hex} · ${byte} · ${bin.slice(0, 4)}_${bin.slice(4)}`;
}

const rows = computed(() => [
  { name: "A",     value: state.value?.a  },
  { name: "B",     value: state.value?.b  },
  { name: "PC",    value: state.value?.pc },
  { name: "FLAGS", value: state.value?.flags_byte },
]);

const flagChips = computed(() => {
  const f = state.value?.flags;
  return [
    { name: "Z", set: !!f?.z },
    { name: "N", set: !!f?.n },
    { name: "C", set: !!f?.c },
  ];
});
</script>

<template>
  <section class="flex flex-col bg-panel border border-border rounded-lg overflow-hidden">
    <header class="px-4 py-2 bg-panelAlt border-b border-border">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Registers
      </h2>
    </header>

    <table class="w-full text-sm">
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.name"
          class="border-b border-border/60 last:border-b-0"
        >
          <td class="px-4 py-2 text-slate-400 font-semibold w-16">{{ row.name }}</td>
          <td class="px-4 py-2 tabular-nums text-slate-100">{{ fmt(row.value) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="px-4 py-3 border-t border-border flex items-center gap-2">
      <span class="text-xs text-slate-400 mr-1">Flags:</span>
      <span
        v-for="chip in flagChips"
        :key="chip.name"
        class="inline-flex items-center justify-center w-7 h-6 rounded text-xs font-bold border"
        :class="chip.set
          ? 'bg-accent/20 border-accent text-accent'
          : 'bg-slate-800 border-border text-slate-500'"
      >
        {{ chip.name }}
      </span>
    </div>

    <div class="px-4 py-3 border-t border-border">
      <div class="text-xs text-slate-400 mb-1">Next instruction @ PC</div>
      <div class="text-sm text-accent font-semibold tabular-nums">
        {{ state?.current_instruction || "—" }}
      </div>
    </div>
  </section>
</template>
