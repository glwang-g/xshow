import { computed, ref } from "vue";
import { repairLevelPresets, type RepairLevel } from "@/lib/repair-lab";
import {
  sanitizeRepairProgressState,
  type RepairProgressRecord,
  type RepairProgressState,
  type RepairTaskStatus,
} from "@/lib/repair-progress-codec";
export type { RepairProgressRecord, RepairProgressState, RepairTaskStatus } from "@/lib/repair-progress-codec";

const storageKey = "xshow.repair-progress.v1";
const validLevelIds = new Set(repairLevelPresets.map((level) => level.id));

function isValidLevelId(levelId: string | undefined): levelId is string {
  return Boolean(levelId && validLevelIds.has(levelId));
}

function nowIso() {
  return new Date().toISOString();
}

function levelById(levelId: string | undefined) {
  return repairLevelPresets.find((level) => level.id === levelId);
}

function loadState(): RepairProgressState {
  if (typeof window === "undefined") {
    return { records: {} };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? sanitizeRepairProgressState(JSON.parse(raw) as unknown, validLevelIds) : { records: {} };
  } catch {
    return { records: {} };
  }
}

const state = ref<RepairProgressState>(loadState());

function saveState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state.value));
  } catch {
    // Progress is helpful, but the repair lab should keep working if browser storage is unavailable.
  }
}

function updateRecord(levelId: string, mutator: (record: RepairProgressRecord | undefined) => RepairProgressRecord) {
  if (!isValidLevelId(levelId)) {
    return;
  }

  state.value = {
    currentLevelId: levelId,
    records: {
      ...state.value.records,
      [levelId]: mutator(state.value.records[levelId]),
    },
  };
  saveState();
}

function markRepairStarted(levelId: string | undefined) {
  if (!isValidLevelId(levelId)) {
    return;
  }

  const openedAt = nowIso();
  updateRecord(levelId, (record) => ({
    completedAt: record?.completedAt,
    completions: record?.completions ?? 0,
    lastOpenedAt: openedAt,
    levelId,
    startedAt: record?.startedAt ?? openedAt,
    status: record?.status === "completed" ? "completed" : "in-progress",
  }));
}

function markRepairCompleted(levelId: string | undefined) {
  if (!isValidLevelId(levelId)) {
    return;
  }

  const completedAt = nowIso();
  updateRecord(levelId, (record) => ({
    completedAt,
    completions: record?.status === "completed" ? record.completions : (record?.completions ?? 0) + 1,
    lastOpenedAt: completedAt,
    levelId,
    startedAt: record?.startedAt ?? completedAt,
    status: "completed",
  }));
}

function repairTaskStatus(levelId: string | undefined): RepairTaskStatus {
  if (!isValidLevelId(levelId)) {
    return "not-started";
  }

  return state.value.records[levelId]?.status ?? "not-started";
}

function repairTaskStatusLabel(levelId: string | undefined) {
  const status = repairTaskStatus(levelId);

  if (status === "completed") {
    return "已完成";
  }

  if (status === "in-progress") {
    return "维修中";
  }

  return "未开始";
}

const hasCurrentRepair = computed(() => isValidLevelId(state.value.currentLevelId));
const currentLevelId = computed(() => {
  if (isValidLevelId(state.value.currentLevelId)) {
    return state.value.currentLevelId;
  }

  return repairLevelPresets.find((level) => repairTaskStatus(level.id) !== "completed")?.id ?? repairLevelPresets[0]?.id;
});
const currentLevel = computed(() => levelById(currentLevelId.value) ?? repairLevelPresets[0]);
const missionCount = computed(() => repairLevelPresets.length);
const completedCount = computed(
  () => repairLevelPresets.filter((level) => repairTaskStatus(level.id) === "completed").length,
);
const progressPercent = computed(() => {
  if (missionCount.value === 0) {
    return 0;
  }

  return Math.round((completedCount.value / missionCount.value) * 100);
});
const nextRepairLevel = computed<RepairLevel | undefined>(() => {
  return repairLevelPresets.find((level) => repairTaskStatus(level.id) !== "completed" && level.id !== currentLevelId.value);
});
const recentActivity = computed(() => {
  return Object.values(state.value.records)
    .map((record) => ({
      ...record,
      level: levelById(record.levelId),
    }))
    .filter((record): record is RepairProgressRecord & { level: RepairLevel } => Boolean(record.level))
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
    .slice(0, 3);
});

export function useRepairProgress() {
  return {
    completedCount,
    currentLevel,
    currentLevelId,
    hasCurrentRepair,
    markRepairCompleted,
    markRepairStarted,
    missionCount,
    nextRepairLevel,
    progressPercent,
    recentActivity,
    repairTaskStatus,
    repairTaskStatusLabel,
  };
}
