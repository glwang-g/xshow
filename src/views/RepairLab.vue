<script setup lang="ts">
import { computed, ref } from "vue";
import {
  ArrowLeft,
  Copy,
  PackageCheck,
  RotateCcw,
  X,
} from "@lucide/vue";
import { RouterLink } from "vue-router";
import logoUrl from "@/assets/mingshi-mark.svg";
import Button from "@/components/ui/Button.vue";
import { evaluateCircuit, type CircuitPart } from "@/lib/circuit";
import { getSpec } from "@/lib/workbench-ui";
import {
  cloneRepairLevel,
  evaluateRepairLevel,
  repairLevelPartSummary,
  repairLevelPresets,
  repairLevelToJson,
  repairLevelWirePath,
  type RepairLevel,
} from "@/lib/repair-lab";

const presetIndex = ref(0);
const level = ref<RepairLevel>(cloneRepairLevel(repairLevelPresets[presetIndex.value]));
const selectedPartId = ref(level.value.workspace.parts[0]?.id ?? "");
const copyState = ref<"idle" | "copied">("idle");
const mobileMode = ref<"stage" | "task" | "template">("stage");

const simulation = computed(() => evaluateCircuit(level.value.workspace.parts, level.value.workspace.wires));
const evaluation = computed(() => evaluateRepairLevel(level.value, simulation.value));
const selectedPart = computed(
  () => level.value.workspace.parts.find((part) => part.id === selectedPartId.value) ?? null,
);
const generatedJson = computed(() => repairLevelToJson(level.value));
const tagsText = computed({
  get: () => level.value.tags.join(", "),
  set: (value: string) => {
    level.value.tags = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  },
});
const repairPathText = computed({
  get: () => level.value.repairPath.join("\n"),
  set: (value: string) => {
    level.value.repairPath = value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  },
});

function setPreset(index: number) {
  presetIndex.value = index;
  level.value = cloneRepairLevel(repairLevelPresets[index]);
  selectedPartId.value = level.value.workspace.parts[0]?.id ?? "";
}

function copyGeneratedJson() {
  if (!navigator.clipboard?.writeText) {
    copyState.value = "idle";
    return;
  }

  navigator.clipboard.writeText(generatedJson.value).then(() => {
    copyState.value = "copied";
    window.setTimeout(() => {
      copyState.value = "idle";
    }, 1000);
  });
}

function resetCurrentLevel() {
  setPreset(Math.max(0, presetIndex.value));
}

function setMobileMode(mode: "stage" | "task" | "template") {
  mobileMode.value = mode;
}

function selectPart(partId: string) {
  selectedPartId.value = partId;
}

function updateSelectedPart(mutator: (part: CircuitPart) => void) {
  if (!selectedPart.value) {
    return;
  }

  mutator(selectedPart.value);
}

function toggleSwitch() {
  updateSelectedPart((part) => {
    if (part.type === "switch") {
      part.closed = !part.closed;
    }
  });
}

function toggleBatteryPolarity() {
  updateSelectedPart((part) => {
    if (part.type === "battery") {
      part.polarity = part.polarity === "reversed" ? "normal" : "reversed";
    }
  });
}

function setResistance(value: number) {
  updateSelectedPart((part) => {
    if (part.type === "resistor") {
      part.resistance = value;
    }
  });
}

function wirePath(wireId: string) {
  return repairLevelWirePath(level.value, wireId);
}

function wireActive(wireId: string) {
  return Boolean(simulation.value.wires[wireId]?.active);
}

function wireReverse(wireId: string) {
  return Boolean(simulation.value.wires[wireId]?.reverse);
}

function partStateLabel(part: CircuitPart) {
  return repairLevelPartSummary(level.value, simulation.value, part.id);
}

function partStatusTone(part: CircuitPart) {
  if (part.type === "battery") {
    return part.polarity === "reversed" ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50";
  }

  if (part.type === "switch") {
    return part.closed ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50";
  }

  const summary = partStateLabel(part);
  return summary === "部件缺失" ? "border-rose-300 bg-rose-50" : "border-slate-300 bg-white";
}

function partLabel(part: CircuitPart) {
  return getSpec(part).label;
}

function partStyle(part: CircuitPart) {
  const spec = getSpec(part);
  return {
    height: `${spec.height}px`,
    left: `${part.x}px`,
    top: `${part.y}px`,
    width: `${spec.width}px`,
  };
}

