import type { PersistedWorkspace, SavedWorkspaceRecord } from "@/lib/workspace-records";

export function isPersistedWorkspace(value: unknown): value is PersistedWorkspace {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedWorkspace>;
  return (
    candidate.version === 1 &&
    typeof candidate.activeLessonId === "string" &&
    typeof candidate.selectedPartId === "string" &&
    typeof candidate.savedAt === "string" &&
    typeof candidate.zoom === "number" &&
    Array.isArray(candidate.parts) &&
    Array.isArray(candidate.wires)
  );
}

export function isSavedWorkspaceRecord(value: unknown): value is SavedWorkspaceRecord {
  if (!isPersistedWorkspace(value)) {
    return false;
  }

  const candidate = value as Partial<SavedWorkspaceRecord>;
  return typeof candidate.id === "string" && typeof candidate.title === "string";
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
