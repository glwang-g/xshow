<script setup lang="ts">
import { MoreHorizontal, X } from "@lucide/vue";
import { ref } from "vue";
import { RouterLink } from "vue-router";
import Button from "@/components/ui/Button.vue";
import type { PartType } from "@/lib/circuit";
import type { PublishedRelayModule } from "@/lib/published-modules";
import { getSpec, palette, partIcon } from "@/lib/workbench-ui";

defineProps<{
  open: boolean;
  publishedModules: PublishedRelayModule[];
}>();

const emit = defineEmits<{
  close: [];
  "add-part": [type: PartType];
  "add-module": [module: PublishedRelayModule];
}>();

const openModuleMenuId = ref("");
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

      <section v-if="publishedModules.length" class="mt-4 border-t pt-4">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold">我的逻辑模块</div>
            <div class="text-[11px] text-muted-foreground">像元器件一样导入工作台</div>
          </div>
          <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">{{ publishedModules.length }}</span>
        </div>
        <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 xl:grid-cols-2">
          <div
            v-for="module in publishedModules"
            :key="module.id"
            class="relative min-h-16 rounded-md border border-cyan-200 bg-cyan-50/50"
            draggable="true"
            @dragstart="(event) => event.dataTransfer?.setData('application/x-xshow-module', module.id)"
          >
            <button
              class="flex h-full w-full cursor-grab flex-col items-center justify-center gap-1.5 px-1.5 py-2 text-center active:cursor-grabbing"
              @click="emit('add-module', module)"
            >
              <span class="flex h-7 w-7 items-center justify-center rounded-md bg-white text-cyan-700">
                <component :is="partIcon('module')" class="h-4 w-4" />
              </span>
              <span class="block max-w-full truncate text-xs font-medium text-slate-800">{{ module.name }}</span>
              <span class="hidden max-w-full truncate text-[11px] text-slate-500 xl:block">{{ module.behavior.contactMode === 'normally-closed' ? 'NC 触点' : 'NO 触点' }}</span>
            </button>
            <button
              class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-white hover:text-slate-700"
              title="模块菜单"
              @click.stop="openModuleMenuId = openModuleMenuId === module.id ? '' : module.id"
              @dragstart.stop
            >
              <MoreHorizontal class="h-3.5 w-3.5" />
            </button>
            <div v-if="openModuleMenuId === module.id" class="absolute right-1 top-6 z-20 w-28 rounded-md border bg-white p-1 shadow-panel">
              <RouterLink
                :to="{ path: '/workbench/workshop', query: { module: module.id, view: 'verification' } }"
                class="block rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-amber-50"
              >
                验证电路
              </RouterLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
