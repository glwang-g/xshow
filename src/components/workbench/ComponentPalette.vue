<script setup lang="ts">
import { X } from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import type { PartType } from "@/lib/circuit";
import { getSpec, palette, partIcon } from "@/lib/workbench-ui";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  "add-part": [type: PartType];
}>();
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,320px)] min-h-0 flex-col border-r bg-card shadow-panel transition-transform duration-200 xl:static xl:z-auto xl:w-auto xl:translate-x-0 xl:shadow-none"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex items-center justify-between border-b px-3 py-2 xl:px-3">
      <div>
        <div class="text-sm font-semibold">元器件</div>
        <div class="text-xs text-muted-foreground">点击添加，拖端子连线</div>
      </div>
      <Button class="xl:hidden" variant="ghost" size="icon" title="关闭器件面板" @click="emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-2.5">
      <section class="space-y-2">
        <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-2">
          <button
            v-for="item in palette"
            :key="item.type"
            class="flex min-h-16 w-full flex-col items-center justify-center gap-1.5 rounded-md border bg-background px-1.5 py-2 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-50"
            @click="emit('add-part', item.type)"
          >
            <span class="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-foreground">
              <component :is="partIcon(item.type)" class="h-4 w-4" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-xs font-medium">{{ getSpec(item.type).label }}</span>
              <span class="hidden max-w-full truncate text-[11px] text-muted-foreground xl:block">{{ item.description }}</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  </aside>
</template>
