<script setup lang="ts">
/**
 * 16x16 memory table. Each cell is one byte in hex; the byte at PC is
 * highlighted so students can watch the program counter walk through
 * memory as they step.
 */

import { computed } from "vue";
import { useCpu } from "@/composables/useCpu";

const { state } = useCpu();

/** 16 rows of 16 bytes each — matches classic monitor/debugger layouts. */
const rows = computed(() => {
  const mem = state.value?.memory ?? new Array(256).fill(0);
  const out: { base: number; cells: { addr: number; byte: number }[] }[] = [];
  for (let base = 0; base < 256; base += 16) {
    out.push({
      base,
      cells: Array.from({ length: 16 }, (_, i) => ({ addr: base + i, byte: mem[base + i] })),
    });
  }
  return out;
});

const pc = computed(() => state.value?.pc ?? -1);

function hex(byte: number, pad = 2): string {
  return byte.toString(16).padStart(pad, "0").toUpperCase();
}
</script>

<template>
  <section class="flex flex-col bg-panel border border-border rounded-lg overflow-hidden">
    <header class="px-4 py-2 bg-panelAlt border-b border-border flex items-center justify-between">
      <h2 class="text-sm font-semibold uppercase tracking-wider text-slate-300">
        Memory (256 B)
      </h2>
      <span class="text-xs text-slate-500 tabular-nums">
        PC = 0x{{ hex(Math.max(0, pc)) }}
      </span>
    </header>

    <div class="overflow-auto flex-1 min-h-0">
      <table class="text-xs tabular-nums border-separate border-spacing-0 w-full">
        <thead class="sticky top-0 bg-panelAlt">
          <tr>
            <th class="px-2 py-1 text-slate-500 font-normal text-left w-14">addr</th>
            <th
              v-for="col in 16"
              :key="col"
              class="px-1.5 py-1 text-slate-500 font-normal text-center"
            >
              {{ hex(col - 1, 1) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.base">
            <td class="px-2 py-0.5 text-slate-500 border-t border-border/60">
              0x{{ hex(row.base) }}
            </td>
            <td
              v-for="cell in row.cells"
              :key="cell.addr"
              class="px-1.5 py-0.5 text-center border-t border-border/60 transition-colors"
              :class="[
                cell.addr === pc
                  ? 'bg-accent text-slate-950 font-bold'
                  : cell.byte === 0
                    ? 'text-slate-600'
                    : 'text-slate-100',
              ]"
              :title="`addr 0x${hex(cell.addr)} = ${cell.byte}`"
            >
              {{ hex(cell.byte) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
