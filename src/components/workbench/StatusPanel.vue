<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Activity,
  BatteryMedium,
  Cable,
  Check,
  CloudCheck,
  CloudOff,
  CloudSync,
  CloudUpload,
  Copy,
  FileDown,
  FileUp,
  FolderOpen,
  Link,
  LogOut,
  Mail,
  PackageCheck,
  Pencil,
  Printer,
  RotateCcw,
  RotateCw,
  Save,
  ShieldCheck,
  Trash2,
  TriangleRight,
  TriangleAlert,
  X,
  Zap,
} from "@lucide/vue";
import Button from "@/components/ui/Button.vue";
import { lessonCatalog, type Lesson, type LessonStep } from "@/data/lessons";
import type {
  BuzzerState,
  AmmeterState,
  CapacitorState,
  CircuitPart,
  CircuitSimulation,
  DiodeState,
  LedState,
  MotorState,
  VoltmeterState,
  Wire,
  WireEnd,
} from "@/lib/circuit";
import type { CloudWorkspaceRecord } from "@/lib/cloud";
import type { PhysicalBuildPlan } from "@/lib/physical-build";
import { getSpec, statusPanelTabs, type StatusPanelTab } from "@/lib/workbench-ui";
import type {
  CloudAuthMode,
  CloudSyncState,
  PersistedWorkspace,
  SaveCloudWorkspaceOptions,
  SavedWorkspaceRecord,
} from "@/lib/workspace-records";

type CloudRecord = CloudWorkspaceRecord<PersistedWorkspace>;
type LessonStepState = LessonStep & { complete: boolean };
type LessonProgress = { completed: number; percent: number; total: number };

const props = defineProps<{
  activeAmmeterCount: number;
  activeBuzzerCount: number;
  activeLesson: Lesson;
  activeLessonId: string;
  activeMotorCount: number;
  activeVoltmeterCount: number;
  ammeterStatus: (part: CircuitPart) => AmmeterState;
  batteryPolarityLabel: (part: CircuitPart) => string;
  bindSpringToCoil: (spring: CircuitPart, coilId: string) => void;
  buzzerStatus: (part: CircuitPart) => BuzzerState;
  capacitorStatus: (part: CircuitPart) => CapacitorState;
  cloudActiveRecordId: string | null;
  cloudAuthBusy: boolean;
  cloudAuthError: string;
  cloudAuthHelpText: string;
  cloudAuthMessage: string;
  cloudAuthMode: CloudAuthMode;
  cloudAuthSubmitLabel: string;
  cloudAuthTitle: string;
  cloudConfig: { configured: boolean; provider: string };
  cloudEmail: string;
  cloudPassword: string;
  cloudPasswordConfirm: string;
  cloudPendingSnapshot: PersistedWorkspace | null;
  cloudRecordTitle: string;
  cloudRecords: CloudRecord[];
  cloudRecordsBusy: boolean;
  cloudRecordsError: string;
  cloudRecordsMessage: string;
  cloudSaveLabel: string;
  cloudShouldSuggestInitialUpload: boolean;
  cloudSyncBadgeClass: string;
  cloudSyncDescription: string;
  cloudSyncLabel: string;
  cloudSyncState: CloudSyncState;
  cloudUserEmail: string | null;
  dismissCloudInitialUploadSuggestion: () => void;
  experimentReportCopyState: "copied" | "idle" | "manual";
  formatSavedTime: (savedAt: string) => string;
  handleCloudSignOut: () => void | Promise<void>;
  hasBuzzerParts: boolean;
  hasMotorParts: boolean;
  importWorkspaceJson: (event: Event) => void | Promise<void>;
  diodeStatus: (part: CircuitPart) => DiodeState;
  diodeWarnings: DiodeState[];
  ledStatus: (part: CircuitPart) => LedState;
  ledWarnings: LedState[];
  lessonProgress: LessonProgress;
  lessonComplete: boolean;
  lessonStepStates: LessonStepState[];
  loadCloudRecord: (record: CloudRecord) => void;
  loadCloudRecords: () => void | Promise<void>;
  loadLessonWorkspace: () => void;
  loadSavedRecord: (record: SavedWorkspaceRecord) => void;
  mainBulbBrightness: number;
  motorStatus: (part: CircuitPart) => MotorState;
  nextLessonStep: LessonStepState | undefined;
  open: boolean;
  physicalBuildPlan: PhysicalBuildPlan;
  parts: CircuitPart[];
  physicalBuildPlanCopyState: "copied" | "idle" | "manual";
  publishRelayModule: (part: CircuitPart) => string;
  primaryBattery: CircuitPart | undefined;
  recordTitle: string;
  removeCloudRecord: (recordId: string) => void | Promise<void>;
  removeSavedRecord: (recordId: string) => void;
  removeSelectedPart: () => void;
  removeWire: (wireId: string) => void;
  renameCloudRecord: (record: CloudRecord) => void | Promise<void>;
  requestCloudAuth: () => void | Promise<void>;
  rewiring: { wireId: string; end: WireEnd } | null;
  saveWorkspaceRecord: () => void;
  saveWorkspaceToCloud: (options?: SaveCloudWorkspaceOptions) => void | Promise<void>;
  savedRecords: SavedWorkspaceRecord[];
  selectWire: (wireId: string) => void;
  selectedPart: CircuitPart | undefined;
  selectedWire: Wire | undefined;
  selectedWireId: string | null;
  setCloudAuthMode: (mode: CloudAuthMode) => void;
  setPartRotation: (part: CircuitPart, value: number) => void;
  setResistance: (part: CircuitPart, value: number) => void;
  shareLinkState: "copied" | "idle" | "manual";
  sharedWorkspaceLoaded: boolean;
  workspaceRecoveryMessage: string;
  simulation: CircuitSimulation;
  startRewire: (wireId: string, end: WireEnd) => void;
  tab: StatusPanelTab;
  toggleBatteryPolarity: (part: CircuitPart) => void;
  toggleSwitch: (part: CircuitPart) => void;
  voltmeterStatus: (part: CircuitPart) => VoltmeterState;
  workbenchMode: "free" | "workshop";
  wireLabel: (wire: Wire) => string;
  wires: Wire[];
}>();

