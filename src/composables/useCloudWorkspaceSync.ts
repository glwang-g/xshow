import { computed, nextTick, ref, type Ref } from "vue";
import {
  cloudConfig,
  deleteCloudWorkspaceRecord,
  getCloudUser,
  listCloudWorkspaceRecords,
  onCloudAuthStateChange,
  renameCloudWorkspaceRecord,
  saveCloudWorkspaceRecord,
  sendPasswordResetEmail,
  signInWithEmailPassword,
  signOutCloud,
  signUpWithEmailPassword,
  updateCloudPassword,
  updateCloudWorkspaceRecord,
  type CloudWorkspaceRecord,
} from "@/lib/cloud";
import type { CloudAuthMode, CloudSyncStatus, PersistedWorkspace, SaveCloudWorkspaceOptions } from "@/lib/workspace-records";
import { formatSavedTime, isPersistedWorkspace, sanitizeCloudWorkspaceRecords } from "@/lib/workspace-codec";

type CloudRecord = CloudWorkspaceRecord<PersistedWorkspace>;
type Options = {
  lastSavedWorkspace: () => PersistedWorkspace;
  loadWorkspaceSnapshot: (workspace: PersistedWorkspace) => void;
  localRecordTitle: Ref<string>;
  readLocalStorage: (key: string) => string | null;
  saveWorkspaceToStorage: () => void;
  sharedWorkspaceLoaded: Ref<boolean>;
  workspaceRecoveryMessage: Ref<string>;
  pushEditorHistory: () => void;
};

const cloudUploadSuggestionKeyPrefix = "xshow.cloud.upload-suggestion.v1";

