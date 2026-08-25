import { ref, type Ref } from "vue";
import { base64UrlDecode, base64UrlEncode, formatSavedTime } from "@/lib/workspace-codec";
import type { PersistedWorkspace, SavedWorkspaceRecord } from "@/lib/workspace-records";

type Options = {
  isPersistedWorkspace: (value: unknown) => value is PersistedWorkspace;
  loadSnapshot: (workspace: PersistedWorkspace) => void;
  pushHistory: () => void;
  readLocalStorage: (key: string) => string | null;
  removeLocalStorage: (key: string) => void;
  saveSnapshot: () => PersistedWorkspace;
  saveToStorage: (workspace: PersistedWorkspace) => boolean;
  savedRecordsKey: string;
  savedWorkspaceKey: string;
  shareParam: string;
  writeLocalStorage: (key: string, value: string) => boolean;
  recoveryMessage: Ref<string>;
  lastSavedAt: Ref<string | null>;
};

export function useWorkspaceRecords(options: Options) {
  const recordTitle = ref("");
  const savedRecords = ref<SavedWorkspaceRecord[]>([]);
  const shareLinkState = ref<"copied" | "idle" | "manual">("idle");
  const sharedWorkspaceLoaded = ref(false);
  let shareLinkFeedbackTimer: number | null = null;

  function saveWorkspaceToStorage() {
    if (typeof window === "undefined") return;
    const workspace = options.saveSnapshot();
    if (options.saveToStorage(workspace)) options.lastSavedAt.value = workspace.savedAt;
  }

  function persistSavedRecords() {
    if (typeof window !== "undefined") {
      options.writeLocalStorage(options.savedRecordsKey, JSON.stringify(savedRecords.value));
    }
  }

  function loadSavedRecords() {
    if (typeof window === "undefined") return;
    const rawRecords = options.readLocalStorage(options.savedRecordsKey);
    if (!rawRecords) return;
    try {
      const records = JSON.parse(rawRecords) as unknown;
      if (!Array.isArray(records)) {
        savedRecords.value = [];
        options.removeLocalStorage(options.savedRecordsKey);
        return;
      }
      const nextRecords = records.filter((record): record is SavedWorkspaceRecord => {
        return typeof record === "object" && record !== null && "id" in record && "title" in record && options.isPersistedWorkspace(record);
      }).slice(0, 12);
      savedRecords.value = nextRecords;
      if (nextRecords.length !== records.length) persistSavedRecords();
    } catch {
      options.removeLocalStorage(options.savedRecordsKey);
    }
  }

  function saveWorkspaceRecord() {
    const snapshot = options.saveSnapshot();
    const title = recordTitle.value.trim() || `记录 ${formatSavedTime(snapshot.savedAt)}`;
    savedRecords.value = [{ ...snapshot, id: `record-${Date.now()}`, title }, ...savedRecords.value].slice(0, 12);
    recordTitle.value = "";
    persistSavedRecords();
    saveWorkspaceToStorage();
  }

  function downloadTextFile(filename: string, content: string, type: string) {
    if (typeof document === "undefined") return;
    const blob = new Blob([content], { type });
    const link = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    link.download = filename;
    link.href = objectUrl;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  }

  function exportWorkspaceJson() {
    const snapshot = options.saveSnapshot();
    downloadTextFile(`xshow-workspace-${new Date(snapshot.savedAt).toISOString().slice(0, 10)}.json`, JSON.stringify(snapshot, null, 2), "application/json");
  }

  function showShareLinkFeedback(state: "copied" | "manual") {
    shareLinkState.value = state;
    if (shareLinkFeedbackTimer) window.clearTimeout(shareLinkFeedbackTimer);
    shareLinkFeedbackTimer = window.setTimeout(() => {
      shareLinkState.value = "idle";
      shareLinkFeedbackTimer = null;
    }, state === "copied" ? 1800 : 3600);
  }

  async function copyWorkspaceShareLink() {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set(options.shareParam, base64UrlEncode(JSON.stringify(options.saveSnapshot())));
    const shareUrl = url.toString();
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(shareUrl);
      showShareLinkFeedback("copied");
    } catch {
      showShareLinkFeedback("manual");
      window.prompt("浏览器没有允许自动复制，请手动复制这个分享链接：", shareUrl);
    }
  }

  function restoreWorkspaceFromUrl() {
    if (typeof window === "undefined") return false;
    const encoded = new URL(window.location.href).searchParams.get(options.shareParam);
    if (!encoded) return false;
    try {
      const parsed = JSON.parse(base64UrlDecode(encoded)) as unknown;
      if (!options.isPersistedWorkspace(parsed)) {
        options.recoveryMessage.value = "分享链接中的工作台数据无效，已忽略该链接。";
        return false;
      }
      options.loadSnapshot(parsed);
      saveWorkspaceToStorage();
      sharedWorkspaceLoaded.value = true;
      return true;
    } catch {
      options.recoveryMessage.value = "分享链接无法读取，已忽略该链接。";
      return false;
    }
  }

  function restoreAutoSavedWorkspace() {
    if (typeof window === "undefined") return false;
    const rawWorkspace = options.readLocalStorage(options.savedWorkspaceKey);
    if (!rawWorkspace) return false;
    try {
      const workspace = JSON.parse(rawWorkspace) as unknown;
      if (options.isPersistedWorkspace(workspace)) {
        options.loadSnapshot(workspace);
        return true;
      }
      options.removeLocalStorage(options.savedWorkspaceKey);
      if (!options.recoveryMessage.value) options.recoveryMessage.value = "上次自动保存的数据不完整，已安全回退到默认工作台。";
    } catch {
      options.removeLocalStorage(options.savedWorkspaceKey);
      if (!options.recoveryMessage.value) options.recoveryMessage.value = "上次自动保存无法读取，已安全回退到默认工作台。";
    }
    return false;
  }

  async function importWorkspaceJson(event: Event, closePanel?: () => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!options.isPersistedWorkspace(parsed)) {
        window.alert("这个 JSON 文件不是有效的 xshow 工作台存档。");
        return;
      }
      options.pushHistory();
      options.loadSnapshot(parsed);
      options.recoveryMessage.value = "";
      saveWorkspaceToStorage();
      closePanel?.();
    } catch {
      window.alert("读取 JSON 存档失败，请检查文件内容。");
    }
  }

  function loadSavedRecord(record: SavedWorkspaceRecord) {
    options.pushHistory();
    options.loadSnapshot(record);
    options.recoveryMessage.value = "";
    saveWorkspaceToStorage();
  }

  function removeSavedRecord(recordId: string) {
    savedRecords.value = savedRecords.value.filter((record) => record.id !== recordId);
    persistSavedRecords();
  }

  return {
    copyWorkspaceShareLink,
    exportWorkspaceJson,
    importWorkspaceJson,
    lastSavedAt: options.lastSavedAt,
    loadSavedRecord,
    loadSavedRecords,
    recordTitle,
    removeSavedRecord,
    restoreAutoSavedWorkspace,
    restoreWorkspaceFromUrl,
    saveWorkspaceRecord,
    saveWorkspaceToStorage,
    savedRecords,
    shareLinkState,
    sharedWorkspaceLoaded,
  };
}
