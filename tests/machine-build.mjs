import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const publishedModulesUrl = await compiledModuleUrl(
  "../src/lib/published-modules.ts",
  import.meta.url,
  [["@/lib/circuit", circuitModuleUrl]],
);
const machineBuild = await import(
  await compiledModuleUrl("../src/lib/machine-build.ts", import.meta.url, [["@/lib/published-modules", publishedModulesUrl]]),
);

function gate(name, kind, rows) {
  return {
    behavior: { contactMode: "normally-open", gate: kind, pullInCurrentMilliAmps: 30 },
    createdAt: "2026-08-23T00:00:00.000Z",
    id: `${kind}-${name}`,
    implementation: { coilId: "coil", parts: [], springId: "spring", wires: [] },
    kind: "logic-gate",
    name,
    ports: [],
    verification: { lessonId: `build-${kind.toLowerCase()}-gate`, truthTable: Array.from({ length: rows }, () => ({ inputs: [], output: false })), verifiedAt: "2026-08-23T00:00:00.000Z" },
    version: 1,
  };
}

test("machine logic manifest only consumes fully verified workshop gates", () => {
  const incomplete = gate("未完成 AND", "AND", 1);
  assert.deepEqual(machineBuild.buildMachineLogicManifest([incomplete]).missing.map((slot) => slot.gate), ["AND", "OR", "NOT"]);

  const manifest = machineBuild.buildMachineLogicManifest([
    incomplete,
    gate("我的 AND", "AND", 4),
    gate("我的 OR", "OR", 4),
    gate("我的 NOT", "NOT", 2),
  ]);

  assert.equal(manifest.ready, true);
  assert.deepEqual(manifest.slots.map((slot) => slot.module.name), ["我的 AND", "我的 OR", "我的 NOT"]);
});

test("machine logic manifest does not accept a relay as a claimed gate", () => {
  const relay = { ...gate("普通继电器", "AND", 4), kind: "relay" };
  assert.deepEqual(machineBuild.buildMachineLogicManifest([relay]).missing.map((slot) => slot.gate), ["AND", "OR", "NOT"]);
});
