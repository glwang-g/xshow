import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const logicCore = await import(await compiledModuleUrl("../src/lib/logic-core.ts", import.meta.url));
const registerMission = await import(await compiledModuleUrl("../src/lib/clocked-register-mission.ts", import.meta.url));

test("logic gates produce stable truth tables", () => {
  assert.deepEqual(logicCore.truthTable("AND").map((row) => row.out), [0, 0, 0, 1]);
  assert.deepEqual(logicCore.truthTable("OR").map((row) => row.out), [0, 1, 1, 1]);
  assert.deepEqual(logicCore.truthTable("XOR").map((row) => row.out), [0, 1, 1, 0]);
  assert.deepEqual(logicCore.truthTable("NOT"), [
    { a: 0, b: null, out: 1 },
    { a: 1, b: null, out: 0 },
  ]);
});

test("sr latch trace keeps state until set or reset changes it", () => {
  const trace = logicCore.buildSrLatchTrace([
    { set: false, reset: false },
    { set: true, reset: false },
    { set: false, reset: false },
    { set: false, reset: true },
    { set: false, reset: false },
  ]);

  assert.deepEqual(
    trace.map((step) => [step.mode, step.q, step.notQ]),
    [
      ["hold", 0, 1],
      ["set", 1, 0],
      ["hold", 1, 0],
      ["reset", 0, 1],
      ["hold", 0, 1],
    ],
  );
});

test("sr latch marks simultaneous set and reset as invalid without advancing memory", () => {
  const trace = logicCore.buildSrLatchTrace([
    { set: true, reset: false },
    { set: true, reset: true },
    { set: false, reset: false },
  ]);

  assert.equal(trace[0].q, 1);
  assert.equal(trace[1].mode, "invalid");
  assert.equal(trace[2].q, 1);
});

test("register trace captures data only on rising clock edges", () => {
  const trace = logicCore.buildRegisterTrace([
    { label: "t0", clock: false, data: 0 },
    { label: "t1", clock: true, data: 1 },
    { label: "t2", clock: true, data: 0 },
    { label: "t3", clock: false, data: 0 },
    { label: "t4", clock: true, data: 0 },
  ]);

  assert.deepEqual(
    trace.map((step) => [step.captured, step.q]),
    [
      [false, 0],
      [true, 1],
      [false, 1],
      [false, 1],
      [true, 0],
    ],
  );
});

test("clocked register mission records a replayable capture event", () => {
  let state = registerMission.createClockedRegisterMissionState();
  state = registerMission.tickClockedRegisterMission(state, { source: "user", type: "set-input", payload: { data: 1, clock: 0 } });
  state = registerMission.tickClockedRegisterMission(state, { source: "user", type: "pulse-clock", payload: { clock: 1 } });

  assert.equal(state.data.q, 1);
  assert.equal(state.tick, 2);
  assert.deepEqual(state.events.map((event) => event.type), ["register.held", "register.captured"]);
  assert.equal(state.events.at(-1).payload.captured, true);
});

test("clocked register capture projects to the shared Rule Mission event shape", () => {
  let state = registerMission.createClockedRegisterMissionState();
  state = registerMission.tickClockedRegisterMission(state, { source: "user", type: "set-input", payload: { data: 1, clock: 1 } });
  const projected = registerMission.projectRegisterMissionEvent(state.events.at(-1));

  assert.deepEqual(projected, {
    tick: 1,
    actor: "learner",
    action: "capture_register",
    facts: ["clock=1", "D=1", "edge=rising"],
    consequences: ["Q captured 1"],
    visible_to: ["learner", "history"],
  });
});
