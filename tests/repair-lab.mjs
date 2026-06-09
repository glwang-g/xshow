import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { transformWithEsbuild } from "vite";

async function compiledModuleUrl(path, replacements = []) {
  let source = await readFile(new URL(path, import.meta.url), "utf8");
  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to);
  }

  const { code } = await transformWithEsbuild(source, path, {
    format: "esm",
    loader: "ts",
  });
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts");
const repairLabModuleUrl = await compiledModuleUrl("../src/lib/repair-lab.ts", [["@/lib/circuit", circuitModuleUrl]]);
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
});
