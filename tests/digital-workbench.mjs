import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const simulationUrl = await compiledModuleUrl("../src/lib/simulation-contract.ts", import.meta.url);
const logicCoreUrl = await compiledModuleUrl("../src/lib/logic-core.ts", import.meta.url);
const registerMissionUrl = await compiledModuleUrl(
  "../src/lib/clocked-register-mission.ts",
  import.meta.url,
  [["@/lib/logic-core", logicCoreUrl], ["@/lib/simulation-contract", simulationUrl]],
);
const digitalWorkbench = await import(await compiledModuleUrl(
  "../src/lib/digital-workbench.ts",
  import.meta.url,
  [["@/lib/logic-core", logicCoreUrl], ["@/lib/clocked-register-mission", registerMissionUrl], ["@/lib/simulation-contract", simulationUrl]],
));

test("digital workbench treats one learner operation as a complete register clock cycle", () => {
  let board = digitalWorkbench.createRegisterWorkbenchState();
  board = digitalWorkbench.setWorkbenchData(board, 1);
  board = digitalWorkbench.advanceRegisterWorkbenchCycle(board);

  assert.equal(board.register.tick, 2);
  assert.equal(board.register.data.clock, 0);
  assert.equal(board.register.data.q, 1);
  assert.deepEqual(board.lastMission, {
    tick: 1,
    actor: "learner",
    action: "capture_register",
    facts: ["clock=1", "D=1", "edge=rising"],
    consequences: ["Q captured 1"],
    visible_to: ["learner", "history"],
  });
});

test("changing a digital input does not bypass the clocked state boundary", () => {
  let board = digitalWorkbench.createRegisterWorkbenchState();
  board = digitalWorkbench.setWorkbenchData(board, 1);
  assert.equal(board.register.data.q, 0);

  board = digitalWorkbench.advanceRegisterWorkbenchCycle(board);
  board = digitalWorkbench.setWorkbenchData(board, 0);
  assert.equal(board.register.data.q, 1);
});
