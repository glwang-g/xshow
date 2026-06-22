import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const codec = await import(
  await compiledModuleUrl("../src/lib/workspace-codec.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]])
);

function persistedWorkspace(overrides = {}) {
  return {
    activeLessonId: "light-the-bulb",
    parts: [
      { id: "battery-1", name: "9V 电池", type: "battery", x: 74, y: 280 },
      { id: "switch-1", name: "单刀开关", type: "switch", x: 326, y: 126, closed: true },
      { id: "bulb-1", name: "小灯泡", type: "bulb", x: 658, y: 240 },
      { id: "resistor-1", name: "可变电阻器", type: "resistor", x: 330, y: 472, resistance: 48 },
    ],
    savedAt: "2026-06-21T10:00:00.000Z",
    selectedPartId: "bulb-1",
    version: 1,
    wires: [
      { id: "wire-1", from: { partId: "battery-1", terminal: "b" }, to: { partId: "switch-1", terminal: "a" } },
      { id: "wire-2", from: { partId: "switch-1", terminal: "b" }, to: { partId: "bulb-1", terminal: "a" } },
      { id: "wire-3", from: { partId: "bulb-1", terminal: "b" }, to: { partId: "resistor-1", terminal: "b" } },
      { id: "wire-4", from: { partId: "resistor-1", terminal: "a" }, to: { partId: "battery-1", terminal: "a" } },
    ],
    zoom: 86,
    ...overrides,
  };
}

test("base64url codec round trips unicode workspace payloads", () => {
  const payload = JSON.stringify({
    label: "明石空间",
    note: "LED 正负极与分享链接",
  });

  const encoded = codec.base64UrlEncode(payload);

  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(codec.base64UrlDecode(encoded), payload);
});

test("persisted workspace validator accepts complete workspaces", () => {
  const workspace = persistedWorkspace();

  assert.equal(codec.isPersistedWorkspace(workspace), true);
  assert.equal(codec.isPersistedWorkspace({ ...workspace, selectedPartId: "" }), true);
});

test("persisted workspace validator rejects malformed parts and dangling wires", () => {
  const valid = persistedWorkspace();

  assert.equal(codec.isPersistedWorkspace({ ...valid, parts: [{ id: "battery-1" }] }), false);
  assert.equal(
    codec.isPersistedWorkspace({
      ...valid,
      parts: [
        ...valid.parts,
        { id: "battery-1", name: "duplicate", type: "bulb", x: 0, y: 0 },
      ],
    }),
    false,
  );
  assert.equal(
    codec.isPersistedWorkspace({
      ...valid,
      wires: [
        ...valid.wires,
        { id: "wire-1", from: { partId: "bulb-1", terminal: "a" }, to: { partId: "battery-1", terminal: "b" } },
      ],
    }),
    false,
  );
  assert.equal(
    codec.isPersistedWorkspace({
      ...valid,
      parts: [{ ...valid.parts[0], id: "" }],
    }),
    false,
  );
  assert.equal(
    codec.isPersistedWorkspace({
      ...valid,
      wires: [
        {
          id: "bad-wire",
          from: { partId: "missing-part", terminal: "a" },
          to: { partId: "battery-1", terminal: "b" },
        },
      ],
    }),
    false,
  );
  assert.equal(
    codec.isPersistedWorkspace({
      ...valid,
      wires: [
        {
          id: "bad-wire",
          from: { partId: "switch-1", terminal: "x" },
          to: { partId: "battery-1", terminal: "b" },
        },
      ],
    }),
    false,
  );
});

test("saved workspace record validator requires record metadata", () => {
  const workspace = persistedWorkspace();
  const record = {
    ...workspace,
    id: "record-1",
    title: "串联灯泡记录",
  };

  assert.equal(codec.isSavedWorkspaceRecord(record), true);
  assert.equal(codec.isSavedWorkspaceRecord(workspace), false);
  assert.equal(codec.isSavedWorkspaceRecord({ ...record, id: 1 }), false);
  assert.equal(codec.isSavedWorkspaceRecord({ ...record, title: "   " }), false);
  assert.equal(codec.isSavedWorkspaceRecord({ ...record, savedAt: "not-a-date" }), false);
});

test("cloud workspace record sanitizer keeps valid records and reports dropped rows", () => {
  const workspace = persistedWorkspace();
  const validRecord = {
    created_at: "2026-06-21T09:00:00.000Z",
    id: "cloud-1",
    title: "云端工作台",
    updated_at: "2026-06-21T10:00:00.000Z",
    workspace,
  };

  const result = codec.sanitizeCloudWorkspaceRecords([
    validRecord,
    { ...validRecord, id: "" },
    { ...validRecord, updated_at: "not-a-date" },
    { ...validRecord, workspace: { ...workspace, selectedPartId: "missing" } },
  ]);

  assert.equal(result.droppedCount, 3);
  assert.deepEqual(result.records, [validRecord]);
  assert.equal(codec.sanitizeCloudWorkspaceRecords("not an array").records.length, 0);
});