const solved = computed(() => evaluation.value.solved);
const solvedCount = computed(() => evaluation.value.checks.filter((check) => check.passed).length);
const repairTargetLabel = computed(() => {
  if (level.value.goal.bulbs) {
    return "灯泡亮度";
  }

  if (level.value.goal.leds) {
    return "LED 亮度";
  }

  if (level.value.goal.buzzers) {
    return "蜂鸣器音量";
  }

  if (level.value.goal.motors) {
    return "电机转速";
  }

  return "输出状态";
});
const targetPartId = computed(() => {
  const goal = level.value.goal;
  const partMap = goal.bulbs ?? goal.leds ?? goal.buzzers ?? goal.motors ?? goal.voltmeters ?? goal.diodes ?? {};
  return Object.keys(partMap)[0] ?? "";
});
const currentMilliAmpsMin = computed({
  get: () => level.value.goal.currentMilliAmps?.min ?? 0,
  set: (value: number) => {
    if (level.value.goal.currentMilliAmps) {
      level.value.goal.currentMilliAmps.min = value;
    }
  },
});
const currentMilliAmpsMax = computed({
  get: () => level.value.goal.currentMilliAmps?.max ?? 0,
  set: (value: number) => {
    if (level.value.goal.currentMilliAmps) {
      level.value.goal.currentMilliAmps.max = value;
    }
  },
});
const targetBrightnessMin = computed({
  get: () => {
    const id = targetPartId.value;
    const bulbs = level.value.goal.bulbs;
    const leds = level.value.goal.leds;
    const bulbTarget = bulbs?.[id];
    const ledTarget = leds?.[id];
    return bulbTarget?.brightnessPercent?.min ?? ledTarget?.brightnessPercent?.min ?? 0;
  },
  set: (value: number) => {
    const id = targetPartId.value;
    const bulbs = level.value.goal.bulbs;
    const leds = level.value.goal.leds;
    const bulbTarget = bulbs?.[id];
    const ledTarget = leds?.[id];
    if (bulbTarget?.brightnessPercent) {
      bulbTarget.brightnessPercent.min = value;
    }
    if (ledTarget?.brightnessPercent) {
      ledTarget.brightnessPercent.min = value;
    }
  },
});
const targetLedForward = computed({
  get: () => {
    const id = targetPartId.value;
    const leds = level.value.goal.leds;
    const target = leds?.[id];
    return target?.forward ?? false;
  },
  set: (value: boolean) => {
    const id = targetPartId.value;
    const leds = level.value.goal.leds;
    const target = leds?.[id];
    if (target) {
      target.forward = value;
    }
  },
});
const targetBuzzerMin = computed({
  get: () => {
    const id = targetPartId.value;
    const buzzers = level.value.goal.buzzers;
    const target = buzzers?.[id];
    return target?.volumePercent?.min ?? 0;
  },
  set: (value: number) => {
    const id = targetPartId.value;
    const buzzers = level.value.goal.buzzers;
    const target = buzzers?.[id];
    if (target?.volumePercent) {
      target.volumePercent.min = value;
    }
  },
});
const targetMotorMin = computed({
  get: () => {
    const id = targetPartId.value;
    const motors = level.value.goal.motors;
    const target = motors?.[id];
    return target?.speedPercent?.min ?? 0;
  },
  set: (value: number) => {
    const id = targetPartId.value;
    const motors = level.value.goal.motors;
    const target = motors?.[id];
    if (target?.speedPercent) {
      target.speedPercent.min = value;
    }
  },
});
</script>

