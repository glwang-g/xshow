export type RepairTaskStatus = "completed" | "in-progress" | "not-started";

export type RepairProgressRecord = {
  completedAt?: string;
  completions: number;
  lastOpenedAt: string;
  levelId: string;
  startedAt: string;
  status: Exclude<RepairTaskStatus, "not-started">;
};

export type RepairProgressState = {
  currentLevelId?: string;
  records: Record<string, RepairProgressRecord>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isIsoDateString(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isRepairRecord(value: unknown, levelId: string): value is RepairProgressRecord {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.levelId !== levelId ||
    (value.status !== "completed" && value.status !== "in-progress") ||
    !isIsoDateString(value.startedAt) ||
    !isIsoDateString(value.lastOpenedAt) ||
    typeof value.completions !== "number" ||
    !Number.isInteger(value.completions) ||
    value.completions < 0
  ) {
    return false;
  }

  return value.completedAt === undefined || isIsoDateString(value.completedAt);
}

export function sanitizeRepairProgressState(
  value: unknown,
  validLevelIds: ReadonlySet<string>,
): RepairProgressState {
  if (!isRecord(value) || !isRecord(value.records)) {
    return { records: {} };
  }

  const records: Record<string, RepairProgressRecord> = {};
  for (const [levelId, record] of Object.entries(value.records)) {
    if (validLevelIds.has(levelId) && isRepairRecord(record, levelId)) {
      records[levelId] = record;
    }
  }

  return {
    currentLevelId:
      typeof value.currentLevelId === "string" && validLevelIds.has(value.currentLevelId)
        ? value.currentLevelId
        : undefined,
    records,
  };
}
