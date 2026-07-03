<script setup lang="ts">
/**
 * Top-level layout: assembly editor + registers on the left, controls above
 * memory + log on the right. Kicks off a state fetch on mount so panels
 * render an initial (empty) snapshot instead of "—" placeholders.
 */

import { onMounted } from "vue";
import AssemblyEditor from "@/components/AssemblyEditor.vue";
import Controls from "@/components/Controls.vue";
import Log from "@/components/Log.vue";
import Memory from "@/components/Memory.vue";
import Registers from "@/components/Registers.vue";
import { useCpu } from "@/composables/useCpu";

const { refresh } = useCpu();

onMounted(() => {
  // Fire-and-forget — errors surface via the composable's `error` ref, which
  // the editor already renders.
  void refresh();
});
</script>

<template>
  <div class="h-full grid grid-cols-1 lg:grid-cols-[minmax(360px,1fr)_2fr] gap-3 p-3">
    <!-- Left column: editor stacked over registers. -->
    <div class="grid grid-rows-[3fr_2fr] gap-3 min-h-0">
      <AssemblyEditor class="min-h-0" />
      <Registers class="min-h-0" />
    </div>

    <!-- Right column: controls, memory, log. -->
    <div class="grid grid-rows-[auto_3fr_2fr] gap-3 min-h-0">
      <Controls />
      <Memory class="min-h-0" />
      <Log class="min-h-0" />
    </div>
  </div>
</template>
