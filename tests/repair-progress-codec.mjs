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