const emit = defineEmits<{
  close: [];
  "copy-experiment-report": [];
  "copy-physical-build-plan": [];
  "export-physical-build-sheet": [];
  "export-physical-build-plan": [];
  "export-experiment-report": [];
  "copy-workspace-share-link": [];
  "export-workspace-json": [];
  "update:activeLessonId": [lessonId: string];
  "update:cloudEmail": [email: string];
  "update:cloudPassword": [password: string];
  "update:cloudPasswordConfirm": [password: string];
  "update:cloudRecordTitle": [title: string];
  "update:recordTitle": [title: string];
  "update:tab": [tab: StatusPanelTab];
}>();

const workspaceImportRef = ref<HTMLInputElement | null>(null);
const relayPublishFeedback = ref("");
const modeLessons = computed(() => props.workbenchMode === "workshop"
  ? lessonCatalog.filter((lesson) => Boolean(lesson.nextStage))
  : lessonCatalog.filter((lesson) => !lesson.nextStage));

function updateInput(event: Event) {
  return (event.target as HTMLInputElement).value;
}

function publishSelectedRelay(part: CircuitPart | undefined) {
  if (part) {
    relayPublishFeedback.value = props.publishRelayModule(part);
  }
}

function isRelayAssembly(part: CircuitPart | undefined) {
  return Boolean(
    part && (
      (part.type === "spring" && part.controlledBy) ||
      (part.type === "coil" && props.parts.some((candidate) => candidate.type === "spring" && candidate.controlledBy === part.id))
    ),
  );
}
</script>

