import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const progressCodec = await import(await compiledModuleUrl("../src/lib/repair-progress-codec.ts", import.meta.url));
const validLevelIds = new Set(["lamp-outage", "led-polarity"]);

function progressRecord(levelId, overrides = {}) {
  return {
    completions: 0,
    lastOpenedAt: "2026-06-21T10:30:00.000Z",
    levelId,
    startedAt: "2026-06-21T10:00:00.000Z",
    status: "in-progress",
    ...overrides,
  };
}

test("repair progress sanitizer preserves valid records and drops unknown levels", () => {
  const state = progressCodec.sanitizeRepairProgressState(
    {
      currentLevelId: "lamp-outage",
      records: {
        "lamp-outage": progressRecord("lamp-outage"),
        "old-level": progressRecord("old-level"),
      },
    },
    validLevelIds,
  );

  assert.equal(state.currentLevelId, "lamp-outage");
  assert.deepEqual(Object.keys(state.records), ["lamp-outage"]);
});

test("repair progress sanitizer clears invalid current level without losing valid history", () => {
  const state = progressCodec.sanitizeRepairProgressState(
    {
      currentLevelId: "missing-level",
      records: {
        "led-polarity": progressRecord("led-polarity", {
          completedAt: "2026-06-21T10:45:00.000Z",
          completions: 1,
          status: "completed",
        }),
      },
    },
    validLevelIds,
  );

  assert.equal(state.currentLevelId, undefined);
  assert.equal(state.records["led-polarity"].status, "completed");
});

test("repair progress sanitizer rejects malformed records", () => {
  const state = progressCodec.sanitizeRepairProgressState(
    {
      currentLevelId: "lamp-outage",
      records: {
        "lamp-outage": progressRecord("lamp-outage", { completions: -1 }),
        "led-polarity": progressRecord("led-polarity", { lastOpenedAt: "not-a-date" }),
      },
    },
    validLevelIds,
  );

  assert.equal(state.currentLevelId, "lamp-outage");
  assert.deepEqual(state.records, {});
});

test("repair progress sanitizer handles non-object payloads", () => {
  assert.deepEqual(progressCodec.sanitizeRepairProgressState(null, validLevelIds), { records: {} });
  assert.deepEqual(progressCodec.sanitizeRepairProgressState({ records: [] }, validLevelIds), { records: {} });
});

test("repair progress transitions preserve review starts but reset completed tasks on restart", () => {
  const completed = progressRecord("lamp-outage", {
    completedAt: "2026-06-21T10:45:00.000Z",
    completions: 1,
    status: "completed",
  });

  const reviewed = progressCodec.startedRepairProgressRecord(
    "lamp-outage",
    "2026-06-21T11:00:00.000Z",
    completed,
  );
  assert.equal(reviewed.status, "completed");
  assert.equal(reviewed.completedAt, completed.completedAt);
  assert.equal(reviewed.completions, 1);

  const restarted = progressCodec.restartedRepairProgressRecord(
    "lamp-outage",
    "2026-06-21T11:05:00.000Z",
    completed,
  );
  assert.equal(restarted.status, "in-progress");
  assert.equal(restarted.completedAt, undefined);
  assert.equal(restarted.completions, 1);
  assert.equal(restarted.startedAt, "2026-06-21T11:05:00.000Z");
});

test("repair progress completion increments only when moving out of an active attempt", () => {
  const inProgress = progressRecord("lamp-outage", { completions: 1 });
  const completed = progressCodec.completedRepairProgressRecord(
    "lamp-outage",
    "2026-06-21T11:10:00.000Z",
    inProgress,
  );

  assert.equal(completed.status, "completed");
  assert.equal(completed.completions, 2);

  const completedAgain = progressCodec.completedRepairProgressRecord(
    "lamp-outage",
    "2026-06-21T11:20:00.000Z",
    completed,
  );
  assert.equal(completedAgain.completions, 2);
});