export function useCloudWorkspaceSync(options: Options) {
  const cloudAuthBusy = ref(false);
  const cloudAuthError = ref("");
  const cloudAuthMode = ref<CloudAuthMode>("sign-in");
  const cloudAuthMessage = ref("");
  const cloudEmail = ref("");
  const cloudPassword = ref("");
  const cloudPasswordConfirm = ref("");
  const cloudRecordTitle = ref("");
  const cloudRecords = ref<CloudRecord[]>([]);
  const cloudRecordsBusy = ref(false);
  const cloudRecordsError = ref("");
  const cloudRecordsMessage = ref("");
  const cloudPendingSnapshot = ref<PersistedWorkspace | null>(null);
  const cloudPendingTitle = ref("");
  const cloudShouldSuggestInitialUpload = ref(false);
  const cloudSyncStatus = ref<CloudSyncStatus>("idle");
  const cloudActiveRecordId = ref<string | null>(null);
  const cloudLastSyncedAt = ref<string | null>(null);
  const cloudUserEmail = ref<string | null>(null);
  const activeCloudRecord = computed(() => cloudRecords.value.find((record) => record.id === cloudActiveRecordId.value));
  let unsubscribe: (() => void) | null = null;

  function clearCloudConflict() {
    cloudPendingSnapshot.value = null;
    cloudPendingTitle.value = "";
  }

  function cloudUploadSuggestionKey() {
    return cloudUserEmail.value ? `${cloudUploadSuggestionKeyPrefix}.${cloudUserEmail.value}` : cloudUploadSuggestionKeyPrefix;
  }

  function dismissCloudInitialUploadSuggestion() {
    cloudShouldSuggestInitialUpload.value = false;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(cloudUploadSuggestionKey(), "dismissed");
    }
  }

  async function loadCloudRecords() {
    if (!cloudConfig.configured || !cloudUserEmail.value) {
      cloudRecords.value = [];
      return;
    }
    cloudRecordsBusy.value = true;
    cloudRecordsError.value = "";
    try {
      const { droppedCount, records } = sanitizeCloudWorkspaceRecords(await listCloudWorkspaceRecords<PersistedWorkspace>());
      cloudRecords.value = records;
      if (droppedCount > 0) cloudRecordsError.value = `已忽略 ${droppedCount} 条无效云端记录。`;
      cloudShouldSuggestInitialUpload.value = cloudRecords.value.length === 0 && !cloudActiveRecordId.value && !options.readLocalStorage(cloudUploadSuggestionKey());
    } catch (error) {
      cloudSyncStatus.value = "failed";
      cloudRecordsError.value = error instanceof Error ? error.message : "读取云端记录失败。";
    } finally {
      cloudRecordsBusy.value = false;
    }
  }

  async function refreshCloudUser() {
    if (!cloudConfig.configured) return;
    try {
      const user = await getCloudUser();
      cloudUserEmail.value = user?.email ?? null;
      if (user) {
        void loadCloudRecords();
      } else {
        resetCloudState();
      }
    } catch (error) {
      cloudAuthError.value = error instanceof Error ? error.message : "读取登录状态失败。";
    }
  }

  function resetCloudState() {
    cloudUserEmail.value = null;
    cloudRecords.value = [];
    cloudActiveRecordId.value = null;
    cloudLastSyncedAt.value = null;
    cloudRecordTitle.value = "";
    cloudShouldSuggestInitialUpload.value = false;
    clearCloudConflict();
    cloudSyncStatus.value = "idle";
  }

  function setCloudAuthMode(mode: CloudAuthMode) {
    cloudAuthMode.value = mode;
    cloudAuthError.value = "";
    cloudAuthMessage.value = "";
    cloudPassword.value = "";
    cloudPasswordConfirm.value = "";
  }

  function validateCloudPassword(requireConfirm = false) {
    if (!cloudPassword.value) { cloudAuthError.value = "请输入密码。"; return false; }
    if (cloudPassword.value.length < 6) { cloudAuthError.value = "密码至少需要 6 位。"; return false; }
    if (requireConfirm && cloudPassword.value !== cloudPasswordConfirm.value) { cloudAuthError.value = "两次输入的密码不一致。"; return false; }
    return true;
  }

  async function requestCloudAuth() {
    const email = cloudEmail.value.trim();
    cloudAuthError.value = "";
    cloudAuthMessage.value = "";
    if (!cloudConfig.configured) { cloudAuthError.value = "还没有配置 Supabase 环境变量。"; return; }
    if (cloudAuthMode.value !== "update-password" && !email) { cloudAuthError.value = "请输入邮箱地址。"; return; }
    if (cloudAuthMode.value === "sign-in" && !validateCloudPassword()) return;
    if (cloudAuthMode.value === "sign-up" && !validateCloudPassword(true)) return;
    if (cloudAuthMode.value === "update-password" && !validateCloudPassword(true)) return;
    cloudAuthBusy.value = true;
    try {
      if (cloudAuthMode.value === "sign-in") {
        await signInWithEmailPassword(email, cloudPassword.value);
        cloudPassword.value = ""; cloudPasswordConfirm.value = ""; cloudAuthMessage.value = "已登录云端同步。"; await refreshCloudUser(); return;
      }
      if (cloudAuthMode.value === "sign-up") {
        await signUpWithEmailPassword(email, cloudPassword.value);
        cloudPassword.value = ""; cloudPasswordConfirm.value = ""; cloudAuthMessage.value = "账号已创建。如果收到确认邮件，请先完成邮箱确认。"; cloudAuthMode.value = "sign-in"; await refreshCloudUser(); return;
      }
      if (cloudAuthMode.value === "reset") {
        await sendPasswordResetEmail(email); cloudAuthMessage.value = "密码重置邮件已发送，请检查邮箱。"; cloudAuthMode.value = "sign-in"; return;
      }
      await updateCloudPassword(cloudPassword.value);
      cloudPassword.value = ""; cloudPasswordConfirm.value = ""; cloudAuthMode.value = "sign-in"; cloudAuthMessage.value = "密码已更新。";
    } catch (error) {
      cloudAuthError.value = error instanceof Error ? error.message : "云端账号操作失败。";
    } finally {
      cloudAuthBusy.value = false;
    }
  }

  function getCloudRecordTitle(snapshot: PersistedWorkspace) {
    return (cloudRecordTitle.value.trim() || activeCloudRecord.value?.title || options.localRecordTitle.value.trim() || `云端记录 ${formatSavedTime(snapshot.savedAt)}`).slice(0, 120);
  }

  function upsertCloudRecord(record: CloudRecord) {
    cloudRecords.value = [record, ...cloudRecords.value.filter((item) => item.id !== record.id)].slice(0, 20);
    cloudActiveRecordId.value = record.id;
    cloudLastSyncedAt.value = record.updated_at;
    cloudRecordTitle.value = record.title;
  }

  async function saveWorkspaceToCloud(saveOptions: SaveCloudWorkspaceOptions = {}) {
    if (!cloudUserEmail.value) { cloudRecordsError.value = "请先登录云端同步。"; return; }
    cloudRecordsBusy.value = true; cloudRecordsError.value = ""; cloudRecordsMessage.value = ""; cloudSyncStatus.value = "syncing";
    try {
      const snapshot = cloudPendingSnapshot.value && (saveOptions.forceOverwrite || saveOptions.saveAsCopy) ? cloudPendingSnapshot.value : options.lastSavedWorkspace();
      const title = cloudPendingTitle.value && (saveOptions.forceOverwrite || saveOptions.saveAsCopy) ? cloudPendingTitle.value : getCloudRecordTitle(snapshot);
      const shouldUpdate = Boolean(cloudActiveRecordId.value && !saveOptions.saveAsCopy);
      const record = shouldUpdate
        ? await updateCloudWorkspaceRecord<PersistedWorkspace>(cloudActiveRecordId.value as string, title, snapshot, saveOptions.forceOverwrite ? undefined : cloudLastSyncedAt.value ?? undefined)
        : await saveCloudWorkspaceRecord(title, snapshot);
      if (!record) {
        cloudPendingSnapshot.value = snapshot; cloudPendingTitle.value = title; await loadCloudRecords(); cloudSyncStatus.value = "failed"; cloudRecordsError.value = "云端记录已在其他设备更新。请选择覆盖云端，或另存为副本。"; return;
      }
      upsertCloudRecord(record); clearCloudConflict(); if (cloudShouldSuggestInitialUpload.value) dismissCloudInitialUploadSuggestion(); options.sharedWorkspaceLoaded.value = false; cloudSyncStatus.value = "synced"; cloudRecordsMessage.value = shouldUpdate ? "已更新云端记录。" : "已保存到云端。";
    } catch (error) {
      cloudSyncStatus.value = "failed"; cloudRecordsError.value = error instanceof Error ? error.message : "保存云端记录失败。";
    } finally { cloudRecordsBusy.value = false; }
  }

  function loadCloudRecord(record: CloudRecord) {
    cloudRecordsError.value = ""; cloudRecordsMessage.value = "";
    if (!isPersistedWorkspace(record.workspace)) { cloudSyncStatus.value = "failed"; cloudRecordsError.value = "这条云端记录不是有效的工作台存档。"; return; }
    cloudSyncStatus.value = "syncing"; options.pushEditorHistory(); options.loadWorkspaceSnapshot(record.workspace); options.workspaceRecoveryMessage.value = ""; options.saveWorkspaceToStorage(); cloudActiveRecordId.value = record.id; cloudLastSyncedAt.value = record.updated_at; cloudRecordTitle.value = record.title; clearCloudConflict(); cloudRecordsMessage.value = `已加载 ${record.title}`;
    void nextTick(() => { cloudSyncStatus.value = "synced"; });
  }

  async function renameCloudRecord(record: CloudRecord) {
    if (typeof window === "undefined") return;
    const nextTitle = window.prompt("新的云端记录名称：", record.title)?.trim().slice(0, 120);
    if (!nextTitle || nextTitle === record.title) return;
    cloudRecordsBusy.value = true; cloudRecordsError.value = ""; cloudRecordsMessage.value = ""; cloudSyncStatus.value = "syncing";
    try {
      const updatedRecord = await renameCloudWorkspaceRecord<PersistedWorkspace>(record.id, nextTitle);
      cloudRecords.value = cloudRecords.value.map((item) => item.id === updatedRecord.id ? updatedRecord : item);
      if (cloudActiveRecordId.value === updatedRecord.id) { cloudLastSyncedAt.value = updatedRecord.updated_at; cloudSyncStatus.value = "synced"; }
      else cloudSyncStatus.value = "idle";
      cloudRecordsMessage.value = "云端记录已重命名。";
    } catch (error) { cloudSyncStatus.value = "failed"; cloudRecordsError.value = error instanceof Error ? error.message : "重命名云端记录失败。"; }
    finally { cloudRecordsBusy.value = false; }
  }

  async function removeCloudRecord(recordId: string) {
    cloudRecordsBusy.value = true; cloudRecordsError.value = ""; cloudRecordsMessage.value = ""; cloudSyncStatus.value = "syncing";
    try {
      await deleteCloudWorkspaceRecord(recordId); cloudRecords.value = cloudRecords.value.filter((record) => record.id !== recordId);
      if (cloudActiveRecordId.value === recordId) { cloudActiveRecordId.value = null; cloudLastSyncedAt.value = null; cloudRecordTitle.value = ""; cloudShouldSuggestInitialUpload.value = false; clearCloudConflict(); cloudSyncStatus.value = "local-changes"; } else cloudSyncStatus.value = "idle";
      cloudRecordsMessage.value = "云端记录已删除。";
    } catch (error) { cloudSyncStatus.value = "failed"; cloudRecordsError.value = error instanceof Error ? error.message : "删除云端记录失败。"; }
    finally { cloudRecordsBusy.value = false; }
  }

  async function handleCloudSignOut() {
    cloudAuthError.value = ""; cloudAuthMessage.value = ""; cloudAuthBusy.value = true;
    try { await signOutCloud(); resetCloudState(); cloudPassword.value = ""; cloudPasswordConfirm.value = ""; cloudAuthMode.value = "sign-in"; cloudAuthMessage.value = "已退出云端同步。"; }
    catch (error) { cloudAuthError.value = error instanceof Error ? error.message : "退出登录失败。"; }
    finally { cloudAuthBusy.value = false; }
  }

  function startCloudAuthSession() {
    if (!cloudConfig.configured) return;
    void refreshCloudUser();
    unsubscribe = onCloudAuthStateChange((user, event) => {
      cloudUserEmail.value = user?.email ?? null;
      if (user) {
        if (event === "PASSWORD_RECOVERY") { cloudAuthMode.value = "update-password"; cloudAuthMessage.value = "请设置一个新密码。"; }
        else if (cloudAuthMode.value !== "update-password") cloudAuthMode.value = "sign-in";
        void loadCloudRecords();
      } else { resetCloudState(); cloudAuthMode.value = "sign-in"; }
    });
  }

  function stopCloudAuthSession() { unsubscribe?.(); unsubscribe = null; }

  return {
    activeCloudRecord, cloudActiveRecordId, cloudAuthBusy, cloudAuthError, cloudAuthMessage, cloudAuthMode, cloudConfig,
    cloudEmail, cloudLastSyncedAt, cloudPassword, cloudPasswordConfirm, cloudPendingSnapshot, cloudPendingTitle, cloudRecordTitle, cloudRecords,
    cloudRecordsBusy, cloudRecordsError, cloudRecordsMessage, cloudShouldSuggestInitialUpload, cloudSyncStatus, cloudUserEmail,
    dismissCloudInitialUploadSuggestion, handleCloudSignOut, loadCloudRecord, loadCloudRecords, removeCloudRecord, renameCloudRecord,
    requestCloudAuth, refreshCloudUser, saveWorkspaceToCloud, setCloudAuthMode, startCloudAuthSession, stopCloudAuthSession,
  };
}
