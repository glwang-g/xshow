import { computed, type Ref } from "vue";
import { formatSavedTime } from "@/lib/workspace-codec";
import type { CloudAuthMode, CloudSyncStatus } from "@/lib/workspace-records";

export function useCloudWorkspaceView(options: {
  activeRecordId: Ref<string | null>;
  authBusy: Ref<boolean>;
  authMode: Ref<CloudAuthMode>;
  configured: boolean;
  lastSyncedAt: Ref<string | null>;
  recordsBusy: Ref<boolean>;
  syncStatus: Ref<CloudSyncStatus>;
  userEmail: Ref<string | null>;
}) {
  const syncState = computed(() => {
    if (!options.configured) return "unconfigured" as const;
    if (!options.userEmail.value) return "configured" as const;
    return options.syncStatus.value === "idle" ? "signed-in" as const : options.syncStatus.value;
  });

  const syncLabel = computed(() => ({
    configured: "未登录", failed: "同步失败", "local-changes": "本地修改", "signed-in": "已登录",
    syncing: "同步中", synced: "已同步", unconfigured: "未配置",
  })[syncState.value]);

  const syncDescription = computed(() => {
    if (syncState.value === "unconfigured") return "配置 Supabase 后可开启云端记录，本地玩法不受影响。";
    if (syncState.value === "configured") return "使用邮箱和密码登录后，可跨设备保存实验记录。";
    if (syncState.value === "local-changes") return "当前工作台已有本地修改，保存到云端后可在其他设备继续。";
    if (syncState.value === "syncing") return "正在和云端记录同步。";
    if (syncState.value === "synced") return options.lastSyncedAt.value ? `最近同步：${formatSavedTime(options.lastSyncedAt.value)}` : "当前工作台已保存到云端。";
    if (syncState.value === "failed") return "刚才的云端操作失败了，本地工作台仍会自动保存。";
    return "可以保存到云端记录，并在其他设备登录后继续。";
  });

  const syncBadgeClass = computed(() => {
    if (syncState.value === "synced") return "bg-emerald-100 text-emerald-800";
    if (syncState.value === "local-changes" || syncState.value === "syncing") return "bg-amber-100 text-amber-900";
    if (syncState.value === "signed-in" || syncState.value === "configured") return "bg-cyan-100 text-cyan-800";
    if (syncState.value === "failed") return "bg-rose-100 text-rose-800";
    return "bg-muted text-muted-foreground";
  });

  const authTitle = computed(() => ({
    "sign-up": "创建云端账号", reset: "重置密码", "update-password": "设置新密码", "sign-in": "登录云端同步",
  })[options.authMode.value]);
  const authSubmitLabel = computed(() => {
    if (options.authBusy.value) return "处理中";
    return ({ "sign-up": "注册并登录", reset: "发送重置邮件", "update-password": "更新密码", "sign-in": "登录" })[options.authMode.value];
  });
  const authHelpText = computed(() => ({
    "sign-up": "注册后 Supabase 可能会发送确认邮件；确认后即可用密码登录。",
    reset: "输入账号邮箱，我们会发送一封密码重置邮件。",
    "update-password": "请输入新密码。更新后，下次就可以直接用邮箱和新密码登录。",
    "sign-in": "登录状态会保存在当前浏览器中，下次打开会自动恢复。",
  })[options.authMode.value]);
  const saveLabel = computed(() => options.recordsBusy.value ? "处理中" : options.activeRecordId.value ? "更新云端" : "保存云端");

  return { authHelpText, authSubmitLabel, authTitle, saveLabel, syncBadgeClass, syncDescription, syncLabel, syncState };
}
