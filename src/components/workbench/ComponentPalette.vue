<script setup lang="ts">
import { MoreHorizontal, Pencil, X } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import Button from "@/components/ui/Button.vue";
import type { PartType } from "@/lib/circuit";
import type { PublishedRelayModule } from "@/lib/published-modules";
import { getSpec, palette, partIcon } from "@/lib/workbench-ui";

const emit = defineEmits<{
  close: [];
  "add-part": [type: PartType];
  "add-module": [module: PublishedRelayModule];
  "rename-module": [module: PublishedRelayModule];
}>();

const openModuleMenuId = ref("");
const preciseDesktopPointer = ref(false);
let desktopPointerQuery: MediaQueryList | null = null;

function updateInputMode() {
  preciseDesktopPointer.value = desktopPointerQuery?.matches ?? false;
}

function handlePartClick(event: MouseEvent, type: PartType) {
  // Keyboard activation remains available even on desktop drag workbenches.
  if (!preciseDesktopPointer.value || event.detail === 0) emit("add-part", type);
}

function handleModuleClick(event: MouseEvent, module: PublishedRelayModule) {
  if (!preciseDesktopPointer.value || event.detail === 0) emit("add-module", module);
}

onMounted(() => {
  desktopPointerQuery = window.matchMedia("(min-width: 1280px) and (pointer: fine)");
  updateInputMode();
  desktopPointerQuery.addEventListener("change", updateInputMode);
});

onBeforeUnmount(() => desktopPointerQuery?.removeEventListener("change", updateInputMode));

const props = defineProps<{
  columns: 0 | 1 | 2 | 3 | 4;
  open: boolean;
  publishedModules: PublishedRelayModule[];
}>();
// Cards keep a fixed 4rem width. auto-fill packs as many fixed columns as fit
// from the left, so while dragging the card size never changes; a column is only
// dropped when the current column count genuinely no longer fits, and any
// leftover space stays on the right instead of stretching cards.
const gridStyle = computed(() => ({ gridTemplateColumns: "repeat(auto-fill, 4rem)" }));
const isOverlay = computed(() => props.columns === 0);
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-[min(86vw,320px)] min-h-0 flex-col border-r bg-card shadow-panel transition-transform duration-200 xl:static xl:z-auto xl:w-auto xl:translate-x-0 xl:shadow-none"
    :class="isOverlay ? (open ? 'xl:!fixed xl:!translate-x-0' : 'xl:!fixed xl:!-translate-x-full') : (open ? 'translate-x-0' : '-translate-x-full')"
  >
    <div class="flex items-center justify-between border-b px-3 py-2 xl:px-3">
      <div>
        <div class="text-sm font-semibold">元器件</div>
        <div class="text-xs text-muted-foreground">{{ preciseDesktopPointer ? "拖到工作台放置" : "点击添加，工作台内可拖动" }}</div>
      </div>
      <div class="flex items-center gap-1">
        <Button :class="isOverlay ? '' : 'xl:hidden'" variant="ghost" size="icon" title="关闭器件面板" @click="emit('close')">
        <X class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto p-2.5">
      <section class="space-y-2">
        <div class="grid justify-start gap-1.5" :style="gridStyle">
          <button
            v-for="item in palette"
            :key="item.type"
            class="flex min-h-11 w-16 flex-col items-center justify-center gap-0.5 rounded-md border bg-background px-1 py-1.5 text-center transition-colors hover:border-cyan-300 hover:bg-cyan-50"
            :class="preciseDesktopPointer ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'"
            :draggable="preciseDesktopPointer"
            @dragstart="(event) => event.dataTransfer?.setData('application/x-xshow-part', item.type)"
            @click="handlePartClick($event, item.type)"
          >
            <span class="flex h-5 w-5 items-center justify-center rounded bg-muted text-foreground">
              <component :is="partIcon(item.type)" class="h-3 w-3" />
            </span>
            <span class="min-w-0">
              <span class="block truncate text-[11px] font-medium">{{ getSpec(item.type).label }}</span>
              <span class="hidden max-w-full truncate text-[11px] text-muted-foreground xl:block">{{ item.description }}</span>
            </span>
          </button>
        </div>
      </section>

      <section v-if="publishedModules.length" class="mt-4 border-t pt-4">
        <div class="mb-2 flex items-center justify-between">
          <div>
            <div class="text-sm font-semibold">我的逻辑模块</div>
            <div class="text-[11px] text-muted-foreground">{{ preciseDesktopPointer ? "拖到工作台放置" : "点击添加，工作台内可拖动" }}</div>
          </div>
          <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700">{{ publishedModules.length }}</span>
        </div>
        <div class="grid justify-start gap-1.5" :style="gridStyle">
          <div
            v-for="module in publishedModules"
            :key="module.id"
            class="relative min-h-11 rounded-md border border-cyan-200 bg-cyan-50/50"
            :draggable="preciseDesktopPointer"
            @dragstart="(event) => event.dataTransfer?.setData('application/x-xshow-module', module.id)"
          >
            <button
              class="flex h-full w-full cursor-grab flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-center active:cursor-grabbing"
              @click="handleModuleClick($event, module)"
            >
              <span class="relative flex h-5 w-8 items-center justify-center rounded border border-slate-400 bg-slate-50 text-[7px] font-bold text-slate-700">
                <span class="absolute -left-1 top-0.5 h-1 w-1 rounded-full border border-slate-600 bg-white" />
                <span class="absolute -left-1 bottom-0.5 h-1 w-1 rounded-full border border-slate-600 bg-white" />
                <span class="absolute -right-1 top-0.5 h-1 w-1 rounded-full border border-slate-600 bg-white" />
                <span class="absolute -right-1 bottom-0.5 h-1 w-1 rounded-full border border-slate-600 bg-white" />
                {{ module.behavior.contactMode === 'normally-closed' ? 'NC' : 'NO' }}
              </span>
              <span class="block max-w-full truncate text-[11px] font-medium text-slate-800">{{ module.name }}</span>
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
              <button
                class="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-cyan-50"
                @click.stop="emit('rename-module', module); openModuleMenuId = ''"
              >
                <Pencil class="h-3 w-3" />重命名
              </button>
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