<template>
  <aside
    class="fixed inset-x-3 bottom-20 z-40 flex max-h-[70dvh] min-h-0 flex-col rounded-md border bg-card shadow-panel transition-all duration-200 xl:static xl:inset-auto xl:z-auto xl:max-h-none xl:rounded-none xl:border-l xl:border-r-0 xl:border-t-0 xl:shadow-none"
    :class="open ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0 xl:pointer-events-auto xl:translate-y-0 xl:opacity-100'"
  >
    <div class="flex items-center justify-between border-b px-3 py-2 xl:px-4 xl:py-3">
      <div>
        <div class="text-sm font-semibold">状态</div>
        <div class="text-xs text-muted-foreground">{{ selectedWire ? "导线" : selectedPart?.name ?? "未选择" }}</div>
      </div>
      <Button class="xl:hidden" variant="ghost" size="icon" title="关闭状态面板" @click="emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </div>

    <div class="grid grid-cols-3 gap-1.5 border-b bg-muted/25 p-2 xl:grid-cols-2">
      <button
        v-for="item in statusPanelTabs"
        :key="item.id"
        class="flex h-10 items-center justify-start gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors"
        :class="
          tab === item.id
            ? 'border-cyan-200 bg-background text-foreground shadow-sm'
            : 'border-transparent text-muted-foreground hover:border-border hover:bg-background/70 hover:text-foreground'
        "
        @click="emit('update:tab', item.id)"
      >
        <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
        <span>{{ item.label }}</span>
      </button>
    </div>

    <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 xl:p-4">
      <section v-if="tab === 'lesson'" class="rounded-md border bg-background p-3">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <div class="text-xs text-muted-foreground">{{ workbenchMode === 'workshop' ? 'Component Workshop' : 'Free Experiment' }}</div>
            <div class="text-sm font-semibold">{{ activeLesson.title }}</div>
          </div>
          <div class="rounded-md bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-900">
            {{ lessonProgress.completed }}/{{ lessonProgress.total }}
          </div>
        </div>
        <p class="mb-3 text-xs leading-5 text-muted-foreground">
          {{ workbenchMode === 'workshop' ? '用课程给出的线圈、触点和接线目标制作可发布器件。' : '选择一个电路现象作为起点，自由修改元件、接线与参数。' }}
        </p>
        <div
          v-if="activeLesson.nextStage"
          class="mb-3 rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-950"
        >
          <div class="font-medium">完成后可发布为 {{ activeLesson.nextStage.moduleName }}</div>
          <div class="mt-1 leading-5">
            下一阶段输入：{{ activeLesson.nextStage.ports.join('、') }}
          </div>
        </div>
        <div class="mb-3 grid grid-cols-1 gap-2">
          <button
            v-for="lesson in modeLessons"
            :key="lesson.id"
            class="rounded-md border px-3 py-2 text-left text-xs transition-colors"
            :class="
              activeLessonId === lesson.id
                ? 'border-cyan-500 bg-cyan-50 text-cyan-950'
                : 'bg-card text-muted-foreground hover:bg-muted'
            "
            @click="emit('update:activeLessonId', lesson.id)"
          >
            <span class="block truncate font-medium">{{ lesson.title }}</span>
          </button>
        </div>
        <Button class="mb-3 w-full" variant="outline" size="sm" @click="loadLessonWorkspace()">
          <RotateCcw class="h-4 w-4" />
          加载实验初始状态
        </Button>
        <div class="mb-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            class="h-full rounded-full bg-cyan-600 transition-all"
            :style="{ width: `${lessonProgress.percent}%` }"
          />
        </div>
        <div
          v-if="nextLessonStep"
          class="mb-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950"
        >
          <div class="mb-1 font-medium">下一步提示</div>
          <div class="leading-5">{{ nextLessonStep.hint }}</div>
        </div>
        <div
          v-else
          class="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950"
        >
          <div class="font-medium">实验完成，可以切换到下一个实验。</div>
        </div>
        <div class="space-y-2">
          <div
            v-for="step in lessonStepStates"
            :key="step.id"
            class="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
            :class="[
              step.complete ? 'border-emerald-200 bg-emerald-50 text-emerald-950' : 'bg-card',
              nextLessonStep?.id === step.id ? 'border-cyan-300 ring-2 ring-cyan-100' : '',
            ]"
          >
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
              :class="
                step.complete
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : nextLessonStep?.id === step.id
                    ? 'border-cyan-500 bg-cyan-500 text-white'
                    : 'border-muted-foreground/40'
              "
            >
              <Check v-if="step.complete" class="h-3.5 w-3.5" />
            </span>
            <span class="leading-5">{{ step.description }}</span>
          </div>
        </div>
      </section>

      <section v-if="tab === 'kit'" class="space-y-3">
        <div class="rounded-md border bg-background p-3">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 text-sm font-medium">
                <PackageCheck class="h-4 w-4 text-cyan-700" />
                实体搭建清单
              </div>
              <p class="mt-1 text-xs leading-5 text-muted-foreground">
                {{ physicalBuildPlan.summary }}
              </p>
            </div>
            <span
              class="shrink-0 rounded-md px-2 py-1 text-xs font-medium"
              :class="physicalBuildPlan.ready ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'"
            >
              {{ physicalBuildPlan.ready ? "可搭建" : "待补齐" }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" @click="emit('copy-physical-build-plan')">
              <Copy class="h-4 w-4" />
              {{
                physicalBuildPlanCopyState === "copied"
                  ? "已复制"
                  : physicalBuildPlanCopyState === "manual"
                    ? "手动复制"
                    : "复制清单"
              }}
            </Button>
            <Button variant="outline" size="sm" @click="emit('export-physical-build-plan')">
              <FileDown class="h-4 w-4" />
              导出 MD
            </Button>
            <Button class="col-span-2" variant="outline" size="sm" @click="emit('export-physical-build-sheet')">
              <Printer class="h-4 w-4" />
              打印装配单
            </Button>
          </div>
        </div>

        <div class="rounded-md border bg-background p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">物料</span>
            <span class="text-xs text-muted-foreground">{{ physicalBuildPlan.items.length }} 类</span>
          </div>
          <div class="space-y-2">
            <div
              v-for="item in physicalBuildPlan.items"
              :key="item.id"
              class="rounded-md border bg-card px-3 py-2 text-xs"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium">{{ item.label }}</span>
                <span class="rounded-md bg-muted px-2 py-0.5 font-medium tabular-nums">x{{ item.quantity }}</span>
              </div>
              <div class="mt-1 leading-5 text-muted-foreground">{{ item.note }}</div>
              <div class="mt-1 leading-5 text-cyan-800">
                采购关键词：{{ item.purchaseKeywords.join(" / ") }}
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-md border bg-background p-3">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">接线步骤</span>
            <span class="text-xs text-muted-foreground">{{ physicalBuildPlan.connections.length }} 条</span>
          </div>
          <div v-if="physicalBuildPlan.connections.length" class="space-y-2">
            <div
              v-for="connection in physicalBuildPlan.connections"
              :key="connection.id"
              class="rounded-md border bg-card px-3 py-2 text-xs leading-5"
            >
              {{ connection.instruction }}
            </div>
          </div>
          <div v-else class="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
            连接元器件后，这里会生成可照着搭的接线步骤。
          </div>
        </div>

        <div v-if="physicalBuildPlan.warnings.length" class="space-y-2">
          <div
            v-for="warning in physicalBuildPlan.warnings"
            :key="warning.id"
            class="rounded-md border px-3 py-2 text-xs leading-5"
            :class="
              warning.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : 'border-cyan-200 bg-cyan-50 text-cyan-950'
            "
          >
            {{ warning.message }}
          </div>
        </div>
      </section>

      <section v-if="tab === 'records'" class="rounded-md border bg-background p-3">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">记录</span>
          <span class="text-xs text-muted-foreground">{{ savedRecords.length }}/12</span>
        </div>
        <input
          ref="workspaceImportRef"
          accept="application/json,.json"
          class="hidden"
          type="file"
          @change="importWorkspaceJson"
        />
        <div class="mb-3 flex gap-2">
          <input
            :value="recordTitle"
            class="h-9 min-w-0 flex-1 rounded-md border bg-card px-3 text-sm"
            placeholder="记录名称"
            @input="emit('update:recordTitle', updateInput($event))"
            @keydown.enter="saveWorkspaceRecord"
          />
          <Button variant="outline" size="icon" title="暂存当前记录" @click="saveWorkspaceRecord">
            <Save class="h-4 w-4" />
          </Button>
        </div>
        <div class="mb-3 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" @click="workspaceImportRef?.click()">
            <FileUp class="h-4 w-4" />
            导入 JSON
          </Button>
          <Button variant="outline" size="sm" @click="emit('export-workspace-json')">
            <FileDown class="h-4 w-4" />
            导出 JSON
          </Button>
        </div>
        <div
          v-if="workspaceRecoveryMessage"
          class="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"
        >
          {{ workspaceRecoveryMessage }} 当前工作台没有覆盖其他记录；你仍可导入正确的 JSON 继续使用。
        </div>
        <div class="mb-3 rounded-md border border-cyan-100 bg-cyan-50/70 p-2">
          <div class="mb-2 text-xs font-medium text-cyan-950">实验报告</div>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" @click="emit('copy-experiment-report')">
              <Copy class="h-4 w-4" />
              {{
                experimentReportCopyState === "copied"
                  ? "已复制"
                  : experimentReportCopyState === "manual"
                    ? "手动复制"
                    : "复制报告"
              }}
            </Button>
            <Button variant="outline" size="sm" @click="emit('export-experiment-report')">
              <FileDown class="h-4 w-4" />
              导出报告
            </Button>
          </div>
        </div>
        <Button class="mb-3 w-full" variant="outline" size="sm" @click="emit('copy-workspace-share-link')">
          <Link class="h-4 w-4" />
          {{
            shareLinkState === "copied"
              ? "链接已复制"
              : shareLinkState === "manual"
                ? "请手动复制"
                : "复制分享链接"
          }}
        </Button>
        <div
          v-if="shareLinkState === 'manual'"
          class="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"
        >
          浏览器没有允许自动复制，已弹出分享链接，请手动复制。
        </div>
        <div v-if="savedRecords.length" class="space-y-2">
          <div
            v-for="record in savedRecords"
            :key="record.id"
            class="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
          >
            <div class="min-w-0">
              <div class="truncate font-medium">{{ record.title }}</div>
              <div class="text-xs text-muted-foreground">{{ formatSavedTime(record.savedAt) }}</div>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" title="加载记录" @click="loadSavedRecord(record)">
                <FolderOpen class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="删除记录" @click="removeSavedRecord(record.id)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div v-else class="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
          暂无暂存记录
        </div>
      </section>

      <section v-if="tab === 'cloud'" class="rounded-md border bg-background p-3">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-2">
            <CloudOff
              v-if="cloudSyncState === 'unconfigured' || cloudSyncState === 'configured'"
              class="h-4 w-4 shrink-0 text-muted-foreground"
            />
            <TriangleAlert v-else-if="cloudSyncState === 'failed'" class="h-4 w-4 shrink-0 text-rose-700" />
            <CloudSync
              v-else-if="cloudSyncState === 'local-changes' || cloudSyncState === 'syncing'"
              class="h-4 w-4 shrink-0 text-amber-700"
            />
            <CloudCheck v-else class="h-4 w-4 shrink-0 text-emerald-700" />
            <span class="text-sm font-medium">云端同步</span>
          </div>
          <span class="rounded-md px-2 py-1 text-xs font-medium" :class="cloudSyncBadgeClass">
            {{ cloudSyncLabel }}
          </span>
        </div>
        <p class="mb-3 text-xs leading-5 text-muted-foreground">
          {{ cloudSyncDescription }}
        </p>
        <div
          v-if="!cloudConfig.configured"
          class="rounded-md border border-dashed px-3 py-3 text-xs leading-5 text-muted-foreground"
        >
          在 `.env.local` 中配置 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 后，可启用登录入口。
        </div>
        <div v-else-if="cloudUserEmail" class="space-y-2">
          <form
            v-if="cloudAuthMode === 'update-password'"
            class="space-y-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-3 text-xs text-cyan-950"
            @submit.prevent="requestCloudAuth"
          >
            <div class="font-medium">{{ cloudAuthTitle }}</div>
            <div class="leading-5">{{ cloudAuthHelpText }}</div>
            <input
              :value="cloudPassword"
              autocomplete="new-password"
              class="h-9 w-full rounded-md border bg-card px-3 text-sm text-foreground"
              placeholder="新密码"
              type="password"
              @input="emit('update:cloudPassword', updateInput($event))"
            />
            <input
              :value="cloudPasswordConfirm"
              autocomplete="new-password"
              class="h-9 w-full rounded-md border bg-card px-3 text-sm text-foreground"
              placeholder="再次输入新密码"
              type="password"
              @input="emit('update:cloudPasswordConfirm', updateInput($event))"
            />
            <div class="grid grid-cols-2 gap-2">
              <Button size="sm" :disabled="cloudAuthBusy" type="submit">
                <ShieldCheck class="h-4 w-4" />
                {{ cloudAuthSubmitLabel }}
              </Button>
              <Button variant="outline" size="sm" :disabled="cloudAuthBusy" type="button" @click="setCloudAuthMode('sign-in')">
                稍后
              </Button>
            </div>
          </form>
          <div class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="text-muted-foreground">当前账号</div>
            <div class="truncate font-medium">{{ cloudUserEmail }}</div>
          </div>
          <div
            v-if="sharedWorkspaceLoaded"
            class="space-y-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950"
          >
            <div class="font-medium">这是从分享链接打开的工作台</div>
            <div class="leading-5">保存为云端副本后，就会进入你的个人记录列表。</div>
            <Button class="w-full" size="sm" :disabled="cloudRecordsBusy" @click="saveWorkspaceToCloud({ saveAsCopy: true })">
              <CloudUpload class="h-4 w-4" />
              复制到我的记录
            </Button>
          </div>
          <div
            v-else-if="cloudShouldSuggestInitialUpload"
            class="space-y-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-950"
          >
            <div class="font-medium">要把当前工作台保存到云端吗？</div>
            <div class="leading-5">保存后，换设备登录也可以继续这个实验。</div>
            <div class="grid grid-cols-2 gap-2">
              <Button size="sm" :disabled="cloudRecordsBusy" @click="saveWorkspaceToCloud()">
                现在上传
              </Button>
              <Button variant="outline" size="sm" :disabled="cloudRecordsBusy" @click="dismissCloudInitialUploadSuggestion">
                稍后
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <input
              :value="cloudRecordTitle"
              class="h-9 w-full rounded-md border bg-card px-3 text-sm"
              placeholder="云端记录名称"
              type="text"
              @input="emit('update:cloudRecordTitle', updateInput($event))"
            />
            <div class="grid grid-cols-2 gap-2">
              <Button size="sm" :disabled="cloudRecordsBusy" @click="saveWorkspaceToCloud()">
                <CloudUpload class="h-4 w-4" />
                {{ cloudSaveLabel }}
              </Button>
              <Button variant="outline" size="sm" :disabled="cloudRecordsBusy" @click="loadCloudRecords">
                <RotateCcw class="h-4 w-4" />
                刷新
              </Button>
            </div>
            <Button
              v-if="cloudActiveRecordId"
              class="w-full"
              variant="outline"
              size="sm"
              :disabled="cloudRecordsBusy"
              @click="saveWorkspaceToCloud({ saveAsCopy: true })"
            >
              <CloudUpload class="h-4 w-4" />
              另存云端副本
            </Button>
          </div>
          <div
            v-if="cloudPendingSnapshot"
            class="space-y-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
          >
            <div class="font-medium">云端记录可能已经被更新</div>
            <div class="leading-5">可以覆盖云端记录，也可以把当前工作台另存为新的云端副本。</div>
            <div class="grid grid-cols-2 gap-2">
              <Button size="sm" :disabled="cloudRecordsBusy" @click="saveWorkspaceToCloud({ forceOverwrite: true })">
                覆盖云端
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="cloudRecordsBusy"
                @click="saveWorkspaceToCloud({ saveAsCopy: true })"
              >
                另存副本
              </Button>
            </div>
          </div>
          <div v-if="cloudRecords.length" class="space-y-2">
            <div
              v-for="record in cloudRecords"
              :key="record.id"
              class="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-xs"
            >
              <div class="min-w-0">
                <div class="truncate font-medium">{{ record.title }}</div>
                <div class="text-xs text-muted-foreground">{{ formatSavedTime(record.updated_at) }}</div>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="加载云端记录"
                  :disabled="cloudRecordsBusy"
                  @click="loadCloudRecord(record)"
                >
                  <FolderOpen class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="重命名云端记录"
                  :disabled="cloudRecordsBusy"
                  @click="renameCloudRecord(record)"
                >
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="删除云端记录"
                  :disabled="cloudRecordsBusy"
                  @click="removeCloudRecord(record.id)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div v-else class="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
            暂无云端记录
          </div>
          <Button class="w-full" variant="outline" size="sm" :disabled="cloudAuthBusy" @click="handleCloudSignOut">
            <LogOut class="h-4 w-4" />
            退出云端同步
          </Button>
        </div>
        <form v-else class="space-y-2" @submit.prevent="requestCloudAuth">
          <div>
            <div class="text-sm font-medium">{{ cloudAuthTitle }}</div>
            <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ cloudAuthHelpText }}</p>
          </div>
          <input
            :value="cloudEmail"
            autocomplete="email"
            class="h-9 w-full rounded-md border bg-card px-3 text-sm"
            inputmode="email"
            placeholder="邮箱地址"
            type="email"
            @input="emit('update:cloudEmail', updateInput($event))"
          />
          <input
            v-if="cloudAuthMode !== 'reset'"
            :value="cloudPassword"
            :autocomplete="cloudAuthMode === 'sign-in' ? 'current-password' : 'new-password'"
            class="h-9 w-full rounded-md border bg-card px-3 text-sm"
            placeholder="密码"
            type="password"
            @input="emit('update:cloudPassword', updateInput($event))"
          />
          <input
            v-if="cloudAuthMode === 'sign-up'"
            :value="cloudPasswordConfirm"
            autocomplete="new-password"
            class="h-9 w-full rounded-md border bg-card px-3 text-sm"
            placeholder="再次输入密码"
            type="password"
            @input="emit('update:cloudPasswordConfirm', updateInput($event))"
          />
          <Button class="w-full" size="sm" :disabled="cloudAuthBusy" type="submit">
            <Mail v-if="cloudAuthMode === 'reset'" class="h-4 w-4" />
            <ShieldCheck v-else class="h-4 w-4" />
            {{ cloudAuthSubmitLabel }}
          </Button>
          <div class="flex flex-wrap items-center justify-center gap-2 text-xs">
            <button
              v-if="cloudAuthMode === 'sign-in'"
              class="text-cyan-700 hover:underline"
              type="button"
              @click="setCloudAuthMode('sign-up')"
            >
              创建账号
            </button>
            <button
              v-if="cloudAuthMode === 'sign-in'"
              class="text-muted-foreground hover:text-foreground hover:underline"
              type="button"
              @click="setCloudAuthMode('reset')"
            >
              忘记密码
            </button>
            <button
              v-if="cloudAuthMode !== 'sign-in'"
              class="text-muted-foreground hover:text-foreground hover:underline"
              type="button"
              @click="setCloudAuthMode('sign-in')"
            >
              返回登录
            </button>
          </div>
        </form>
        <div v-if="cloudAuthMessage" class="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
          {{ cloudAuthMessage }}
        </div>
        <div v-if="cloudAuthError" class="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950">
          {{ cloudAuthError }}
        </div>
        <div v-if="cloudRecordsMessage" class="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
          {{ cloudRecordsMessage }}
        </div>
        <div v-if="cloudRecordsError" class="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950">
          {{ cloudRecordsError }}
        </div>
      </section>

      <section v-if="tab === 'circuit'" class="grid grid-cols-2 gap-3">
        <div class="rounded-md border bg-background p-3">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap class="h-3.5 w-3.5" />
            电流
          </div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ simulation.currentMilliAmps }}</div>
          <div class="text-xs text-muted-foreground">mA</div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-amber-500 transition-all"
              :style="{ width: `${Math.min(100, simulation.currentMilliAmps / 1.8)}%` }"
            />
          </div>
        </div>
        <div class="rounded-md border bg-background p-3">
          <div class="text-xs text-muted-foreground">灯泡</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">
            {{ Math.round(mainBulbBrightness * 100) }}
          </div>
          <div class="text-xs text-muted-foreground">brightness</div>
          <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full bg-amber-400 transition-all"
              :style="{ width: `${Math.round(mainBulbBrightness * 100)}%` }"
            />
          </div>
        </div>
        <div v-if="hasBuzzerParts" class="rounded-md border bg-background p-3">
          <div class="text-xs text-muted-foreground">蜂鸣器</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ activeBuzzerCount }}</div>
          <div class="text-xs text-muted-foreground">active</div>
        </div>
        <div v-if="hasMotorParts" class="rounded-md border bg-background p-3">
          <div class="text-xs text-muted-foreground">电机</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ activeMotorCount }}</div>
          <div class="text-xs text-muted-foreground">active</div>
        </div>
        <div v-if="activeAmmeterCount > 0" class="rounded-md border bg-background p-3">
          <div class="text-xs text-muted-foreground">电流表</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ activeAmmeterCount }}</div>
          <div class="text-xs text-muted-foreground">active</div>
        </div>
        <div v-if="activeVoltmeterCount > 0" class="rounded-md border bg-background p-3">
          <div class="text-xs text-muted-foreground">电压表</div>
          <div class="mt-2 text-2xl font-semibold tabular-nums">{{ activeVoltmeterCount }}</div>
          <div class="text-xs text-muted-foreground">active</div>
        </div>
      </section>

      <section v-if="tab === 'circuit'" class="rounded-md border bg-background p-3">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">回路</span>
          <span
            class="rounded-md px-2 py-1 text-xs font-medium"
            :class="simulation.closed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'"
          >
            {{ simulation.closed ? "闭合" : "断开" }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-xs text-muted-foreground">电源</div>
            <div class="font-medium">9 V</div>
            <div v-if="primaryBattery" class="text-xs text-muted-foreground">
              {{ batteryPolarityLabel(primaryBattery) }}
            </div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">等效电阻</div>
            <div class="font-medium tabular-nums">{{ simulation.equivalentResistance }} Ω</div>
          </div>
        </div>
        <div v-if="ledWarnings.length" class="mt-3 space-y-2">
          <div
            v-for="(warning, index) in ledWarnings"
            :key="index"
            class="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-950"
          >
            <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ warning.reversed ? "有 LED 反接，当前不会导通。" : "LED 电流偏大，请调高限流电阻。" }}</span>
          </div>
        </div>
        <div v-if="diodeWarnings.length" class="mt-3 space-y-2">
          <div
            v-for="(warning, index) in diodeWarnings"
            :key="index"
            class="flex items-start gap-2 rounded-md border border-fuchsia-200 bg-fuchsia-50 px-3 py-2 text-xs text-fuchsia-950"
          >
            <TriangleAlert class="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{{ warning.reversed ? "有二极管反向截止，当前不会导通。" : "二极管电流偏大，请增加限流元件。" }}</span>
          </div>
        </div>
      </section>

      <section v-if="tab === 'selection' && selectedPart && !selectedWire" class="rounded-md border bg-background p-3">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">选中元件</span>
          <Button variant="ghost" size="icon" title="删除" @click="removeSelectedPart">
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
        <div class="space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">类型</span>
            <span class="font-medium">{{ getSpec(selectedPart).label }}</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <label class="space-y-1">
              <span class="text-xs text-muted-foreground">X</span>
              <input
                v-model.number="selectedPart.x"
                class="h-9 w-full rounded-md border bg-card px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="(selectedPart?.type === 'spring' && Boolean(selectedPart?.controlledBy)) || (selectedPart?.type === 'coil' && parts.some((part) => part.type === 'spring' && part.controlledBy === selectedPart?.id))"
                type="number"
              />
            </label>
            <label class="space-y-1">
              <span class="text-xs text-muted-foreground">Y</span>
              <input
                v-model.number="selectedPart.y"
                class="h-9 w-full rounded-md border bg-card px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="(selectedPart?.type === 'spring' && Boolean(selectedPart?.controlledBy)) || (selectedPart?.type === 'coil' && parts.some((part) => part.type === 'spring' && part.controlledBy === selectedPart?.id))"
                type="number"
              />
            </label>
          </div>
          <div class="space-y-2 rounded-md border bg-card px-3 py-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs text-muted-foreground">角度</span>
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  title="逆时针旋转 15 度"
                  @click="setPartRotation(selectedPart, (selectedPart.rotation ?? 0) - 15)"
                >
                  <RotateCcw class="h-4 w-4" />
                </Button>
                <input
                  class="h-8 w-16 rounded-md border bg-background px-2 text-center text-xs tabular-nums"
                  max="359"
                  min="0"
                  type="number"
                  :value="selectedPart.rotation ?? 0"
                  @input="setPartRotation(selectedPart, Number(($event.target as HTMLInputElement).value))"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  title="顺时针旋转 15 度"
                  @click="setPartRotation(selectedPart, (selectedPart.rotation ?? 0) + 15)"
                >
                  <RotateCw class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <input
              class="w-full accent-cyan-700"
              max="359"
              min="0"
              type="range"
              :value="selectedPart.rotation ?? 0"
              @input="setPartRotation(selectedPart, Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <Button
            v-if="selectedPart.type === 'switch'"
            class="w-full"
            :variant="selectedPart.closed ? 'default' : 'outline'"
            @click="toggleSwitch(selectedPart)"
          >
            {{ selectedPart.closed ? "开关已闭合" : "开关已断开" }}
          </Button>
          <Button
            v-if="selectedPart.type === 'spring' && !selectedPart.controlledBy"
            class="w-full"
            :variant="selectedPart.closed ? 'default' : 'outline'"
            @click="toggleSwitch(selectedPart)"
          >
            {{ selectedPart.closed ? "弹簧开关已导通" : "弹簧开关已断开" }}
          </Button>
          <Button
            v-if="selectedPart.type === 'battery'"
            class="w-full"
            variant="outline"
            @click="toggleBatteryPolarity(selectedPart)"
          >
            <RotateCcw class="h-4 w-4" />
            {{ batteryPolarityLabel(selectedPart) }}
          </Button>
          <label v-if="selectedPart.type === 'resistor'" class="block space-y-2">
            <span class="text-xs text-muted-foreground">阻值 {{ selectedPart.resistance ?? 0 }} Ω</span>
            <input
              class="w-full accent-cyan-700"
              max="140"
              min="0"
              type="range"
              :value="selectedPart.resistance ?? 0"
              @input="setResistance(selectedPart, Number(($event.target as HTMLInputElement).value))"
            />
          </label>
          <label v-if="selectedPart.type === 'spring'" class="block space-y-2">
            <span class="text-xs font-medium">控制连杆</span>
            <span class="text-xs font-medium">触点类型</span>
            <select v-model="selectedPart.contactMode" class="h-9 w-full rounded-md border bg-background px-2 text-sm">
              <option value="normally-open">常开（NO）</option>
              <option value="normally-closed">常闭（NC）</option>
            </select>
            <select
              class="h-9 w-full rounded-md border bg-background px-2 text-sm"
              :value="selectedPart.controlledBy ?? ''"
              @change="bindSpringToCoil(selectedPart, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">未绑定（保持触点默认状态）</option>
              <option
                v-for="coil in parts.filter((part) =>
                  part.type === 'coil' && (
                    selectedPart?.controlledBy === part.id ||
                    !parts.some((spring) => spring.type === 'spring' && spring.id !== selectedPart?.id && spring.controlledBy === part.id)
                  ),
                )"
                :key="coil.id"
                :value="coil.id"
              >
                {{ coil.name }}
              </option>
            </select>
            <span class="block text-xs text-muted-foreground">一条线圈只能组装一个触点；绑定后形成可展开的继电器开关。</span>
          </label>
          <div
            v-if="selectedPart.type === 'spring' && selectedPart.controlledBy"
            class="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-xs text-teal-950"
          >
            <div class="font-medium">已组装：继电器开关</div>
            <div class="mt-1 text-teal-800">控制线圈：{{ parts.find((part) => part.id === selectedPart?.controlledBy)?.name ?? '缺失线圈' }}</div>
          </div>
          <div
            v-if="selectedPart?.type === 'coil' && parts.some((part) => part.type === 'spring' && part.controlledBy === selectedPart?.id)"
            class="rounded-md border border-teal-300 bg-teal-50 px-3 py-2 text-xs text-teal-950"
          >
            <div class="font-medium">已组装：继电器开关</div>
            <div class="mt-1 text-teal-800">输出触点：{{ parts.find((part) => part.type === 'spring' && part.controlledBy === selectedPart?.id)?.name }}</div>
          </div>
          <div
            v-if="isRelayAssembly(selectedPart)"
            class="space-y-2 rounded-md border border-cyan-200 bg-cyan-50 p-3"
          >
            <div class="text-xs font-medium text-cyan-950">下一层模块</div>
            <p class="text-xs leading-5 text-cyan-800">模块只会在当前课程的结构与行为验证全部通过后发布；课程外的验证用电源、开关、灯泡和导线不会带入模块核心。</p>
            <Button class="w-full" size="sm" :disabled="workbenchMode !== 'workshop' || !activeLesson.nextStage || !lessonComplete" @click="publishSelectedRelay(selectedPart)">
              <PackageCheck class="h-4 w-4" />
              {{ lessonComplete ? '发布当前模块' : '完成课程后可发布' }}
            </Button>
            <p v-if="relayPublishFeedback" class="text-xs leading-5 text-cyan-800">{{ relayPublishFeedback }}</p>
          </div>
          <div v-if="selectedPart.type === 'coil'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">吸合状态</span>
              <span class="font-medium" :class="simulation.coils[selectedPart.id]?.energized ? 'text-teal-700' : 'text-muted-foreground'">
                {{ simulation.coils[selectedPart.id]?.energized ? '已吸合' : '未吸合' }}
              </span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'led'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-muted-foreground">方向</span>
              <span class="font-medium" :class="ledStatus(selectedPart).reversed ? 'text-rose-700' : 'text-emerald-700'">
                {{ ledStatus(selectedPart).reversed ? "反接" : ledStatus(selectedPart).forward ? "正接" : "未接入" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">亮度</span>
              <span class="font-medium tabular-nums">{{ ledStatus(selectedPart).brightnessPercent }}%</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'diode'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1 text-muted-foreground">
                <TriangleRight class="h-3.5 w-3.5" />
                方向
              </span>
              <span class="font-medium" :class="diodeStatus(selectedPart).reversed ? 'text-rose-700' : 'text-emerald-700'">
                {{ diodeStatus(selectedPart).reversed ? "反向截止" : diodeStatus(selectedPart).forward ? "正向" : "未接入" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">状态</span>
              <span class="font-medium">{{ diodeStatus(selectedPart).conducting ? "导通" : "截止" }}</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'capacitor'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1 text-muted-foreground">
                <BatteryMedium class="h-3.5 w-3.5" />
                电压
              </span>
              <span class="font-medium tabular-nums">{{ capacitorStatus(selectedPart).voltage.toFixed(1) }} V</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">电荷</span>
              <span class="font-medium tabular-nums">{{ capacitorStatus(selectedPart).chargePercent }}%</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'ammeter'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="flex items-center gap-1 text-muted-foreground">
                <Activity class="h-3.5 w-3.5" />
                电流
              </span>
              <span class="font-medium tabular-nums">{{ ammeterStatus(selectedPart).currentMilliAmps }} mA</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">接入方式</span>
              <span class="font-medium">{{ ammeterStatus(selectedPart).active ? "串联测量" : "未导通" }}</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'voltmeter'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-muted-foreground">电压</span>
              <span class="font-medium tabular-nums">{{ voltmeterStatus(selectedPart).voltage.toFixed(1) }} V</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">接入方式</span>
              <span class="font-medium">{{ voltmeterStatus(selectedPart).active ? "并联测量" : "未接入" }}</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'buzzer'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-muted-foreground">状态</span>
              <span class="font-medium" :class="buzzerStatus(selectedPart).active ? 'text-sky-700' : 'text-muted-foreground'">
                {{ buzzerStatus(selectedPart).active ? "响铃" : "静音" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">强度</span>
              <span class="font-medium tabular-nums">{{ buzzerStatus(selectedPart).volumePercent }}%</span>
            </div>
          </div>
          <div v-if="selectedPart.type === 'motor'" class="rounded-md border bg-card px-3 py-2 text-xs">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-muted-foreground">状态</span>
              <span class="font-medium" :class="motorStatus(selectedPart).active ? 'text-emerald-700' : 'text-muted-foreground'">
                {{ motorStatus(selectedPart).active ? "转动" : "停止" }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">速度</span>
              <span class="font-medium tabular-nums">{{ motorStatus(selectedPart).speedPercent }}%</span>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="tab === 'selection' && selectedWire" class="rounded-md border border-amber-300 bg-amber-50 p-3">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium text-amber-950">选中导线</span>
          <Button variant="ghost" size="icon" title="断开导线" @click="removeWire(selectedWire.id)">
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
        <div class="space-y-3 text-sm">
          <div class="rounded-md border border-amber-200 bg-white/70 px-3 py-2 text-amber-950">
            {{ wireLabel(selectedWire) }}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" @click="startRewire(selectedWire.id, 'from')">
              <Cable class="h-4 w-4" />
              重接左端
            </Button>
            <Button variant="outline" size="sm" @click="startRewire(selectedWire.id, 'to')">
              <Cable class="h-4 w-4" />
              重接右端
            </Button>
          </div>
          <div v-if="rewiring" class="text-xs text-amber-800">
            正在重接{{ rewiring.end === "from" ? "左端" : "右端" }}，请点击新的端子。
          </div>
          <div v-else class="text-xs text-amber-800">
            拖动画布上这条线两端的圆点可重接；按住 Alt 拖动端点可从同一端子新建导线。
          </div>
        </div>
      </section>

      <section v-else-if="tab === 'selection'" class="rounded-md border border-dashed bg-background p-3">
        <p class="text-center text-sm text-muted-foreground">点击元器件或导线后，在这里检查状态并编辑属性。</p>
        <div v-if="wires.length" class="mt-4 border-t pt-3">
          <div class="mb-2 flex items-center justify-between">
            <div class="text-xs font-medium text-muted-foreground">导线</div>
            <span class="text-xs text-muted-foreground">{{ wires.length }}</span>
          </div>
          <div class="space-y-2">
            <button
              v-for="wire in wires"
              :key="wire.id"
              type="button"
              class="flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors"
              :class="selectedWireId === wire.id ? 'border-amber-300 bg-amber-50' : 'bg-background hover:bg-muted'"
              @click="selectWire(wire.id)"
            >
              <span class="truncate">{{ wireLabel(wire) }}</span>
              <Cable class="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </aside>
</template>
