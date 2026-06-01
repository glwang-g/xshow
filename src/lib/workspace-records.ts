import type { LessonWorkspace } from "@/data/lessons";

export type PersistedWorkspace = LessonWorkspace & {
  activeLessonId: string;
  savedAt: string;
  version: 1;
};

export type SavedWorkspaceRecord = PersistedWorkspace & {
  id: string;
  title: string;
};

export type CloudAuthMode = "reset" | "sign-in" | "sign-up" | "update-password";
export type CloudSyncState = "configured" | "failed" | "local-changes" | "signed-in" | "synced" | "syncing" | "unconfigured";
export type CloudSyncStatus = "failed" | "idle" | "local-changes" | "synced" | "syncing";

export type SaveCloudWorkspaceOptions = {
  forceOverwrite?: boolean;
  saveAsCopy?: boolean;
};
