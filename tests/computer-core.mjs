import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const computerCore = await import(await compiledModuleUrl("../src/lib/computer-core.ts", import.meta.url));

test("computer core preview snapshot matches sample program state", () => {
  const snapshot = computerCore.previewCpuSnapshot;

  assert.equal(snapshot.a, 3);
  assert.equal(snapshot.b, 2);
  assert.equal(snapshot.pc, 0x0c);
  assert.equal(snapshot.currentInstruction, "HALT");
  assert.equal(snapshot.memory[0x40], 3);
  assert.equal(snapshot.memory.length, 256);
  assert.equal(snapshot.log.at(-1), "[  5] 0x0C: HALT");
});

test("computer core helpers format bytes and expose register rows", () => {
  assert.equal(computerCore.formatHex(0x0c), "0C");
  assert.equal(computerCore.formatHex(0x0f, 1), "F");
  assert.equal(computerCore.formatByte(3), "0x03 · 3 · 0000_0011");

  const rows = computerCore.registerRows(computerCore.previewCpuSnapshot);
  assert.deepEqual(
    rows.map((row) => row.label),
    ["A", "B", "PC", "FLAGS"],
  );
});

test("computer core memory rows split 256 bytes into 16x16 monitor table", () => {
  const rows = computerCore.memoryRows(computerCore.previewCpuSnapshot);

  assert.equal(rows.length, 16);
  assert.equal(rows[0].base, 0);
  assert.equal(rows[0].cells.length, 16);
  assert.equal(rows[0].cells[12].byte, 0xff);
  assert.equal(rows[4].base, 0x40);
  assert.equal(rows[4].cells[0].byte, 3);
});

test("computer core preview adapter steps through the bundled sample", async () => {
  const core = computerCore.createPreviewComputerCore();

  let snapshot = await core.getState();
  assert.equal(snapshot.pc, 0x00);
  assert.equal(snapshot.a, 0);
  assert.equal(snapshot.memory[0x40], 0);
  assert.equal(snapshot.currentInstruction, "MOV A, #1");

  snapshot = await core.step();
  assert.equal(snapshot.pc, 0x03);
  assert.equal(snapshot.a, 1);
  assert.equal(snapshot.currentInstruction, "MOV B, #2");

  snapshot = await core.runUntilHalt(64);
  assert.equal(snapshot.halted, true);
  assert.equal(snapshot.a, 3);
  assert.equal(snapshot.memory[0x40], 3);
  assert.equal(snapshot.log.at(-1), "[  5] 0x0C: HALT");
});

test("computer core preview adapter also runs the algorithm lab's parameterized addition program", async () => {
  const core = computerCore.createPreviewComputerCore();
  const source = "MOV A, #250\nMOV B, #10\nADD A, B\nSTORE A, 0x40\nHALT";

  assert.equal(computerCore.canPreviewSource(source), true);
  await core.loadProgram(source);
  const snapshot = await core.runUntilHalt(16);

  assert.equal(snapshot.a, 4);
  assert.equal(snapshot.b, 10);
  assert.equal(snapshot.memory[0x40], 4);
  assert.equal(snapshot.flags.c, true);
});

test("computer core preview adapter keeps reset and custom source honest", async () => {
  const core = computerCore.createPreviewComputerCore();

  let snapshot = await core.reset();
  assert.equal(snapshot.pc, 0);
  assert.equal(snapshot.log.length, 0);
  assert.equal(snapshot.memory.every((byte) => byte === 0), true);

  snapshot = await core.step();
  assert.equal(snapshot.pc, 0);
  assert.equal(snapshot.log.length, 0);
  assert.equal(snapshot.currentInstruction, ".byte 0x00");

  assert.equal(computerCore.canPreviewSource(computerCore.sampleAssemblySource), true);
  assert.equal(computerCore.canPreviewSource("MOV A, #7\nHALT"), false);

  snapshot = await core.loadProgram("MOV A, #7\nHALT");
  assert.equal(snapshot.halted, true);
  assert.equal(snapshot.currentInstruction, "WASM bridge pending");
  assert.match(snapshot.log.join("\n"), /Other custom assembly/);
});

test("computer core wasm adapter wraps a wasm-shaped module", async () => {
  const fakeState = {
    ...computerCore.previewCpuSnapshot,
    flags: { ...computerCore.previewCpuSnapshot.flags },
    log: [...computerCore.previewCpuSnapshot.log],
    memory: [...computerCore.previewCpuSnapshot.memory],
  };
  const calls = [];
  const core = computerCore.createWasmComputerCore({
    getState() {
      calls.push("getState");
      return fakeState;
    },
    loadProgram(source) {
      calls.push(`load:${source}`);
      return fakeState;
    },
    reset() {
      calls.push("reset");
      return fakeState;
    },
    runUntilHalt(maxSteps) {
      calls.push(`run:${maxSteps}`);
      return fakeState;
    },
    step() {
      calls.push("step");
      return fakeState;
    },
  });

  const loaded = await core.loadProgram(computerCore.sampleAssemblySource);
  loaded.memory[0] = 0xaa;
  loaded.log.push("local mutation");

  const stepped = await core.step();
  await core.runUntilHalt(32);

  assert.equal(stepped.memory[0], computerCore.previewCpuSnapshot.memory[0]);
  assert.equal(stepped.log.includes("local mutation"), false);
  assert.deepEqual(calls, [`load:${computerCore.sampleAssemblySource}`, "step", "run:32"]);
});
