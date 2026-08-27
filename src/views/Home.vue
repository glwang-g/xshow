<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import WorkbenchCanvas from "@/components/workbench/WorkbenchCanvas.vue";
import WorkbenchHeader from "@/components/workbench/WorkbenchHeader.vue";
import { useWorkbenchHistory } from "@/composables/useWorkbenchHistory";
import { useWireInteraction } from "@/composables/useWireInteraction";
import { useCanvasViewportGesture } from "@/composables/useCanvasViewportGesture";
import { useWorkspaceRecords } from "@/composables/useWorkspaceRecords";
import { useCloudWorkspaceSync } from "@/composables/useCloudWorkspaceSync";
import { useWorkbenchParts } from "@/composables/useWorkbenchParts";
import { useWorkbenchPartMovement } from "@/composables/useWorkbenchPartMovement";
import { useWorkbenchWirePresentation } from "@/composables/useWorkbenchWirePresentation";
import { useCircuitStatusView } from "@/composables/useCircuitStatusView";
import { useCircuitLessonChecks } from "@/composables/useCircuitLessonChecks";
import { useWorkbenchSelection } from "@/composables/useWorkbenchSelection";
import { useWorkbenchKeyboard } from "@/composables/useWorkbenchKeyboard";
import { useMobileWorkbenchStarter } from "@/composables/useMobileWorkbenchStarter";
import { useMobileWorkbenchSizing } from "@/composables/useMobileWorkbenchSizing";
import { useMobileWorkbenchViewport } from "@/composables/useMobileWorkbenchViewport";
import { lessonCatalog, type LessonWorkspace } from "@/data/lessons";
import {
  batteryPolarity,
  evaluateCircuit,
  type CircuitPart,
  type PartType,
  type TerminalKey,
  type TerminalRef,
  type Wire,
  type WireEnd,
} from "@/lib/circuit";
import {
  cloudConfig,
} from "@/lib/cloud";
import { getSpec, partSpecs, workbench } from "@/lib/workbench-ui";
import {
  type CloudSyncState,
  type PersistedWorkspace,
} from "@/lib/workspace-records";
import {
  formatSavedTime,
  isPersistedWorkspace,
} from "@/lib/workspace-codec";
import { useExperimentReport } from "@/composables/useExperimentReport";
import type { PhysicalBuildPlan } from "@/lib/physical-build";
import { useWorkbenchImageExport } from "@/composables/useWorkbenchImageExport";
import { useWorkbenchPartPresentation } from "@/composables/useWorkbenchPartPresentation";
import { loadPublishedRelayModules, renamePublishedRelayModule, type PublishedRelayModule } from "@/lib/published-modules";
import { useRelayPublication } from "@/composables/useRelayPublication";
import { useCloudWorkspaceView } from "@/composables/useCloudWorkspaceView";
import { useBeginnerGuide } from "@/composables/useBeginnerGuide";
import { useWorkbenchWorkspaceState } from "@/composables/useWorkbenchWorkspaceState";
import { useWorkbenchNavigation } from "@/composables/useWorkbenchNavigation";
import { useWorkbenchAutosave } from "@/composables/useWorkbenchAutosave";
import { useWorkbenchGeometry } from "@/composables/useWorkbenchGeometry";
import { useWorkbenchPointerInteraction } from "@/composables/useWorkbenchPointerInteraction";
import { useWorkbenchCircuitView } from "@/composables/useWorkbenchCircuitView";
import { usePwaUpdate } from "@/composables/usePwaUpdate";
import { useWorkbenchWindowLifecycle } from "@/composables/useWorkbenchWindowLifecycle";
import { useSafeLocalStorage } from "@/composables/useSafeLocalStorage";
import { useWorkbenchPanels } from "@/composables/useWorkbenchPanels";
import { useWorkbenchLessonTargets } from "@/composables/useWorkbenchLessonTargets";
import { useBoardStore } from "@/stores/board";

// The canvas and header are needed immediately. The palette and side panel
// are opened on demand, so keeping them async reduces the first workbench
// transfer without changing any editor interaction.
const ComponentPalette = defineAsyncComponent(() => import("@/components/workbench/ComponentPalette.vue"));
const StatusPanel = defineAsyncComponent(() => import("@/components/workbench/StatusPanel.vue"));

type WorkbenchBounds = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

const savedWorkspaceKey = "xshow.workspace.v1";
const savedRecordsKey = "xshow.workspace.records.v1";
const guideAssistantDismissedKey = "xshow.guide-assistant.dismissed.v1";
const maxEditorHistoryEntries = 40;
const workspaceShareParam = "workspace";
const githubRepositoryUrl = "https://github.com/glwang-g/xshow";
const icpRecordNumber = "京ICP备2026031619号-1";
const icpRecordUrl = "https://beian.miit.gov.cn/";
const mobileWorkbenchBase = {
  width: workbench.width,
  height: workbench.height,
};
const mobileFitPadding = {
  bottomControls: 112,
  horizontal: 24,
};
const hiddenPhysicalBuildPlan: PhysicalBuildPlan = { connections: [], items: [], ready: false, summary: "", warnings: [] };
const board = useBoardStore();
const localStorage = useSafeLocalStorage();
const { read: readLocalStorage, remove: removeLocalStorage, write: writeLocalStorage } = localStorage;
const pwaUpdate = usePwaUpdate();
const { apply: applyPwaUpdate, dismiss: dismissPwaUpdate, registration: pwaUpdateRegistration } = pwaUpdate;
const route = useRoute();
const workbenchMode = computed<"free" | "workshop">(() => route.name === "workbench-workshop" ? "workshop" : "free");
const publishedModules = ref<PublishedRelayModule[]>(loadPublishedRelayModules());
const {
  endPointerGesture: endCanvasGesture,
  handlePointerDown: handleCanvasPointerDown,
  handlePointerMove: handleCanvasPointerMove,
  setViewportElement: setCanvasViewportElement,
  updateViewportSize: updateCanvasViewportSize,
  viewportRef: canvasViewportRef,
  viewportSize: canvasViewportSize,
} = useCanvasViewportGesture({
  getZoom: () => board.zoom,
  initialSize: { height: workbench.height, width: workbench.width },
  isDesktopViewport,
  setZoom: (value) => board.setZoom(value),
});
const workbenchRef = ref<HTMLElement | null>(null);
const desktopViewport = ref(isDesktopViewport());
const activeLessonId = ref(lessonCatalog[0].id);
const workspaceRecoveryMessage = ref("");
const lastSavedAt = ref<string | null>(null);
const selectedPartId = ref("bulb-1");
const mobileWorkbenchSize = ref({ ...mobileWorkbenchBase });
const mobileStarter = useMobileWorkbenchStarter({
  getSpec: (partType) => getSpec(partType),
  isDesktopViewport,
  viewportRef: canvasViewportRef,
});
const { isMobilePortraitViewport, mobileStarterWorkspace } = mobileStarter;

