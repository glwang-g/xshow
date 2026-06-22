import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const repairLabModuleUrl = await compiledModuleUrl("../src/lib/repair-lab.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]]);
const circuit = await import(circuitModuleUrl);
const repairLab = await import(repairLabModuleUrl);

function evaluateLevel(level) {
  return repairLab.evaluateRepairLevel(level, circuit.evaluateCircuit(level.workspace.parts, level.workspace.wires));
}

test("lamp outage preset needs switch and resistance repair", () => {
  const level = repairLab.cloneRepairLevel(repairLab.repairLevelPresets[0]);

  assert.equal(evaluateLevel(level).solved, false);

  level.workspace.parts.find((part) => part.id === "switch-1").closed = true;
  level.workspace.parts.find((part) => part.id === "resistor-1").resistance = 48;

  const solved = evaluateLevel(level);
  assert.equal(solved.solved, true);
  assert.ok(solved.checks.every((check) => check.passed));
});

test("led preset is solved after polarity correction", () => {
  const level = repairLab.cloneRepairLevel(repairLab.repairLevelPresets[1]);

  assert.equal(evaluateLevel(level).solved, false);

  level.workspace.parts.find((part) => part.id === "battery-1").polarity = "normal";

  const solved = evaluateLevel(level);
  assert.equal(solved.solved, true);
});

test("repair level parser rejects invalid structure", () => {
  assert.throws(() => repairLab.parseRepairLevelJson("{\"id\":1}"), /title|JSON/);
  assert.throws(() => repairLab.parseRepairLevelJson("not json"));
  assert.throws(
    () =>
      repairLab.parseRepairLevelJson(
        JSON.stringify({
          ...repairLab.repairLevelPresets[0],
          workspace: {
            parts: [{ id: "battery-1" }],
            wires: [],
          },
        }),
      ),
    /parts|workspace/,
  );
  assert.throws(
    () =>
      repairLab.parseRepairLevelJson(
        JSON.stringify({
          ...repairLab.repairLevelPresets[0],
          goal: {
            parts: {
              "missing-part": { closed: true },
            },
          },
        }),
      ),
    /不存在/,
  );
  assert.throws(
    () =>
      repairLab.parseRepairLevelJson(
        JSON.stringify({
          ...repairLab.repairLevelPresets[0],
          goal: {
            parts: 1,
          },
        }),
      ),
    /goal\.parts/,
  );
});

test("repair level parser accepts complete preset exports", () => {
  const parsed = repairLab.parseRepairLevelJson(repairLab.repairLevelToJson(repairLab.repairLevelPresets[0]));

  assert.equal(parsed.id, repairLab.repairLevelPresets[0].id);
  assert.deepEqual(parsed.workspace.wires, repairLab.repairLevelPresets[0].workspace.wires);
});
