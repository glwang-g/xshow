import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const modules = await import(
  await compiledModuleUrl("../src/lib/published-modules.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]]),
);
const lessons = await import(await compiledModuleUrl("../src/data/lessons.ts", import.meta.url));

const parts = [
  { id: "coil-1", name: "线圈", type: "coil", x: 120, y: 200 },
  { controlledBy: "coil-1", id: "spring-1", name: "弹簧开关", type: "spring", contactMode: "normally-closed", x: 120, y: 100 },
];
const wires = [{ id: "wire-1", from: { partId: "coil-1", terminal: "a" }, to: { partId: "spring-1", terminal: "a" } }];

test("publishing a hand-built relay extracts its two-part, four-terminal core", () => {
  const relay = modules.createPublishedRelayModule({
    createdAt: "2026-08-20T00:00:00.000Z",
    id: "relay-test",
    name: "NC Relay",
    parts,
    springId: "spring-1",
    verification: { lessonId: "build-not-gate", truthTable: [{ inputs: [false], output: true }], verifiedAt: "2026-08-20T00:00:00.000Z" },
    wires,
  });

  assert.equal(relay.name, "NC Relay");
  assert.deepEqual(relay.ports.map((port) => [port.id, port.label]), [
    ["coil-a", "线圈 A"],
    ["coil-b", "线圈 B"],
    ["contact-com", "COM"],
    ["contact-nc", "NC"],
  ]);
  assert.equal(modules.relayOutputForInput(relay, false), true);
  assert.equal(modules.relayOutputForInput(relay, true), false);
  assert.deepEqual(relay.implementation.parts.map((part) => part.id), ["coil-1", "spring-1"]);
  assert.equal(relay.implementation.wires.length, 0);
  assert.deepEqual(relay.verification, { lessonId: "build-not-gate", truthTable: [{ inputs: [false], output: true }], verifiedAt: "2026-08-20T00:00:00.000Z" });

  parts[0].x = 999;
  assert.equal(relay.implementation.parts[0].x, 120);
});

test("published relay lessons must pass the complete circuit truth table", () => {
  for (const lessonId of ["build-a-relay", "build-not-gate", "build-and-gate", "build-or-gate"]) {
    const lesson = lessons.lessonCatalog.find((item) => item.id === lessonId);
    const parts = lesson.starterWorkspace.parts.map((part) => part.id === "spring-1" ? { ...part, controlledBy: "coil-1" } : { ...part });
    const result = modules.verifyRelayPublication(parts, lesson.starterWorkspace.wires, lesson.nextStage.moduleName);

    assert.equal(result.passed, true, lessonId);
    assert.equal(result.rows.length, lessonId === "build-and-gate" || lessonId === "build-or-gate" ? 4 : 2);
  }
});

test("a circuit that only lights its output for one lesson state cannot masquerade as a gate", () => {
  const lesson = lessons.lessonCatalog.find((item) => item.id === "build-and-gate");
  const parts = lesson.starterWorkspace.parts.map((part) => part.id === "spring-1" ? { ...part, controlledBy: "coil-1" } : { ...part });
  const brokenWires = lesson.starterWorkspace.wires.filter((wire) => wire.id !== "wire-input-series-2");

  assert.equal(modules.verifyRelayPublication(parts, brokenWires, lesson.nextStage.moduleName).passed, false);
});

test("a relay cannot be published before the spring is bound to a coil", () => {
  assert.equal(
    modules.createPublishedRelayModule({ parts: [{ ...parts[1], controlledBy: undefined }], springId: "spring-1", wires: [] }),
    null,
  );
});

test("malformed locally stored modules are ignored instead of breaking the logic lab", () => {
  const storage = {
    getItem: () => JSON.stringify([{ id: "bad", kind: "relay", name: "broken", ports: [] }]),
    setItem: () => undefined,
  };

  assert.deepEqual(modules.loadPublishedRelayModules(storage), []);
});

test("modules published before truth-table records remain readable", () => {
  const relay = modules.createPublishedRelayModule({
    id: "legacy-relay",
    name: "RelaySwitch",
    parts,
    springId: "spring-1",
    wires,
  });
  relay.verification = { lessonId: "build-a-relay", verifiedAt: "2026-08-20T00:00:00.000Z" };
  const storage = {
    getItem: () => JSON.stringify([relay]),
    setItem: () => undefined,
  };

  assert.deepEqual(modules.loadPublishedRelayModules(storage)[0].verification.truthTable, []);
});

test("published modules can be renamed without accepting blank names", () => {
  const relay = modules.createPublishedRelayModule({ id: "rename-relay", parts, springId: "spring-1", wires });
  let saved = JSON.stringify([relay]);
  const storage = {
    getItem: () => saved,
    setItem: (_key, value) => { saved = value; },
  };

  assert.equal(modules.renamePublishedRelayModule("rename-relay", "  我的继电器  ", storage), true);
  assert.equal(modules.loadPublishedRelayModules(storage)[0].name, "我的继电器");
  assert.equal(modules.renamePublishedRelayModule("rename-relay", "   ", storage), false);
});