function setWorkbenchElement(element: HTMLElement | null) {
  workbenchRef.value = element;
}

const parts = ref<CircuitPart[]>([
  { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
  { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: true },
  { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
  { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance: 48 },
]);


const wires = ref<Wire[]>([
  {
    id: "wire-1",
    from: { partId: "battery-1", terminal: "b" },
    to: { partId: "switch-1", terminal: "a" },
  },
  {
    id: "wire-2",
    from: { partId: "switch-1", terminal: "b" },
    to: { partId: "bulb-1", terminal: "a" },
  },
  {
    id: "wire-3",
    from: { partId: "bulb-1", terminal: "b" },
    to: { partId: "resistor-1", terminal: "b" },
  },
  {
    id: "wire-4",
    from: { partId: "resistor-1", terminal: "a" },
    to: { partId: "battery-1", terminal: "a" },
  },
]);
const layoutZoom = ref(100);
const scaleMode = ref<"layout" | "view">("view");
const paletteWidth = ref(224);
const statusWidth = ref(340);
const paletteHidden = ref(false);
const statusHidden = ref(false);
const panelLayoutElement = ref<HTMLElement | null>(null);
const resizingPanel = ref<"palette" | "status" | null>(null);
const hoveredDivider = ref<"palette" | "status" | null>(null);
let dividerHoverTimer: number | null = null;
// The `columns` prop only distinguishes hidden (0, overlay) from visible.
// The palette derives its column count from the real panel width via CSS
// auto-fill, so no pixel thresholds are needed here.
const paletteColumns = computed<0 | 1 | 2 | 3 | 4>(() => paletteHidden.value ? 0 : 1);
const statusColumns = computed<0 | 1 | 2 | 3 | 4>(() => statusHidden.value ? 0 : 1);
const desktopGridColumns = computed(() => {
  const columns = [];
  if (!paletteHidden.value) columns.push(`${paletteWidth.value}px`);
  columns.push("minmax(700px, 1fr)");
  if (!statusHidden.value) columns.push(`${statusWidth.value}px`);
  return columns.join(" ");
});
function beginPanelResize(panel: "palette" | "status", event: PointerEvent) {
  if (!desktopViewport.value) return;
  resizingPanel.value = panel;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function beginDividerHover(panel: "palette" | "status") {
  if (dividerHoverTimer !== null) window.clearTimeout(dividerHoverTimer);
  dividerHoverTimer = window.setTimeout(() => { hoveredDivider.value = panel; dividerHoverTimer = null; }, 350);
}
function endDividerHover(panel: "palette" | "status") {
  if (dividerHoverTimer !== null) window.clearTimeout(dividerHoverTimer);
  dividerHoverTimer = null;
  if (resizingPanel.value !== panel) hoveredDivider.value = null;
}
function updatePanelResize(event: PointerEvent) {
  if (!resizingPanel.value || !panelLayoutElement.value) return;
  const rect = panelLayoutElement.value.getBoundingClientRect();
  if (resizingPanel.value === "palette") {
    const width = event.clientX - rect.left;
    if (width < 72) { paletteHidden.value = true; return; }
    // Min 120px: content ~99px < 134px, so the palette can shrink to 1 fixed column.
    paletteWidth.value = Math.round(Math.max(120, Math.min(420, width)) / 4) * 4;
  } else {
    const width = rect.right - event.clientX;
    if (width < 72) { statusHidden.value = true; return; }
    statusWidth.value = Math.round(Math.max(220, Math.min(460, width)) / 4) * 4;
  }
}
function endPanelResize() { resizingPanel.value = null; }
watch(parts, (nextParts) => {
  // Loaded workspaces persist each part's visual scale. Restore the common
  // layout control from that scale without treating a newly added part as a
  // new layout preset.
  layoutZoom.value = Math.round((nextParts[0]?.layoutScale ?? 1) * 100);
}, { deep: false });
const mobileSizing = useMobileWorkbenchSizing({
  getSpec,
  isDesktopViewport,
  isPortraitViewport: isMobilePortraitViewport,
  padding: mobileFitPadding,
  parts,
  viewportRef: canvasViewportRef,
  workbench,
});
const {
  mobileContentBounds,
  mobileDefaultWorkbenchSize,
  mobileFitZoom,
  mobileVisibleWorkbenchSize,
} = mobileSizing;
const mobileViewport = useMobileWorkbenchViewport({
  boardZoom: () => board.zoom,
  canvasViewportRef,
  defaultSize: mobileDefaultWorkbenchSize,
  fitZoom: mobileFitZoom,
  isDesktopViewport,
  mobileContentBounds,
  mobileVisibleWorkbenchSize,
  setBoardZoom: (value) => board.setZoom(value),
  setViewportSize: updateCanvasViewportSize,
  size: mobileWorkbenchSize,
});
const {
  dispose: disposeMobileViewport,
  expandMobileWorkbenchTo,
  fitMobileWorkbench,
  fitMobileWorkbenchAfterRender,
  resetMobileView,
  resetMobileWorkbenchSize,
} = mobileViewport;

const effectiveWorkbenchSize = computed(() => {
  const scale = board.zoom / 100;
  const contentPadding = isDesktopViewport() ? 160 : 280;
  const contentSize = parts.value.reduce(
    (size, part) => {
      const spec = getSpec(part);
      const partScale = part.layoutScale ?? 1;
      return {
        height: Math.max(size.height, part.y + spec.height * partScale + contentPadding),
        width: Math.max(size.width, part.x + spec.width * partScale + contentPadding),
      };
    },
    { height: mobileWorkbenchBase.height, width: mobileWorkbenchBase.width },
  );

  if (isDesktopViewport()) return contentSize;

  return {
    height: Math.ceil(
      Math.max(mobileWorkbenchSize.value.height, contentSize.height, canvasViewportSize.value.height / scale),
    ),
    width: Math.ceil(
      Math.max(mobileWorkbenchSize.value.width, contentSize.width, canvasViewportSize.value.width / scale),
    ),
  };
});

const selectedPart = computed(() => parts.value.find((part) => part.id === selectedPartId.value));
const simulation = computed(() => evaluateCircuit(parts.value, wires.value));
const circuitStatus = useCircuitStatusView(parts, simulation);
const {
  ammeterParts,
  ammeterStatus,
  bulbBrightness,
  bulbParts,
  buzzerParts,
  buzzerStatus,
  capacitorParts,
  capacitorStatus,
  currentAnimationDuration,
  diodeParts,
  diodeStatus,
  ledParts,
  ledStatus,
  litBulbParts,
  litLedParts,
  motorParts,
  motorStatus,
  twoBulbBrightnessValues,
  voltmeterParts,
  voltmeterStatus,
} = circuitStatus;
const mainBulb = computed(() => parts.value.find((part) => part.type === "bulb"));
const mainBulbBrightness = computed(() => mainBulb.value ? simulation.value.bulbs[mainBulb.value.id]?.brightness ?? 0 : 0);
const circuitLessonChecks = useCircuitLessonChecks({
  mainBulbBrightness,
  parts,
  simulation,
  status: circuitStatus,
  wires,
});
const circuitView = useWorkbenchCircuitView({ activeLessonId, lessonChecks: circuitLessonChecks, parts, simulation, status: circuitStatus });
const {
  activeAmmeterCount, activeBuzzerCount, activeLesson, activeLessonGuide, activeMotorCount, activeVoltmeterCount,
  currentVisualStrength, diodeWarnings, hasBuzzerParts, hasMotorParts, ledWarnings, lessonComplete, lessonProgress,
  lessonStepStates, mobileLessonStripText, nextLessonStep, primaryBattery,
} = circuitView;
const panels = useWorkbenchPanels({ activeLessonId, lessonComplete });
const {
  closeLessonCompletePanel,
  dismissedLessonCompletionId,
  lessonCompletePanelOpen,
  openMobileStatusPanel,
  palettePanelOpen,
  statusPanelOpen,
  statusPanelTab,
} = panels;
const lessonTargets = useWorkbenchLessonTargets(activeLessonGuide);
const { isLessonPartTarget, isLessonTerminalTarget } = lessonTargets;
const experimentReport = useExperimentReport({
  activeLesson,
  lessonStepStates,
  parts,
  simulation,
  wires,
});
const {
  copy: copyExperimentReport,
  copyState: experimentReportCopyState,
  currentMarkdown: currentExperimentReportMarkdown,
  dispose: disposeExperimentReport,
  download: exportExperimentReport,
} = experimentReport;
const relayPublication = useRelayPublication({
  activeLesson,
  lessonComplete,
  parts,
  wires,
  workbenchMode,
});
const { publish: publishRelayModule } = relayPublication;
const savedWorkspaceLabel = computed(() => {
  if (!lastSavedAt.value) {
    return "自动保存已开启";
  }

  return `已保存 ${new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(lastSavedAt.value))}`;
});
const workspaceState = useWorkbenchWorkspaceState({
  activeLessonId,
  clearInteractionState,
  fitWorkbenchAfterLoad: (behavior, resetLayout) => fitMobileWorkbenchAfterRender(behavior, resetLayout),
  isKnownLesson: (lessonId) => lessonCatalog.some((lesson) => lesson.id === lessonId),
  mobileStarterWorkspace,
  parts,
  selectedPartId,
  setZoom: (zoom) => board.setZoom(zoom),
  snapBoundRelayAssemblies,
  wires,
  zoom: computed(() => board.zoom),
});
const { loadWorkspace, loadWorkspaceSnapshot: loadWorkspaceSnapshotState, workspaceHistoryKey, workspaceSnapshot } = workspaceState;
function saveWorkspaceSnapshotToStorage() { saveWorkspaceToStorageFromRecords(); }
const {
  pushHistory: pushEditorHistory,
  redo: redoWorkspaceChange,
  undo: undoWorkspaceChange,
} = useWorkbenchHistory<PersistedWorkspace>({
  maxEntries: maxEditorHistoryEntries,
  restoreSnapshot: loadWorkspaceSnapshot,
  saveSnapshot: saveWorkspaceSnapshotToStorage,
  snapshotKey: workspaceHistoryKey,
  takeSnapshot: workspaceSnapshot,
});
const navigation = useWorkbenchNavigation({
  activeLesson,
  activeLessonId,
  dismissLessonCompletion: () => { dismissedLessonCompletionId.value = null; },
  loadWorkspace,
  pushHistory: pushEditorHistory,
  setStatusTab: (tab) => { statusPanelTab.value = tab; },
  setWorkshopCompletion: (open) => { lessonCompletePanelOpen.value = open; },
});
const { loadLessonWorkspace, loadNextLesson, loadWorkbenchMode, resetDemo } = navigation;

const workspaceRecords = useWorkspaceRecords({
  isPersistedWorkspace,
  lastSavedAt,
  loadSnapshot: loadWorkspaceSnapshot,
  pushHistory: pushEditorHistory,
  readLocalStorage,
  removeLocalStorage,
  saveSnapshot: workspaceSnapshot,
  saveToStorage: (workspace) => writeLocalStorage(savedWorkspaceKey, JSON.stringify(workspace)),
  savedRecordsKey,
  savedWorkspaceKey,
  shareParam: workspaceShareParam,
  writeLocalStorage,
  recoveryMessage: workspaceRecoveryMessage,
});
const {
  copyWorkspaceShareLink,
  exportWorkspaceJson,
  importWorkspaceJson: importWorkspaceJsonFromRecords,
  loadSavedRecord,
  loadSavedRecords,
  recordTitle,
  removeSavedRecord,
  restoreAutoSavedWorkspace: restoreAutoSavedWorkspaceFromRecords,
  restoreWorkspaceFromUrl: restoreWorkspaceFromUrlFromRecords,
  saveWorkspaceRecord,
  saveWorkspaceToStorage: saveWorkspaceToStorageFromRecords,
  savedRecords,
  shareLinkState,
  sharedWorkspaceLoaded,
} = workspaceRecords;
const cloudWorkspaceSync = useCloudWorkspaceSync({
  lastSavedWorkspace: workspaceSnapshot,
  loadWorkspaceSnapshot,
  localRecordTitle: recordTitle,
  pushEditorHistory,
  readLocalStorage,
  saveWorkspaceToStorage: saveWorkspaceToStorageFromRecords,
  sharedWorkspaceLoaded,
  workspaceRecoveryMessage,
});
const {
  activeCloudRecord,
  cloudActiveRecordId,
  cloudAuthBusy,
  cloudAuthError,
  cloudAuthMessage,
  cloudAuthMode,
  cloudEmail,
  cloudLastSyncedAt,
  cloudPassword,
  cloudPasswordConfirm,
  cloudPendingSnapshot,
  cloudPendingTitle,
  cloudRecordTitle,
  cloudRecords,
  cloudRecordsBusy,
  cloudRecordsError,
  cloudRecordsMessage,
  cloudShouldSuggestInitialUpload,
  cloudSyncStatus,
  cloudUserEmail,
  dismissCloudInitialUploadSuggestion: dismissCloudInitialUploadSuggestionFromCloud,
  handleCloudSignOut: handleCloudSignOutFromCloud,
  loadCloudRecord: loadCloudRecordFromCloud,
  loadCloudRecords: loadCloudRecordsFromCloud,
  refreshCloudUser: refreshCloudUserFromCloud,
  removeCloudRecord: removeCloudRecordFromCloud,
  renameCloudRecord: renameCloudRecordFromCloud,
  requestCloudAuth: requestCloudAuthFromCloud,
  saveWorkspaceToCloud: saveWorkspaceToCloudFromCloud,
  setCloudAuthMode: setCloudAuthModeFromCloud,
  startCloudAuthSession: startCloudAuthSessionFromCloud,
  stopCloudAuthSession: stopCloudAuthSessionFromCloud,
} = cloudWorkspaceSync;
const cloudWorkspaceView = useCloudWorkspaceView({
  activeRecordId: cloudActiveRecordId,
  authBusy: cloudAuthBusy,
  authMode: cloudAuthMode,
  configured: cloudConfig.configured,
  lastSyncedAt: cloudLastSyncedAt,
  recordsBusy: cloudRecordsBusy,
  syncStatus: cloudSyncStatus,
  userEmail: cloudUserEmail,
});
const {
  authHelpText: cloudAuthHelpText,
  authSubmitLabel: cloudAuthSubmitLabel,
  authTitle: cloudAuthTitle,
  saveLabel: cloudSaveLabel,
  syncBadgeClass: cloudSyncBadgeClass,
  syncDescription: cloudSyncDescription,
  syncLabel: cloudSyncLabel,
  syncState: cloudSyncState,
} = cloudWorkspaceView;
const workbenchParts = useWorkbenchParts({
  clearInteractionState,
  closePalette: () => { palettePanelOpen.value = false; },
  getSpec,
  getNewPartLayoutScale: () => layoutZoom.value / 100,
  pushHistory: pushEditorHistory,
  selectedPartId,
  setStatusTab: (tab) => { statusPanelTab.value = tab; },
  parts,
  wires,
  clampPosition: clampPartPosition,
});
const {
  addPart: addPartFromParts,
  addPartAt: addPartAtFromParts,
  duplicateSelectedPart: duplicateSelectedPartFromParts,
  removeSelectedPart: removeSelectedPartFromParts,
  setPartPosition: setPartPositionFromParts,
  setPartRotation: setPartRotationFromParts,
  setResistance: setResistanceFromParts,
  setSpringContactMode: setSpringContactModeFromParts,
  toggleBatteryPolarity: toggleBatteryPolarityFromParts,
  toggleSwitch: toggleSwitchFromParts,
} = workbenchParts;

function addPublishedModule(module: PublishedRelayModule) {
  const index = parts.value.filter((part) => part.type === "module").length + 1;
  const nextPart: CircuitPart = {
    id: `module-${module.id}-${Date.now()}`,
    moduleContactMode: module.behavior.contactMode,
    moduleId: module.id,
    name: module.name,
    type: "module",
    x: 180 + ((index * 120) % 520),
    y: 160 + ((index * 80) % 300),
  };
  if (layoutZoom.value !== 100) nextPart.layoutScale = layoutZoom.value / 100;
  pushEditorHistory();
  parts.value.push(nextPart);
  clearInteractionState();
  selectedPartId.value = nextPart.id;
  statusPanelTab.value = "selection";
  palettePanelOpen.value = false;
}

function setLayoutZoom(value: number) {
  const next = Math.min(160, Math.max(60, Math.round(value / 5) * 5));
  if (next === layoutZoom.value) return;
  const ratio = next / layoutZoom.value;
  const center = { x: workbench.width / 2, y: workbench.height / 2 };
  pushEditorHistory();
  for (const part of parts.value) {
    const spec = getSpec(part);
    const previousScale = part.layoutScale ?? 1;
    const nextScale = previousScale * ratio;
    part.x = Math.round(center.x + (part.x + (spec.width * previousScale) / 2 - center.x) * ratio - (spec.width * nextScale) / 2);
    part.y = Math.round(center.y + (part.y + (spec.height * previousScale) / 2 - center.y) * ratio - (spec.height * nextScale) / 2);
    if (nextScale === 1) delete part.layoutScale;
    else part.layoutScale = nextScale;
  }
  layoutZoom.value = next;
}

function setScaleMode(mode: "layout" | "view") { scaleMode.value = mode; }

function renamePublishedModule(module: PublishedRelayModule) {
  const name = window.prompt("给这个逻辑模块起一个名字：", module.name);
  if (name === null) return;
  const nextName = name.trim().slice(0, 80);
  if (!nextName) return;
  if (!renamePublishedRelayModule(module.id, nextName)) return;
  publishedModules.value = publishedModules.value.map((item) => item.id === module.id ? { ...item, name: nextName } : item);
  for (const part of parts.value) {
    if (part.type === "module" && part.moduleId === module.id) part.name = nextName;
  }
}

function handlePaletteDrop(event: DragEvent) {
  const moduleId = event.dataTransfer?.getData("application/x-xshow-module");
  const module = publishedModules.value.find((item) => item.id === moduleId);
  if (!module) {
    const partType = event.dataTransfer?.getData("application/x-xshow-part");
    if (!partType || !Object.prototype.hasOwnProperty.call(partSpecs, partType)) return;
    const point = boardPoint(event as unknown as PointerEvent);
    addPartAtFromParts(partType as PartType, point.x, point.y);
    return;
  }
  const index = parts.value.filter((part) => part.type === "module").length + 1;
  const draft: CircuitPart = {
    id: `module-${module.id}-${Date.now()}`,
    moduleContactMode: module.behavior.contactMode,
    moduleId: module.id,
    name: module.name,
    type: "module",
    x: 0,
    y: 0,
  };
  if (layoutZoom.value !== 100) draft.layoutScale = layoutZoom.value / 100;
  const point = boardPoint(event as unknown as PointerEvent);
  const position = clampPartPosition(draft, point.x - getSpec(draft).width / 2, point.y - getSpec(draft).height / 2);
  draft.x = position.x;
  draft.y = position.y;
  pushEditorHistory();
  parts.value.push(draft);
  clearInteractionState();
  selectedPartId.value = draft.id;
  statusPanelTab.value = "selection";
  palettePanelOpen.value = false;
}
const partMovement = useWorkbenchPartMovement({
  boardPoint,
  clampPosition: clampPartPosition,
  getSpec,
  parts,
  pushHistory: pushEditorHistory,
  selectedPartId,
  setStatusTab: (tab) => { statusPanelTab.value = tab; },
  workbenchLimitHeight,
  workbenchLimitWidth,
});
const {
  bindSpringToCoil: bindSpringToCoilFromMovement,
  clearDrag,
  isDragging,
  nudgeSelectedPart: nudgeSelectedPartFromMovement,
  snapBoundRelayAssemblies: snapBoundRelayAssembliesFromMovement,
} = partMovement;

let beginnerGuideHandleWireAdded = () => {};
const wireInteraction = useWireInteraction({
  boardPoint,
  closestTerminal,
  expandMobileWorkbenchTo,
  getTerminalPosition,
  limitHeight: workbenchLimitHeight,
  limitWidth: workbenchLimitWidth,
  onWireAdded: () => beginnerGuideHandleWireAdded(),
  pushEditorHistory,
  selectedPartId,
  statusPanelTab,
  wires,
});
const {
  addWireBetween,
  clearCanvasSelection,
  clearWires,
  endpointDrag,
  finishEndpointDrag,
  finishNewWireDrag,
  finishRewire,
  hoveredEndpoint,
  hoveredWireId,
  handleTerminalClick,
  newWireDrag,
  removeWire,
  renderedWires,
  rewiring,
  selectWire,
  selectedTerminal,
  selectedWire,
  selectedWireId,
  suppressNextTerminalClick,
  startBranchWireDrag,
  startEndpointDrag,
  startNewWireDrag,
  startRewire,
  updateNewWireDrag,
} = wireInteraction;
const pointerInteraction = useWorkbenchPointerInteraction({
  movement: partMovement,
  parts,
  selectedTerminal,
  wire: wireInteraction,
  wires,
});
const {
  endDrag,
  finishTerminalDrag,
  handlePartPointerDown,
  handleWorkbenchPointerMove,
  isTerminalDropTarget,
  isTerminalSelected,
} = pointerInteraction;
const beginnerGuide = useBeginnerGuide({
  guideDismissedKey: guideAssistantDismissedKey,
  ledParts,
  ledStatus,
  loadExample: resetDemo,
  mainBulb,
  mainBulbBrightness,
  openStatusPanel: openMobileStatusPanel,
  parts,
  resetLayout: resetMobileView,
  selectedPartId,
  selectedTerminal,
  selectedWireId,
  setPanels: ({ paletteOpen, statusOpen }) => {
    palettePanelOpen.value = paletteOpen;
    statusPanelOpen.value = statusOpen;
  },
  simulation,
});
const {
  beginnerGuideStep,
  beginnerGuideStepIndex,
  beginnerGuideTotal,
  guideAssistantMode,
  guideAssistantOpen,
  guideDiagnosis,
  handleBeginnerGuideAction,
  handleGuideDiagnosisAction,
  loadExampleFromGuide,
  nextBeginnerGuideStep,
  openGuideAssistant,
  resetLayoutFromGuide,
  showGuideDiagnosis,
  showWireGuide,
  startBeginnerGuide,
  dismissGuideAssistant,
} = beginnerGuide;
beginnerGuideHandleWireAdded = beginnerGuide.handleWireAdded;
const partPresentation = useWorkbenchPartPresentation({
  boardZoom: () => board.zoom,
  endpointDrag,
  getSpec,
  parts,
  workbenchRef,
});
const workbenchGeometry = useWorkbenchGeometry({
  expandWorkbenchTo: expandMobileWorkbenchTo,
  getSpec,
  getTerminalPosition,
  limitHeight: workbenchLimitHeight,
  limitWidth: workbenchLimitWidth,
  parts,
});
const selection = useWorkbenchSelection({
  clearDrag,
  clearWireSelection: wireInteraction.clearCanvasSelection,
  endpointDrag,
  hoveredEndpoint,
  hoveredWireId,
  isDragging,
  newWireDrag,
  removePart: removeSelectedPartFromParts,
  removeWire,
  rewiring,
  selectedPart,
  selectedPartId,
  selectedTerminal,
  selectedWire,
  selectedWireId,
  suppressNextTerminalClick,
});
const {
  clearCanvasSelection: clearCanvasSelectionFromSelection,
  clearInteractionState: clearInteractionStateFromSelection,
  clearSelection: clearSelectionFromSelection,
  deleteSelectedWorkbenchItem: deleteSelectedWorkbenchItemFromSelection,
  hasTransientInteraction: hasTransientInteractionFromSelection,
} = selection;
const keyboard = useWorkbenchKeyboard({
  cancelInteraction: () => cancelWorkbenchInteraction(),
  duplicatePart: duplicateSelectedPartFromParts,
  getZoom: () => board.zoom,
  isBattery: (part) => part?.type === "battery",
  isSwitch: (part) => part?.type === "switch",
  nudgePart: nudgeSelectedPart,
  redo: redoWorkspaceChange,
  removeSelectedItem: () => deleteSelectedWorkbenchItem(),
  resetView: () => { pushEditorHistory(); resetMobileView(); },
  selectedPart,
  setZoom: (value) => { pushEditorHistory(); board.setZoom(value); },
  toggleBattery: toggleBatteryPolarityFromParts,
  toggleSwitch: toggleSwitchFromParts,
  undo: undoWorkspaceChange,
});
const handleWorkbenchKeydown = keyboard.handleKeydown;
const wirePresentation = useWorkbenchWirePresentation({
  currentVisualStrength: () => currentVisualStrength.value,
  endpointDrag,
  getPart,
  getSpec,
  getTerminalPosition,
  hoveredEndpoint,
  hoveredWireId,
  isDesktopViewport,
  newWireDrag,
  selectedWireId,
  simulationWire: (wireId) => simulation.value.wires[wireId],
  terminalDisplayLabel,
  wireEndpointPosition,
  wires,
  workbenchLimitHeight,
  workbenchLimitWidth,
});
const {
  clearEndpointHover,
  clearWireHover,
  endpointFill,
  endpointRadius,
  endpointStrokeWidth,
  isEndpointHovered,
  isWireHighlighted,
  newWireDragPath,
  setEndpointHover,
  setWireHover,
  terminalLabel,
  wireLabel,
  wireBridges,
  wirePath,
  wireStroke,
  wireStrokeWidth,
} = wirePresentation;
const imageExport = useWorkbenchImageExport({
  activeLessonTitle: computed(() => activeLesson.value.title),
  ammeterStatus,
  buzzerStatus,
  capacitorStatus,
  diodeStatus,
  ledStatus,
  motorStatus,
  parts,
  selectedPartId,
  simulation,
  voltmeterStatus,
  wirePath,
  wireStroke,
  wireStrokeWidth,
  wires,
});
const { exportWorkbenchImage } = imageExport;

let buildPlanCopyFeedbackTimer: number | null = null;

function loadWorkspaceSnapshot(workspace: PersistedWorkspace) {
  lastSavedAt.value = loadWorkspaceSnapshotState(workspace);
}

function clearInteractionState() { clearInteractionStateFromSelection(); }
function snapBoundRelayAssemblies() { snapBoundRelayAssembliesFromMovement(); }
function clearSelection() { clearSelectionFromSelection(); }
function hasTransientInteraction() { return hasTransientInteractionFromSelection(); }

function workbenchLimitWidth() {
  return effectiveWorkbenchSize.value.width;
}

function workbenchLimitHeight() {
  return effectiveWorkbenchSize.value.height;
}

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;
}

function batteryPolarityLabel(part: CircuitPart) { return partPresentation.batteryPolarityLabel(part); }
function terminalDisplayLabel(part: CircuitPart, terminal: TerminalKey) { return partPresentation.terminalDisplayLabel(part, terminal); }
function getPart(partId: string) { return partPresentation.getPart(partId); }
function getTerminalPosition(ref: TerminalRef) { return partPresentation.getTerminalPosition(ref); }
function terminalStyle(part: CircuitPart, terminal: TerminalKey) { return partPresentation.terminalStyle(part, terminal); }
function partStyle(part: CircuitPart) { return partPresentation.partStyle(part); }
function wireEndpointPosition(wire: Wire, end: WireEnd) { return partPresentation.wireEndpointPosition(wire, end); }
function boardPoint(event: PointerEvent) { return partPresentation.boardPoint(event); }

function closestTerminal(point: { x: number; y: number }, excluded?: TerminalRef) {
  return workbenchGeometry.closestTerminal(point, excluded);
}

function clampPartPosition(part: CircuitPart, x: number, y: number) {
  return workbenchGeometry.clampPosition(part, x, y);
}

function deleteSelectedWorkbenchItem() { deleteSelectedWorkbenchItemFromSelection(); }

function nudgeSelectedPart(deltaX: number, deltaY: number, shouldRecordHistory = true) {
  nudgeSelectedPartFromMovement(deltaX, deltaY, shouldRecordHistory);
  selectedWireId.value = null;
}

function cancelWorkbenchInteraction() {
  if (lessonCompletePanelOpen.value || palettePanelOpen.value || statusPanelOpen.value) {
    lessonCompletePanelOpen.value = false;
    palettePanelOpen.value = false;
    statusPanelOpen.value = false;
    return;
  }

  if (hasTransientInteraction()) {
    clearInteractionState();
    return;
  }

  clearSelection();
}

function markCloudWorkspaceChanged() {
  if (!cloudUserEmail.value || cloudSyncStatus.value === "syncing") {
    return;
  }

  cloudSyncStatus.value = "local-changes";
  cloudRecordsMessage.value = "";
}

function openExperimentReportPanel() {
  statusPanelTab.value = "records";
  statusPanelOpen.value = true;
  palettePanelOpen.value = false;
}

async function importWorkspaceJson(event: Event) {
  await importWorkspaceJsonFromRecords(event, () => { statusPanelOpen.value = false; });
}

loadSavedRecords();
const autosave = useWorkbenchAutosave({
  activeLessonId,
  loadDefaultWorkspace: () => loadWorkspace({ parts: parts.value, selectedPartId: selectedPartId.value, wires: wires.value, zoom: board.zoom }, { adaptMobileStarterLayout: true }),
  markCloudChanged: markCloudWorkspaceChanged,
  parts,
  restoreAutoSavedWorkspace: restoreAutoSavedWorkspaceFromRecords,
  restoreWorkspaceFromUrl: restoreWorkspaceFromUrlFromRecords,
  saveWorkspaceToStorage: saveWorkspaceToStorageFromRecords,
  selectedPartId,
  wires,
  zoom: () => board.zoom,
});
autosave.restoreInitialWorkspace();

watch(
  [workbenchMode, () => route.query.module, () => route.query.view],
  ([mode, moduleId, view]) => loadWorkbenchMode(
    mode,
    typeof moduleId === "string" ? moduleId : "",
    view === "verification" ? "verification" : "core",
  ),
  { immediate: true },
);
function handleMobileViewportChange() {
  desktopViewport.value = isDesktopViewport();
  updateCanvasViewportSize();
  fitMobileWorkbenchAfterRender("auto", true);
}

useWorkbenchWindowLifecycle({
  cloudConfigured: cloudConfig.configured,
  fitWorkbench: () => {
    desktopViewport.value = isDesktopViewport();
    fitMobileWorkbenchAfterRender();
  },
  handleKeydown: handleWorkbenchKeydown,
  handleViewportChange: handleMobileViewportChange,
  restoreGuide: beginnerGuide.restoreInitialState,
  startCloudAuth: startCloudAuthSessionFromCloud,
});

onBeforeUnmount(() => {
  if (dividerHoverTimer !== null) window.clearTimeout(dividerHoverTimer);
  disposeMobileViewport();

  workbenchParts.dispose();

  stopCloudAuthSessionFromCloud();
  if (buildPlanCopyFeedbackTimer) {
    window.clearTimeout(buildPlanCopyFeedbackTimer);
  }

  disposeExperimentReport();

});
</script>

<template>
  <main class="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-background xl:h-screen xl:min-h-[720px]">
    <a
      :href="icpRecordUrl"
      target="_blank"
      rel="noreferrer"
      class="fixed right-3 top-[calc(0.5rem+env(safe-area-inset-top))] z-10 rounded-md border bg-card/75 px-2 py-1 text-[10px] leading-none text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground xl:bottom-2 xl:right-3 xl:top-auto"
    >
      {{ icpRecordNumber }}
    </a>

    <WorkbenchHeader
      :clear-wires="clearWires"
      :export-workbench-image="exportWorkbenchImage"
      :github-repository-url="githubRepositoryUrl"
      :open-guide-assistant="openGuideAssistant"
      :open-report-panel="openExperimentReportPanel"
      :reset-demo="resetDemo"
      :saved-workspace-label="savedWorkspaceLabel"
      :layout-zoom="layoutZoom"
      :scale-mode="scaleMode"
      :set-layout-zoom="setLayoutZoom"
      :set-scale-mode="setScaleMode"
      :set-zoom="board.setZoom"
      :simulation="simulation"
      :workbench-mode="workbenchMode"
      :zoom="board.zoom"
    />

    <nav class="flex shrink-0 gap-2 border-b bg-card px-3 py-2 xl:hidden" aria-label="电路层模式">
      <RouterLink
        to="/workbench/free"
        class="flex h-9 flex-1 items-center justify-center rounded-md border text-xs font-medium"
        :class="workbenchMode === 'free' ? 'border-cyan-300 bg-cyan-50 text-cyan-900' : 'border-border text-muted-foreground'"
      >
        自由实验
      </RouterLink>
      <RouterLink
        to="/workbench/workshop"
        class="flex h-9 flex-1 items-center justify-center rounded-md border text-xs font-medium"
        :class="workbenchMode === 'workshop' ? 'border-violet-300 bg-violet-50 text-violet-900' : 'border-border text-muted-foreground'"
      >
        器件工坊
      </RouterLink>
    </nav>

    <section ref="panelLayoutElement" class="relative grid min-h-0 flex-1 grid-cols-1" :style="desktopViewport ? { gridTemplateColumns: desktopGridColumns } : undefined" @pointermove="updatePanelResize" @pointerup="endPanelResize" @pointercancel="endPanelResize">
      <div
        v-if="palettePanelOpen || statusPanelOpen"
        class="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] xl:hidden"
        @click="palettePanelOpen = false; statusPanelOpen = false"
      />

      <button
        v-if="paletteHidden"
        class="absolute left-0 top-1/2 z-20 hidden h-16 w-5 -translate-y-1/2 items-center justify-center rounded-r border border-l-0 bg-card/95 text-sm text-slate-500 shadow-sm hover:bg-cyan-50 hover:text-cyan-800 xl:flex"
        title="展开元件栏"
        @click="paletteHidden = false"
      >»</button>
      <button
        v-if="statusHidden"
        class="absolute right-0 top-1/2 z-20 hidden h-16 w-5 -translate-y-1/2 items-center justify-center rounded-l border border-r-0 bg-card/95 text-sm text-slate-500 shadow-sm hover:bg-cyan-50 hover:text-cyan-800 xl:flex"
        title="展开状态栏"
        @click="statusHidden = false"
      >«</button>
      <div v-if="!paletteHidden" class="absolute bottom-0 top-0 z-30 hidden w-[5px] -translate-x-1/2 cursor-col-resize transition-colors xl:block" :class="resizingPanel === 'palette' || hoveredDivider === 'palette' ? 'bg-orange-500' : 'bg-transparent'" :style="{ left: `${paletteWidth}px` }" title="拖动调整元件栏宽度" @pointerenter="beginDividerHover('palette')" @pointerleave="endDividerHover('palette')" @pointerdown.prevent="beginPanelResize('palette', $event)">
        <span class="absolute inset-y-0 left-0 w-px transition-colors" :class="resizingPanel === 'palette' || hoveredDivider === 'palette' ? 'bg-transparent' : 'bg-slate-300'" />
        <span class="absolute inset-y-0 right-0 w-px transition-colors" :class="resizingPanel === 'palette' || hoveredDivider === 'palette' ? 'bg-transparent' : 'bg-slate-300'" />
      </div>
      <div v-if="!statusHidden" class="absolute bottom-0 top-0 z-30 hidden w-[5px] -translate-x-1/2 cursor-col-resize transition-colors xl:block" :class="resizingPanel === 'status' || hoveredDivider === 'status' ? 'bg-orange-500' : 'bg-transparent'" :style="{ right: `${statusWidth}px` }" title="拖动调整状态栏宽度" @pointerenter="beginDividerHover('status')" @pointerleave="endDividerHover('status')" @pointerdown.prevent="beginPanelResize('status', $event)">
        <span class="absolute inset-y-0 left-0 w-px transition-colors" :class="resizingPanel === 'status' || hoveredDivider === 'status' ? 'bg-transparent' : 'bg-slate-300'" />
        <span class="absolute inset-y-0 right-0 w-px transition-colors" :class="resizingPanel === 'status' || hoveredDivider === 'status' ? 'bg-transparent' : 'bg-slate-300'" />
      </div>

      <div v-if="desktopViewport || palettePanelOpen" class="contents xl:row-start-1 xl:block xl:min-h-0" :style="desktopViewport ? { gridColumnStart: paletteHidden ? undefined : 1 } : undefined">
        <ComponentPalette
          class="xl:h-full"
          :columns="paletteColumns"
          :open="palettePanelOpen"
          :published-modules="publishedModules"
          @add-module="addPublishedModule"
          @add-part="addPartFromParts"
          @rename-module="renamePublishedModule"
          @close="palettePanelOpen = false"
        />
      </div>

      <WorkbenchCanvas
        class="xl:row-start-1"
        :style="desktopViewport ? { gridColumnStart: paletteHidden ? 1 : 2 } : undefined"
        :active-lesson="activeLesson"
        :apply-pwa-update="applyPwaUpdate"
        :battery-polarity-label="batteryPolarityLabel"
        :beginner-guide-step="beginnerGuideStep"
        :beginner-guide-step-index="beginnerGuideStepIndex"
        :beginner-guide-total="beginnerGuideTotal"
        :bulb-brightness="bulbBrightness"
        :buzzer-status="buzzerStatus"
        :capacitor-status="capacitorStatus"
        :clear-canvas-selection="clearCanvasSelectionFromSelection"
        :clear-endpoint-hover="clearEndpointHover"
        :clear-wire-hover="clearWireHover"
        :clear-wires="clearWires"
        :close-lesson-complete-panel="closeLessonCompletePanel"
        :current-animation-duration="currentAnimationDuration"
        :dismiss-pwa-update="dismissPwaUpdate"
        :dismiss-guide-assistant="dismissGuideAssistant"
        :duplicate-selected-part="duplicateSelectedPartFromParts"
        :end-canvas-gesture="endCanvasGesture"
        :end-drag="endDrag"
        :finish-terminal-drag="finishTerminalDrag"
        :endpoint-drag="endpointDrag"
        :endpoint-fill="endpointFill"
        :endpoint-radius="endpointRadius"
        :endpoint-stroke-width="endpointStrokeWidth"
        :export-workbench-image="exportWorkbenchImage"
        :finish-new-wire-drag="finishNewWireDrag"
        :get-terminal-position="getTerminalPosition"
        :github-repository-url="githubRepositoryUrl"
        :handle-canvas-pointer-down="handleCanvasPointerDown"
        :handle-canvas-pointer-move="handleCanvasPointerMove"
        :handle-part-pointer-down="handlePartPointerDown"
        :handle-palette-drop="handlePaletteDrop"
        :handle-terminal-click="handleTerminalClick"
        :handle-workbench-pointer-move="handleWorkbenchPointerMove"
        :guide-assistant-mode="guideAssistantMode"
        :guide-assistant-open="guideAssistantOpen"
        :guide-diagnosis="guideDiagnosis"
        :handle-beginner-guide-action="handleBeginnerGuideAction"
        :handle-guide-diagnosis-action="handleGuideDiagnosisAction"
        :is-lesson-part-target="isLessonPartTarget"
        :is-lesson-terminal-target="isLessonTerminalTarget"
        :is-terminal-drop-target="isTerminalDropTarget"
        :is-terminal-selected="isTerminalSelected"
        :is-wire-highlighted="isWireHighlighted"
        :ammeter-status="ammeterStatus"
        :diode-status="diodeStatus"
        :led-status="ledStatus"
        :lesson-complete="lessonComplete"
        :lesson-complete-panel-open="lessonCompletePanelOpen"
        :lesson-progress="lessonProgress"
        :load-next-lesson="loadNextLesson"
        :mobile-lesson-strip-text="mobileLessonStripText"
        :effective-workbench-height="effectiveWorkbenchSize.height"
        :effective-workbench-width="effectiveWorkbenchSize.width"
        :motor-status="motorStatus"
        :new-wire-drag="newWireDrag"
        :new-wire-drag-path="newWireDragPath"
        :load-example-from-guide="loadExampleFromGuide"
        :next-beginner-guide-step="nextBeginnerGuideStep"
        :open-guide-assistant="openGuideAssistant"
        :palette-panel-open="palettePanelOpen"
        :part-style="partStyle"
        :parts="parts"
        :pwa-update-registration="pwaUpdateRegistration"
        :rendered-wires="renderedWires"
        :reset-demo="resetDemo"
        :reset-layout-from-guide="resetLayoutFromGuide"
        :reset-mobile-view="resetMobileView"
        :remove-selected-part="removeSelectedPartFromParts"
        :rewiring="rewiring"
        :select-wire="selectWire"
        :selected-part-id="selectedPartId"
        :selected-terminal="selectedTerminal"
        :selected-wire="selectedWire"
        :set-canvas-viewport="setCanvasViewportElement"
        :set-endpoint-hover="setEndpointHover"
        :set-resistance="setResistanceFromParts"
        :set-wire-hover="setWireHover"
        :set-workbench-element="setWorkbenchElement"
        :set-part-rotation="setPartRotationFromParts"
        :set-zoom="board.setZoom"
        :show-guide-diagnosis="showGuideDiagnosis"
        :show-wire-guide="showWireGuide"
        :simulation="simulation"
        :start-endpoint-drag="startEndpointDrag"
        :start-beginner-guide="startBeginnerGuide"
        :start-new-wire-drag="startNewWireDrag"
        :status-panel-open="statusPanelOpen"
        :terminal-display-label="terminalDisplayLabel"
        :terminal-label="terminalLabel"
        :terminal-style="terminalStyle"
        :toggle-battery-polarity="toggleBatteryPolarityFromParts"
        :toggle-switch="toggleSwitchFromParts"
        :update-new-wire-drag="updateNewWireDrag"
        :voltmeter-status="voltmeterStatus"
        :wire-endpoint-position="wireEndpointPosition"
        :wire-bridges="wireBridges"
        :wire-path="wirePath"
        :wire-stroke="wireStroke"
        :wire-stroke-width="wireStrokeWidth"
        :workbench-mode="workbenchMode"
        :zoom="board.zoom"
        @open-palette="palettePanelOpen = true; statusPanelOpen = false"
        @open-status-tab="openMobileStatusPanel"
        @toggle-status="statusPanelOpen = !statusPanelOpen; palettePanelOpen = false"
      />

      <div v-if="desktopViewport || statusPanelOpen" class="contents xl:row-start-1 xl:block xl:min-h-0" :style="desktopViewport && !statusHidden ? { gridColumnStart: paletteHidden ? 2 : 3 } : undefined">
        <StatusPanel
          class="xl:h-full"
          :columns="statusColumns"
          v-model:active-lesson-id="activeLessonId"
        v-model:cloud-email="cloudEmail"
        v-model:cloud-password="cloudPassword"
        v-model:cloud-password-confirm="cloudPasswordConfirm"
        v-model:cloud-record-title="cloudRecordTitle"
        v-model:record-title="recordTitle"
        v-model:tab="statusPanelTab"
        :active-buzzer-count="activeBuzzerCount"
        :active-ammeter-count="activeAmmeterCount"
        :active-lesson="activeLesson"
        :active-motor-count="activeMotorCount"
        :active-voltmeter-count="activeVoltmeterCount"
        :ammeter-status="ammeterStatus"
        :battery-polarity-label="batteryPolarityLabel"
        :bind-spring-to-coil="bindSpringToCoilFromMovement"
        :buzzer-status="buzzerStatus"
        :capacitor-status="capacitorStatus"
        :cloud-active-record-id="cloudActiveRecordId"
        :cloud-auth-busy="cloudAuthBusy"
        :cloud-auth-error="cloudAuthError"
        :cloud-auth-help-text="cloudAuthHelpText"
        :cloud-auth-message="cloudAuthMessage"
        :cloud-auth-mode="cloudAuthMode"
        :cloud-auth-submit-label="cloudAuthSubmitLabel"
        :cloud-auth-title="cloudAuthTitle"
        :cloud-config="cloudConfig"
        :cloud-pending-snapshot="cloudPendingSnapshot"
        :cloud-records="cloudRecords"
        :cloud-records-busy="cloudRecordsBusy"
        :cloud-records-error="cloudRecordsError"
        :cloud-records-message="cloudRecordsMessage"
        :cloud-save-label="cloudSaveLabel"
        :cloud-should-suggest-initial-upload="cloudShouldSuggestInitialUpload"
        :cloud-sync-badge-class="cloudSyncBadgeClass"
        :cloud-sync-description="cloudSyncDescription"
        :cloud-sync-label="cloudSyncLabel"
        :cloud-sync-state="cloudSyncState"
        :cloud-user-email="cloudUserEmail"
        :dismiss-cloud-initial-upload-suggestion="dismissCloudInitialUploadSuggestionFromCloud"
        :experiment-report-copy-state="experimentReportCopyState"
        :format-saved-time="formatSavedTime"
        :handle-cloud-sign-out="handleCloudSignOutFromCloud"
        :has-buzzer-parts="hasBuzzerParts"
        :has-motor-parts="hasMotorParts"
        :import-workspace-json="importWorkspaceJson"
        :diode-status="diodeStatus"
        :diode-warnings="diodeWarnings"
        :led-status="ledStatus"
        :led-warnings="ledWarnings"
        :lesson-complete="lessonComplete"
        :lesson-progress="lessonProgress"
        :lesson-step-states="lessonStepStates"
        :load-cloud-record="loadCloudRecordFromCloud"
        :load-cloud-records="loadCloudRecordsFromCloud"
        :load-lesson-workspace="loadLessonWorkspace"
        :load-saved-record="loadSavedRecord"
        :main-bulb-brightness="mainBulbBrightness"
        :motor-status="motorStatus"
        :next-lesson-step="nextLessonStep"
        :open="statusPanelOpen"
        :physical-build-plan="hiddenPhysicalBuildPlan"
        :parts="parts"
        physical-build-plan-copy-state="idle"
        :publish-relay-module="publishRelayModule"
        :primary-battery="primaryBattery"
        :remove-cloud-record="removeCloudRecordFromCloud"
        :remove-saved-record="removeSavedRecord"
        :remove-selected-part="removeSelectedPartFromParts"
        :remove-wire="removeWire"
        :rename-cloud-record="renameCloudRecordFromCloud"
        :request-cloud-auth="requestCloudAuthFromCloud"
        :rewiring="rewiring"
        :save-workspace-record="saveWorkspaceRecord"
        :save-workspace-to-cloud="saveWorkspaceToCloudFromCloud"
        :saved-records="savedRecords"
        :select-wire="selectWire"
        :selected-part="selectedPart"
        :selected-wire="selectedWire"
        :selected-wire-id="selectedWireId"
        :set-cloud-auth-mode="setCloudAuthModeFromCloud"
        :set-part-position="setPartPositionFromParts"
        :set-part-rotation="setPartRotationFromParts"
        :set-resistance="setResistanceFromParts"
        :set-spring-contact-mode="setSpringContactModeFromParts"
        :share-link-state="shareLinkState"
        :shared-workspace-loaded="sharedWorkspaceLoaded"
        :workspace-recovery-message="workspaceRecoveryMessage"
        :simulation="simulation"
        :workbench-mode="workbenchMode"
        :start-rewire="startRewire"
        :toggle-battery-polarity="toggleBatteryPolarityFromParts"
        :toggle-switch="toggleSwitchFromParts"
        :voltmeter-status="voltmeterStatus"
        :wire-label="wireLabel"
        :wires="wires"
        @close="statusPanelOpen = false"
        @copy-experiment-report="copyExperimentReport"
        @copy-workspace-share-link="copyWorkspaceShareLink"
        @export-experiment-report="exportExperimentReport"
        @export-workspace-json="exportWorkspaceJson"
        />
      </div>
    </section>
  </main>
</template>
