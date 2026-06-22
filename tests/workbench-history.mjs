import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const historyModule = await import(
  await compiledModuleUrl("../src/composables/useWorkbenchHistory.ts", import.meta.url, [
    ['from "vue"', `from "${import.meta.resolve("vue")}"`],
  ])
);

function createHarness(maxEntries = 3) {
  let current = { key: "initial", value: 0 };
  const restored = [];
  let saves = 0;

  const history = historyModule.useWorkbenchHistory({
    maxEntries,
    restoreSnapshot: (snapshot) => {
      current = { ...snapshot };
      restored.push({ ...snapshot });
    },
    saveSnapshot: () => {
      saves += 1;
    },
    snapshotKey: (snapshot) => snapshot.key,
    takeSnapshot: () => ({ ...current }),
  });

  return {
    get current() {
      return current;
    },
    get restored() {
      return restored;
    },
    get saves() {
      return saves;
    },
    history,
    setCurrent(snapshot) {
      current = { ...snapshot };
    },
  };
}

test("workbench history deduplicates adjacent snapshots and clears redo on new edits", () => {
  const harness = createHarness();

  harness.history.pushHistory();
  harness.history.pushHistory();
  assert.equal(harness.history.undoStack.value.length, 1);

  harness.setCurrent({ key: "after-drag", value: 1 });
  harness.history.pushHistory();
  harness.setCurrent({ key: "after-delete", value: 2 });

  harness.history.undo();
  assert.deepEqual(harness.current, { key: "after-drag", value: 1 });
  assert.equal(harness.history.redoStack.value.length, 1);
  assert.equal(harness.saves, 1);

  harness.setCurrent({ key: "after-new-edit", value: 3 });
  harness.history.pushHistory();
  assert.equal(harness.history.redoStack.value.length, 0);
});

test("workbench history restores undo and redo snapshots in stack order", () => {
  const harness = createHarness();

  harness.history.pushHistory();
  harness.setCurrent({ key: "second", value: 1 });
  harness.history.pushHistory();
  harness.setCurrent({ key: "third", value: 2 });

  harness.history.undo();
  assert.deepEqual(harness.current, { key: "second", value: 1 });

  harness.history.undo();
  assert.deepEqual(harness.current, { key: "initial", value: 0 });

  harness.history.redo();
  assert.deepEqual(harness.current, { key: "second", value: 1 });

  harness.history.redo();
  assert.deepEqual(harness.current, { key: "third", value: 2 });
  assert.deepEqual(
    harness.restored.map((snapshot) => snapshot.key),
    ["second", "initial", "second", "third"],
  );
});

test("workbench history caps undo and redo stacks to the configured size", () => {
  const harness = createHarness(2);

  for (let index = 0; index < 4; index += 1) {
    harness.setCurrent({ key: `snapshot-${index}`, value: index });
    harness.history.pushHistory();
  }

  assert.deepEqual(
    harness.history.undoStack.value.map((snapshot) => snapshot.key),
    ["snapshot-2", "snapshot-3"],
  );

  harness.setCurrent({ key: "latest", value: 4 });
  harness.history.undo();
  harness.history.undo();
  assert.deepEqual(
    harness.history.redoStack.value.map((snapshot) => snapshot.key),
    ["latest", "snapshot-3"],
  );
});
