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

test("full adder chains two half adders and merges carries with the published OR gate", () => {
  const modules = [gate("AND"), gate("OR"), gate("NOT")];
  const rows = [
    [false, false, false, false, false], [false, false, true, true, false],
    [false, true, false, true, false], [false, true, true, false, true],
    [true, false, false, true, false], [true, false, true, false, true],
    [true, true, false, false, true], [true, true, true, true, true],
  ];
  for (const [a, b, cin, sum, carry] of rows) {
    const result = logicComposition.composeFullAdder(modules, a, b, cin);
    assert.equal(result.available, true);
    assert.equal(result.sum, sum);
    assert.equal(result.carry, carry);
  }
});

test("eight-bit ripple adder uses full adders to match every byte sum and overflow carry", () => {
  const modules = [gate("AND"), gate("OR"), gate("NOT")];
  const normal = logicComposition.composeByteAdder(modules, 14, 27);
  assert.equal(normal.available, true);
  assert.equal(normal.sum, 41);
  assert.equal(normal.carry, false);
  assert.equal(normal.steps.length, 8);
  for (let left = 0; left <= 255; left += 1) {
    for (let right = 0; right <= 255; right += 1) {
      const result = logicComposition.composeByteAdder(modules, left, right);
      const sum = left + right;
      assert.equal(result.sum, sum & 0xff, `${left} + ${right} should keep the low byte`);
      assert.equal(result.carry, sum > 0xff, `${left} + ${right} should keep the carry`);
    }
  }
});
