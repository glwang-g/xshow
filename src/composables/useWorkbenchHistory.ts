import { shallowRef } from "vue";

type UseWorkbenchHistoryOptions<TSnapshot> = {
  maxEntries: number;
  restoreSnapshot: (snapshot: TSnapshot) => void;
  saveSnapshot: () => void;
  snapshotKey: (snapshot: TSnapshot) => string;
  takeSnapshot: () => TSnapshot;
};

export function useWorkbenchHistory<TSnapshot>({
  maxEntries,
  restoreSnapshot,
  saveSnapshot,
  snapshotKey,
  takeSnapshot,
}: UseWorkbenchHistoryOptions<TSnapshot>) {
  const undoStack = shallowRef<TSnapshot[]>([]);
  const redoStack = shallowRef<TSnapshot[]>([]);

  function pushHistory() {
    const snapshot = takeSnapshot();
    const previous = undoStack.value[undoStack.value.length - 1];

    if (previous && snapshotKey(previous) === snapshotKey(snapshot)) {
      return;
    }

    undoStack.value = [...undoStack.value, snapshot].slice(-maxEntries);
    redoStack.value = [];
  }

  function restoreHistorySnapshot(snapshot: TSnapshot) {
    restoreSnapshot(snapshot);
    saveSnapshot();
  }

  function undo() {
    const previous = undoStack.value[undoStack.value.length - 1];
    if (!previous) {
      return;
    }

    undoStack.value = undoStack.value.slice(0, -1);
    redoStack.value = [...redoStack.value, takeSnapshot()].slice(-maxEntries);
    restoreHistorySnapshot(previous);
  }

  function redo() {
    const next = redoStack.value[redoStack.value.length - 1];
    if (!next) {
      return;
    }

    redoStack.value = redoStack.value.slice(0, -1);
    undoStack.value = [...undoStack.value, takeSnapshot()].slice(-maxEntries);
    restoreHistorySnapshot(next);
  }

  return {
    pushHistory,
    redo,
    redoStack,
    undo,
    undoStack,
  };
}
