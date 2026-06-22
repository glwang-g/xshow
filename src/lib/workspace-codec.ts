import { partTypes } from "@/lib/circuit";
import type { PersistedWorkspace, SavedWorkspaceRecord } from "@/lib/workspace-records";

export type ValidCloudWorkspaceRecord = {
  created_at: string;
  id: string;
  title: string;
  updated_at: string;
  workspace: PersistedWorkspace;
};

const allowedPartTypes = new Set<string>(partTypes);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

function isTerminalKey(value: unknown) {
  return value === "a" || value === "b";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateString(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isTerminalRef(value: unknown, partIds: Set<string>) {
  if (!isRecord(value)) {
    return false;
  }

  const partId = value.partId;
  return isNonEmptyString(partId) && partIds.has(partId) && isTerminalKey(value.terminal);
}

function isWorkspacePart(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.name) ||
    typeof value.type !== "string" ||
    !allowedPartTypes.has(value.type) ||
    !isFiniteNumber(value.x) ||
    !isFiniteNumber(value.y)
  ) {
    return false;
  }

  if (value.closed !== undefined && typeof value.closed !== "boolean") {
    return false;
  }

  if (value.polarity !== undefined && value.polarity !== "normal" && value.polarity !== "reversed") {
    return false;
  }

  if (value.resistance !== undefined && !isFiniteNumber(value.resistance)) {
    return false;
  }

  if (value.rotation !== undefined && !isFiniteNumber(value.rotation)) {
    return false;
  }

  return true;
}

function isWorkspaceWire(value: unknown, partIds: Set<string>) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isTerminalRef(value.from, partIds) &&
    isTerminalRef(value.to, partIds)
  );
}

export function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  if (!isRecord(value)) {
    return false;
  }

  const candidate = value as Partial<PersistedWorkspace>;
  if (
    candidate.version !== 1 ||
    typeof candidate.activeLessonId !== "string" ||
    typeof candidate.selectedPartId !== "string" ||
    !isIsoDateString(candidate.savedAt) ||
    !isFiniteNumber(candidate.zoom) ||
    !Array.isArray(candidate.parts) ||
    !Array.isArray(candidate.wires)
  ) {
    return false;
  }

  if (!candidate.parts.every(isWorkspacePart)) {
    return false;
  }

  const partIds = new Set(candidate.parts.map((part) => part.id));
  if (candidate.selectedPartId && !partIds.has(candidate.selectedPartId)) {
    return false;
  }

  if (partIds.size !== candidate.parts.length) {
    return false;
  }

  const wireIds = new Set<string>();
  for (const wire of candidate.wires) {
    if (!isWorkspaceWire(wire, partIds) || wireIds.has(wire.id)) {
      return false;
    }

    wireIds.add(wire.id);
  }

  return true;
}

export function isSavedWorkspaceRecord(value: unknown): value is SavedWorkspaceRecord {
  if (!isPersistedWorkspace(value)) {
    return false;
  }

  const candidate = value as Partial<SavedWorkspaceRecord>;
  return isNonEmptyString(candidate.id) && isNonEmptyString(candidate.title);
}

export function isCloudWorkspaceRecord(value: unknown): value is ValidCloudWorkspaceRecord {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.title) &&
    isIsoDateString(value.created_at) &&
    isIsoDateString(value.updated_at) &&
    isPersistedWorkspace(value.workspace)
  );
}

export function sanitizeCloudWorkspaceRecords(value: unknown) {
  if (!Array.isArray(value)) {
    return {
      droppedCount: 0,
      records: [] as ValidCloudWorkspaceRecord[],
    };
  }

  const records = value.filter(isCloudWorkspaceRecord);
  return {
    droppedCount: value.length - records.length,
    records,
  };
}

export function formatSavedTime(savedAt: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(savedAt));
}

export function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