<template>
  <main class="min-h-screen bg-[#f4f7f4] text-slate-900">
    <div class="mx-auto flex max-w-[1680px] flex-col gap-4 px-4 py-4 lg:px-6">
      <header class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div class="flex items-center gap-3">
          <img class="h-9 w-9 object-contain" :src="logoUrl" alt="明石空间 logo" />
          <div class="leading-tight">
            <div class="text-sm font-semibold tracking-tight">明石空间</div>
            <div class="text-xs text-slate-500">xshow repair lab · 电路修理 + 关卡编辑器 + 微信小游戏原型</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            to="/"
            class="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium hover:bg-slate-50"
          >
            <ArrowLeft class="h-4 w-4" />
            回工作台
          </RouterLink>
          <Button variant="outline" size="sm" @click="resetCurrentLevel">
            <RotateCcw class="h-4 w-4" />
            复位
          </Button>
          <Button variant="outline" size="sm" @click="copyGeneratedJson">
            <Copy class="h-4 w-4" />
            {{ copyState === "copied" ? "已复制" : "复制模板" }}
          </Button>
        </div>
      </header>

      <div class="flex gap-2 xl:hidden">
        <button
          class="h-11 flex-1 rounded-md border text-sm font-medium transition-colors"
          :class="mobileMode === 'stage' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700'"
          @click="setMobileMode('stage')"
        >
          关卡
        </button>
        <button
          class="h-11 flex-1 rounded-md border text-sm font-medium transition-colors"
          :class="mobileMode === 'task' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700'"
          @click="setMobileMode('task')"
        >
          修复
        </button>
        <button
          class="h-11 flex-1 rounded-md border text-sm font-medium transition-colors"
          :class="mobileMode === 'template' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700'"
          @click="setMobileMode('template')"
        >
          模板
        </button>
      </div>

      <section class="space-y-4 xl:hidden">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-medium uppercase tracking-[0.24em] text-cyan-700">Repair Mission</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight">{{ level.title }}</h1>
          <p class="mt-2 text-sm leading-6 text-slate-600">{{ level.summary }}</p>
          <p class="mt-3 text-xs leading-5 text-slate-500">{{ level.failure }}</p>
          <div class="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span class="h-2.5 w-2.5 rounded-full" :class="solved ? 'bg-emerald-500' : 'bg-amber-500'" />
            <span class="font-medium">{{ solved ? "已修复" : "等待修复" }}</span>
            <span class="text-slate-500">{{ solvedCount }}/{{ evaluation.checks.length }}</span>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold text-slate-900">关卡舞台</h2>
              <p class="text-xs text-slate-500">横向拖动查看整张电路图。</p>
            </div>
            <button
              class="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700"
              @click="resetCurrentLevel"
            >
              复位
            </button>
          </div>

          <div class="overflow-auto rounded-2xl border border-slate-200 bg-[#f8fbf9]">
            <div class="canvas-grid relative min-h-[420px] min-w-[1120px]">
              <svg class="absolute inset-0 h-full w-full" viewBox="0 0 1120 560" aria-hidden="true">
                <g v-for="wire in level.workspace.wires" :key="wire.id">
                  <path
                    :d="wirePath(wire.id)"
                    fill="none"
                    :class="wireActive(wire.id) ? 'wire-current' : ''"
                    :stroke="wireActive(wire.id) ? '#d97706' : '#94a3b8'"
                    :stroke-dasharray="wireReverse(wire.id) ? '10 8' : undefined"
                    :stroke-width="wireActive(wire.id) ? 4 : 3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>
              </svg>

              <button
                v-for="part in level.workspace.parts"
                :key="part.id"
                type="button"
                class="group absolute flex flex-col justify-between rounded-2xl border p-3 text-left shadow-sm transition-all"
                :class="[
                  partStatusTone(part),
                  selectedPartId === part.id ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#f8fbf9]' : '',
                ]"
                :style="partStyle(part)"
                @click="selectPart(part.id)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <component :is="getSpec(part).icon" class="h-4 w-4" />
                    </div>
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold">{{ part.name }}</div>
                      <div class="text-xs text-slate-500">{{ partLabel(part) }}</div>
                    </div>
                  </div>
                  <span class="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                    {{ partStateLabel(part) }}
                  </span>
                </div>

                <div class="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <span class="rounded-full bg-white/80 px-2 py-1 shadow-sm">A</span>
                  <span class="rounded-full bg-white/80 px-2 py-1 shadow-sm">B</span>
                </div>
              </button>
            </div>
          </div>

          <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">电路状态</div>
              <div class="mt-1 font-medium">{{ simulation.closed ? "闭合" : "断开" }}</div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">总电流</div>
              <div class="mt-1 font-medium">{{ simulation.currentMilliAmps }} mA</div>
            </div>
          </div>
        </div>

        <div v-if="mobileMode === 'stage'" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between">
            <div>
              <h2 class="text-sm font-semibold">快速修复</h2>
              <p class="text-xs text-slate-500">先修当前选中的部件。</p>
            </div>
            <div class="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
              {{ selectedPart?.name ?? "未选中" }}
            </div>
          </div>

          <div v-if="selectedPart" class="space-y-3">
            <div v-if="selectedPart.type === 'switch'">
              <Button class="h-11 w-full justify-center" variant="outline" @click="toggleSwitch">
                {{ selectedPart.closed ? "切换到断开" : "切换到闭合" }}
              </Button>
            </div>

            <div v-else-if="selectedPart.type === 'battery'">
              <Button class="h-11 w-full justify-center" variant="outline" @click="toggleBatteryPolarity">
                {{ selectedPart.polarity === 'reversed' ? '切回正向' : '切到反向' }}
              </Button>
            </div>

            <div v-else-if="selectedPart.type === 'resistor'" class="space-y-2">
              <label class="block text-xs text-slate-500">电阻值 {{ Math.round(selectedPart.resistance ?? 0) }} Ω</label>
              <input
                class="w-full accent-cyan-700"
                :value="selectedPart.resistance ?? 0"
                max="260"
                min="1"
                step="1"
                type="range"
                @input="setResistance(Number(($event.target as HTMLInputElement).value))"
              />
              <input
                class="h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                :value="selectedPart.resistance ?? 0"
                min="1"
                type="number"
                @input="setResistance(Number(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <div v-else class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            先点一个部件。
          </div>
        </div>

        <div v-if="mobileMode === 'task'" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-3">
            <h2 class="text-sm font-semibold">故障与路径</h2>
            <p class="text-xs text-slate-500">把任务定义整理成可读的关卡说明。</p>
          </div>
          <div class="space-y-3 text-sm">
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">故障描述</div>
              <p class="mt-1 leading-6 text-slate-700">{{ level.failure }}</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">修复路径</div>
              <ol class="mt-2 space-y-2 text-slate-700">
                <li v-for="step in level.repairPath" :key="step" class="rounded-lg bg-white px-3 py-2">{{ step }}</li>
              </ol>
            </div>
            <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div class="text-xs text-slate-500">验收条件</div>
              <div class="mt-2 space-y-2">
                <div
                  v-for="check in evaluation.checks"
                  :key="check.label"
                  class="flex items-start gap-2 rounded-lg bg-white px-3 py-2"
                >
                  <span class="mt-1 h-2.5 w-2.5 rounded-full" :class="check.passed ? 'bg-emerald-500' : 'bg-amber-500'" />
                  <div class="min-w-0">
                    <div class="font-medium text-slate-800">{{ check.label }}</div>
                    <div class="text-xs text-slate-500">{{ check.detail }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="mobileMode === 'template'" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-sm font-semibold">模板预览</h2>
              <p class="text-xs text-slate-500">复制这个模板，就能继续生产新关卡。</p>
            </div>
            <Button variant="outline" size="sm" @click="copyGeneratedJson">
              <Copy class="h-4 w-4" />
              {{ copyState === "copied" ? "已复制" : "复制模板" }}
            </Button>
          </div>
          <textarea
            :value="generatedJson"
            class="min-h-[320px] w-full rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-[11px] leading-5 text-slate-100"
            readonly
            spellcheck="false"
          />
        </div>
      </section>

      <section class="hidden gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex min-w-0 flex-col gap-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium uppercase tracking-[0.24em] text-cyan-700">Repair Mission</p>
                <h1 class="mt-1 text-2xl font-semibold tracking-tight">{{ level.title }}</h1>
                <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{{ level.summary }}</p>
              </div>
              <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :class="solved ? 'bg-emerald-500' : 'bg-amber-500'"
                />
                <span class="font-medium">{{ solved ? "已修复" : "等待修复" }}</span>
                <span class="text-slate-500">{{ solvedCount }}/{{ evaluation.checks.length }}</span>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold text-slate-900">关卡舞台</h2>
                <p class="text-xs text-slate-500">点击部件进行修复，电路状态会实时刷新。</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="(preset, index) in repairLevelPresets"
                  :key="preset.id"
                  class="inline-flex h-8 items-center rounded-md border px-3 text-sm transition-colors"
                  :class="index === presetIndex ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'"
                  @click="setPreset(index)"
                >
                  {{ preset.title }}
                </button>
              </div>
            </div>

            <div class="overflow-auto rounded-2xl border border-slate-200 bg-[#f8fbf9]">
              <div class="canvas-grid relative min-h-[560px] min-w-[1120px]">
                <svg class="absolute inset-0 h-full w-full" viewBox="0 0 1120 560" aria-hidden="true">
                  <g v-for="wire in level.workspace.wires" :key="wire.id">
                    <path
                      :d="wirePath(wire.id)"
                      fill="none"
                      :class="wireActive(wire.id) ? 'wire-current' : ''"
                      :stroke="wireActive(wire.id) ? '#d97706' : '#94a3b8'"
                      :stroke-dasharray="wireReverse(wire.id) ? '10 8' : undefined"
                      :stroke-width="wireActive(wire.id) ? 4 : 3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </g>
                </svg>

                <button
                  v-for="part in level.workspace.parts"
                  :key="part.id"
                  type="button"
                  class="group absolute flex flex-col justify-between rounded-2xl border p-3 text-left shadow-sm transition-all"
                  :class="[
                    partStatusTone(part),
                    selectedPartId === part.id ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#f8fbf9]' : '',
                  ]"
                  :style="partStyle(part)"
                  @click="selectPart(part.id)"
                >
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white">
                        <component :is="getSpec(part).icon" class="h-4 w-4" />
                      </div>
                      <div class="min-w-0">
                        <div class="truncate text-sm font-semibold">{{ part.name }}</div>
                        <div class="text-xs text-slate-500">{{ partLabel(part) }}</div>
                      </div>
                    </div>
                    <span class="rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
                      {{ partStateLabel(part) }}
                    </span>
                  </div>

                  <div class="mt-3 flex items-center justify-between text-xs text-slate-600">
                    <span class="rounded-full bg-white/80 px-2 py-1 shadow-sm">A</span>
                    <span class="rounded-full bg-white/80 px-2 py-1 shadow-sm">B</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3 flex items-center justify-between">
                <div>
                  <h2 class="text-sm font-semibold">修复目标</h2>
                  <p class="text-xs text-slate-500">这部分定义了关卡是否通过。</p>
                </div>
                <div class="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white">
                  {{ solved ? "通过" : "未通过" }}
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="check in evaluation.checks"
                  :key="check.label"
                  class="flex items-start gap-3 rounded-xl border px-3 py-2"
                  :class="check.passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'"
                >
                  <div
                    class="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                    :class="check.passed ? 'bg-emerald-500' : 'bg-amber-500'"
                  >
                    <PackageCheck v-if="check.passed" class="h-3.5 w-3.5" />
                    <X v-else class="h-3.5 w-3.5" />
                  </div>
                  <div class="min-w-0">
                    <div class="text-sm font-medium">{{ check.label }}</div>
                    <div class="text-xs leading-5 text-slate-600">{{ check.detail }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div class="mb-3">
                <h2 class="text-sm font-semibold">当前电路</h2>
                <p class="text-xs text-slate-500">这是可观测节点的关键指标。</p>
              </div>

              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">电路状态</div>
                  <div class="mt-1 font-medium">{{ simulation.closed ? "闭合" : "断开" }}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">总电流</div>
                  <div class="mt-1 font-medium">{{ simulation.currentMilliAmps }} mA</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">等效电阻</div>
                  <div class="mt-1 font-medium">{{ simulation.equivalentResistance }} Ω</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div class="text-xs text-slate-500">选中部件</div>
                  <div class="mt-1 font-medium">{{ selectedPart?.name ?? "未选中" }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="flex min-w-0 flex-col gap-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-sm font-semibold">任务向导</h2>
                <p class="text-xs text-slate-500">把关卡从故障描述一路生成到可复制的 JSON 模板。</p>
              </div>
              <Button variant="outline" size="sm" @click="copyGeneratedJson">
                <Copy class="h-4 w-4" />
                {{ copyState === "copied" ? "已复制" : "复制模板" }}
              </Button>
            </div>

            <div class="space-y-4">
              <section class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-3 flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">1</span>
                  <div>
                    <div class="text-sm font-medium">任务定义</div>
                    <div class="text-xs text-slate-500">标题、摘要和故障态。</div>
                  </div>
                </div>

                <div class="space-y-3">
                  <label class="block">
                    <span class="mb-1 block text-xs text-slate-500">标题</span>
                    <input
                      v-model="level.title"
                      class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs text-slate-500">摘要</span>
                    <textarea
                      v-model="level.summary"
                      class="min-h-[72px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs text-slate-500">故障描述</span>
                    <textarea
                      v-model="level.failure"
                      class="min-h-[88px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs text-slate-500">标签</span>
                    <input
                      v-model="tagsText"
                      class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label class="block">
                    <span class="mb-1 block text-xs text-slate-500">修复路径</span>
                    <textarea
                      v-model="repairPathText"
                      class="min-h-[96px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </section>

              <section class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-3 flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-700 text-xs font-semibold text-white">2</span>
                  <div>
                    <div class="text-sm font-medium">故障修复</div>
                    <div class="text-xs text-slate-500">直接调当前部件状态。</div>
                  </div>
                </div>

                <div v-if="selectedPart" class="space-y-3">
                  <div class="rounded-xl border border-slate-200 bg-white p-3">
                    <div class="text-xs text-slate-500">当前部件</div>
                    <div class="mt-1 text-sm font-medium">{{ selectedPart.name }}</div>
                    <div class="text-xs text-slate-500">{{ partLabel(selectedPart) }} / {{ selectedPart.type }}</div>
                  </div>

                  <div v-if="selectedPart.type === 'switch'" class="space-y-2">
                    <Button class="w-full justify-center" variant="outline" @click="toggleSwitch">
                      {{ selectedPart.closed ? "切换到断开" : "切换到闭合" }}
                    </Button>
                  </div>

                  <div v-else-if="selectedPart.type === 'battery'" class="space-y-2">
                    <Button class="w-full justify-center" variant="outline" @click="toggleBatteryPolarity">
                      {{ selectedPart.polarity === 'reversed' ? '切回正向' : '切到反向' }}
                    </Button>
                  </div>

                  <div v-else-if="selectedPart.type === 'resistor'" class="space-y-2">
                    <label class="block text-xs text-slate-500">电阻值 {{ Math.round(selectedPart.resistance ?? 0) }} Ω</label>
                    <input
                      class="w-full accent-cyan-700"
                      :value="selectedPart.resistance ?? 0"
                      max="260"
                      min="1"
                      step="1"
                      type="range"
                      @input="setResistance(Number(($event.target as HTMLInputElement).value))"
                    />
                    <input
                      class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      :value="selectedPart.resistance ?? 0"
                      min="1"
                      type="number"
                      @input="setResistance(Number(($event.target as HTMLInputElement).value))"
                    />
                  </div>
                </div>

                <div v-else class="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                  先点一个部件。
                </div>
              </section>

              <section class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-3 flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold text-white">3</span>
                  <div>
                    <div class="text-sm font-medium">验收条件</div>
                    <div class="text-xs text-slate-500">把关卡判定写成模板字段。</div>
                  </div>
                </div>

                <div class="space-y-3">
                  <div class="grid grid-cols-2 gap-2">
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">总电流最小值</span>
                      <input
                        v-model.number="currentMilliAmpsMin"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">总电流最大值</span>
                      <input
                        v-model.number="currentMilliAmpsMax"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                  </div>

                  <div v-if="level.goal.bulbs && targetPartId" class="grid grid-cols-2 gap-2">
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">{{ repairTargetLabel }}最低值</span>
                      <input
                        v-model.number="targetBrightnessMin"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                    <div class="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      目标对象：{{ targetPartId }}
                    </div>
                  </div>

                  <div v-else-if="level.goal.leds && targetPartId" class="grid grid-cols-2 gap-2">
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">{{ repairTargetLabel }}最低值</span>
                      <input
                        v-model.number="targetBrightnessMin"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">正向导通</span>
                      <input
                        v-model="targetLedForward"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="checkbox"
                      />
                    </label>
                  </div>

                  <div v-else-if="level.goal.buzzers && targetPartId" class="grid grid-cols-2 gap-2">
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">{{ repairTargetLabel }}最低值</span>
                      <input
                        v-model.number="targetBuzzerMin"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                    <div class="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      目标对象：{{ targetPartId }}
                    </div>
                  </div>

                  <div v-else-if="level.goal.motors && targetPartId" class="grid grid-cols-2 gap-2">
                    <label class="block">
                      <span class="mb-1 block text-xs text-slate-500">{{ repairTargetLabel }}最低值</span>
                      <input
                        v-model.number="targetMotorMin"
                        class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        type="number"
                      />
                    </label>
                    <div class="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                      目标对象：{{ targetPartId }}
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-3 flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">4</span>
                  <div>
                    <div class="text-sm font-medium">生成预览</div>
                    <div class="text-xs text-slate-500">复制出去就是一个可保存的关卡模板。</div>
                  </div>
                </div>

                <textarea
                  :value="generatedJson"
                  class="min-h-[260px] w-full rounded-2xl border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-[11px] leading-5 text-slate-100"
                  readonly
                  spellcheck="false"
                />
              </section>
            </div>
          </div>
        </aside>
      </section>
    </div>
  </main>
</template>
