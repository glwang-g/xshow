import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const publishedModulesUrl = await compiledModuleUrl("../src/lib/published-modules.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]]);
const machineBuildUrl = await compiledModuleUrl("../src/lib/machine-build.ts", import.meta.url, [["@/lib/published-modules", publishedModulesUrl]]);
const machineBuild = await import(machineBuildUrl);
const logicComposition = await import(await compiledModuleUrl("../src/lib/logic-composition.ts", import.meta.url, [["@/lib/machine-build", machineBuildUrl], ["@/lib/published-modules", publishedModulesUrl]]));

function gate(kind) {
  const combinations = kind === "AND" || kind === "OR" ? [[false, false], [false, true], [true, false], [true, true]] : [[false], [true]];
  const outputFor = (inputs) => kind === "AND" ? inputs[0] && inputs[1] : kind === "OR" ? inputs[0] || inputs[1] : !inputs[0];
  return { behavior: { contactMode: "normally-open", gate: kind, pullInCurrentMilliAmps: 30 }, createdAt: "2026-08-23T00:00:00.000Z", id: kind, implementation: { coilId: "coil", parts: [], springId: "spring", wires: [] }, kind: "logic-gate", name: `我的 ${kind}`, ports: [], verification: { lessonId: `build-${kind.toLowerCase()}-gate`, truthTable: combinations.map((inputs) => ({ inputs, output: outputFor(inputs) })), verifiedAt: "2026-08-23T00:00:00.000Z" }, version: 1 };
}

test("half adder composes verified workshop gates into sum and carry", () => {
  const modules = [gate("AND"), gate("OR"), gate("NOT")];
  assert.equal(machineBuild.buildMachineLogicManifest(modules).ready, true);
  const rows = [[false, false, false, false], [false, true, true, false], [true, false, true, false], [true, true, false, true]];
  for (const [a, b, sum, carry] of rows) {
    const result = logicComposition.composeHalfAdder(modules, a, b);
    assert.equal(result.available, true);
    assert.equal(result.sum, sum);
    assert.equal(result.carry, carry);
  }
});

test("half adder stays unavailable until all source gates are verified", () => {
  const result = logicComposition.composeHalfAdder([gate("AND"), gate("OR")], false, true);
  assert.equal(result.available, false);
  assert.deepEqual(result.missing, ["NOT"]);
});
