import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const circuitModuleUrl = await compiledModuleUrl("../src/lib/circuit.ts", import.meta.url);
const lessons = await import(await compiledModuleUrl("../src/data/lessons.ts", import.meta.url));
const repairLab = await import(
  await compiledModuleUrl("../src/lib/repair-lab.ts", import.meta.url, [["@/lib/circuit", circuitModuleUrl]])
);
const circuit = await import(circuitModuleUrl);

const lessonCheckIds = new Set([
  "hasStarterParts",
  "hasClosedCircuit",
  "hasOpenCircuit",
  "hasClosedSwitch",
  "hasOpenSwitch",
  "hasLitBulb",
  "hasDarkBulb",
  "hasBrightBulb",
  "hasLowResistance",
  "hasAdjustedResistor",
  "hasLedParts",
  "hasForwardLed",
  "hasLitLed",
  "hasSafeLedCurrent",
  "hasTwoBulbs",
  "hasTwoLitBulbs",
  "hasSeriesBulbs",
  "hasParallelBulbs",
  "hasDimSeriesBulbs",
  "hasBrightParallelBulbs",
]);

function assertUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} should be unique`);
}

function assertTerminal(ref, partIds, label) {
  assert.ok(partIds.has(ref.partId), `${label} should reference an existing part`);
  assert.ok(ref.terminal === "a" || ref.terminal === "b", `${label} should use terminal a or b`);
}

function assertWorkspaceIntegrity(workspace, label) {
  assert.ok(workspace.parts.length > 0, `${label} should include parts`);
  assert.ok(workspace.zoom > 0, `${label} should use a positive zoom`);

  const partIdList = workspace.parts.map((part) => part.id);
  const partIds = new Set(partIdList);
  assertUnique(partIdList, `${label} part ids`);

  if (workspace.selectedPartId) {
    assert.ok(partIds.has(workspace.selectedPartId), `${label} selected part should exist`);
  }

  for (const part of workspace.parts) {
    assert.equal(typeof part.name, "string", `${label} part name should be text`);
    assert.equal(typeof part.type, "string", `${label} part type should be text`);
    assert.equal(typeof part.x, "number", `${label} part x should be numeric`);
    assert.equal(typeof part.y, "number", `${label} part y should be numeric`);
  }

  assertUnique(workspace.wires.map((wire) => wire.id), `${label} wire ids`);
  for (const wire of workspace.wires) {
    assertTerminal(wire.from, partIds, `${label} wire ${wire.id} from`);
    assertTerminal(wire.to, partIds, `${label} wire ${wire.id} to`);
  }
}

test("lesson catalog has valid workspaces, guides, and check ids", () => {
  assert.ok(lessons.lessonCatalog.length > 0);
  assertUnique(lessons.lessonCatalog.map((lesson) => lesson.id), "lesson ids");

  for (const lesson of lessons.lessonCatalog) {
    assertWorkspaceIntegrity(lesson.starterWorkspace, `lesson ${lesson.id}`);
    assert.ok(lesson.steps.length > 0, `lesson ${lesson.id} should include steps`);
    assertUnique(lesson.steps.map((step) => step.id), `lesson ${lesson.id} step ids`);

    const partIds = new Set(lesson.starterWorkspace.parts.map((part) => part.id));
    for (const step of lesson.steps) {
      assert.ok(lessonCheckIds.has(step.checkId), `lesson ${lesson.id} step ${step.id} has an unknown check id`);
      for (const partId of step.guide?.partIds ?? []) {
        assert.ok(partIds.has(partId), `lesson ${lesson.id} step ${step.id} guide part should exist`);
      }
      for (const terminal of step.guide?.terminalRefs ?? []) {
        assertTerminal(terminal, partIds, `lesson ${lesson.id} step ${step.id} guide terminal`);
      }
    }
  }
});

test("repair level presets have valid topology and start unsolved", () => {
  assert.ok(repairLab.repairLevelPresets.length > 0);
  assertUnique(repairLab.repairLevelPresets.map((level) => level.id), "repair level ids");

  for (const level of repairLab.repairLevelPresets) {
    assertWorkspaceIntegrity(
      {
        ...level.workspace,
        selectedPartId: level.workspace.parts[0]?.id ?? "",
        zoom: 86,
      },
      `repair level ${level.id}`,
    );

    const partIds = new Set(level.workspace.parts.map((part) => part.id));
    for (const partId of Object.keys(level.goal.parts ?? {})) {
      assert.ok(partIds.has(partId), `repair level ${level.id} part goal should reference an existing part`);
    }
    for (const group of ["bulbs", "buzzers", "diodes", "leds", "motors", "voltmeters"]) {
      for (const partId of Object.keys(level.goal[group] ?? {})) {
        assert.ok(partIds.has(partId), `repair level ${level.id} ${group} goal should reference an existing part`);
      }
    }

    const simulation = circuit.evaluateCircuit(level.workspace.parts, level.workspace.wires);
    const evaluation = repairLab.evaluateRepairLevel(level, simulation);
    assert.ok(evaluation.checks.length > 0, `repair level ${level.id} should produce checks`);
    assert.equal(evaluation.solved, false, `repair level ${level.id} should start as an unsolved scenario`);
  }
});
