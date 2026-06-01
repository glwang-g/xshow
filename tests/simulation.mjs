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
const circuit = await import(circuitModuleUrl);
const buildPlan = await import(
  await compiledModuleUrl("../src/lib/physical-build.ts", [["@/lib/circuit", circuitModuleUrl]])
);

function part(id, type, overrides = {}) {
  return {
    id,
    name: id,
    type,
    x: 0,
    y: 0,
    ...overrides,
  };
}

function terminal(partId, terminalKey) {
  return {
    partId,
    terminal: terminalKey,
  };
}

function wire(id, fromPartId, fromTerminal, toPartId, toTerminal) {
  return {
    id,
    from: terminal(fromPartId, fromTerminal),
    to: terminal(toPartId, toTerminal),
  };
}

function singleBulbCircuit({ battery = {}, resistance = 48, switchClosed = true } = {}) {
  return {
    parts: [
      part("battery", "battery", battery),
      part("switch", "switch", { closed: switchClosed }),
      part("bulb", "bulb"),
      part("resistor", "resistor", { resistance }),
    ],
    wires: [
      wire("wire-1", "battery", "b", "switch", "a"),
      wire("wire-2", "switch", "b", "bulb", "a"),
      wire("wire-3", "bulb", "b", "resistor", "b"),
      wire("wire-4", "resistor", "a", "battery", "a"),
    ],
  };
}

function seriesBulbsCircuit() {
  return {
    parts: [
      part("battery", "battery"),
      part("switch", "switch", { closed: true }),
      part("bulb-a", "bulb"),
      part("bulb-b", "bulb"),
      part("resistor", "resistor", { resistance: 48 }),
    ],
    wires: [
      wire("wire-1", "battery", "b", "switch", "a"),
      wire("wire-2", "switch", "b", "bulb-a", "a"),
      wire("wire-3", "bulb-a", "b", "bulb-b", "a"),
      wire("wire-4", "bulb-b", "b", "resistor", "b"),
      wire("wire-5", "resistor", "a", "battery", "a"),
    ],
  };
}

function parallelBulbsCircuit({ resistance = 24 } = {}) {
  return {
    parts: [
      part("battery", "battery"),
      part("switch", "switch", { closed: true }),
      part("bulb-a", "bulb"),
      part("bulb-b", "bulb"),
      part("resistor", "resistor", { resistance }),
    ],
    wires: [
      wire("wire-1", "battery", "b", "switch", "a"),
      wire("wire-2", "switch", "b", "bulb-a", "a"),
      wire("wire-3", "switch", "b", "bulb-b", "a"),
      wire("wire-4", "bulb-a", "b", "resistor", "b"),
      wire("wire-5", "bulb-b", "b", "resistor", "b"),
      wire("wire-6", "resistor", "a", "battery", "a"),
    ],
  };
}

function evaluate(workspace) {
  return circuit.evaluateCircuit(workspace.parts, workspace.wires);
}

test("single bulb loop solves current, resistance, and brightness", () => {
  const result = evaluate(singleBulbCircuit());

  assert.equal(result.closed, true);
  assert.equal(result.currentMilliAmps, 136);
  assert.equal(result.equivalentResistance, 66);
  assert.equal(result.bulbs.bulb.brightnessPercent, 27);
});

test("open switch interrupts current and turns the bulb off", () => {
  const result = evaluate(singleBulbCircuit({ switchClosed: false }));

  assert.equal(result.closed, false);
  assert.equal(result.currentMilliAmps, 0);
  assert.equal(result.bulbs.bulb.brightnessPercent, 0);
});

test("series bulbs share one path and are dimmer than a single bulb", () => {
  const single = evaluate(singleBulbCircuit());
  const series = evaluate(seriesBulbsCircuit());

  assert.equal(series.closed, true);
  assert.equal(series.currentMilliAmps, 107);
  assert.equal(series.equivalentResistance, 84);
  assert.equal(series.bulbs["bulb-a"].brightnessPercent, 21);
  assert.equal(series.bulbs["bulb-b"].brightnessPercent, 21);
  assert.ok(series.bulbs["bulb-a"].brightness < single.bulbs.bulb.brightness);
});

test("parallel bulbs split current into two visible branches", () => {
  const series = evaluate(seriesBulbsCircuit());
  const parallel = evaluate(parallelBulbsCircuit());

  assert.equal(parallel.closed, true);
  assert.equal(parallel.currentMilliAmps, 273);
  assert.equal(parallel.equivalentResistance, 33);
  assert.equal(parallel.bulbs["bulb-a"].brightnessPercent, 27);
  assert.equal(parallel.bulbs["bulb-b"].brightnessPercent, 27);
  assert.ok(parallel.currentMilliAmps > series.currentMilliAmps);
  assert.ok(parallel.bulbs["bulb-a"].brightness > series.bulbs["bulb-a"].brightness);
});

test("LED conducts forward and blocks when reversed", () => {
  const parts = [
    part("battery", "battery"),
    part("switch", "switch", { closed: true }),
    part("resistor", "resistor", { resistance: 120 }),
    part("led", "led"),
  ];
  const forward = [
    wire("wire-1", "battery", "b", "switch", "a"),
    wire("wire-2", "switch", "b", "resistor", "a"),
    wire("wire-3", "resistor", "b", "led", "b"),
    wire("wire-4", "led", "a", "battery", "a"),
  ];
  const reversed = [
    wire("wire-1", "battery", "b", "switch", "a"),
    wire("wire-2", "switch", "b", "resistor", "a"),
    wire("wire-3", "resistor", "b", "led", "a"),
    wire("wire-4", "led", "b", "battery", "a"),
  ];

  const forwardResult = circuit.evaluateCircuit(parts, forward);
  const reversedResult = circuit.evaluateCircuit(parts, reversed);

  assert.equal(forwardResult.closed, true);
  assert.equal(forwardResult.leds.led.forward, true);
  assert.equal(forwardResult.leds.led.reversed, false);
  assert.equal(forwardResult.leds.led.overCurrent, false);
  assert.ok(forwardResult.leds.led.brightnessPercent > 0);
  assert.equal(reversedResult.closed, false);
  assert.equal(reversedResult.leds.led.forward, false);
  assert.equal(reversedResult.leds.led.reversed, true);
  assert.equal(reversedResult.leds.led.brightnessPercent, 0);
});

test("diode conducts forward and blocks reverse current", () => {
  const parts = [
    part("battery", "battery"),
    part("resistor", "resistor", { resistance: 120 }),
    part("diode", "diode"),
  ];
  const forward = [
    wire("wire-1", "battery", "b", "resistor", "a"),
    wire("wire-2", "resistor", "b", "diode", "b"),
    wire("wire-3", "diode", "a", "battery", "a"),
  ];
  const reversed = [
    wire("wire-1", "battery", "b", "resistor", "a"),
    wire("wire-2", "resistor", "b", "diode", "a"),
    wire("wire-3", "diode", "b", "battery", "a"),
  ];

  const forwardResult = circuit.evaluateCircuit(parts, forward);
  const reversedResult = circuit.evaluateCircuit(parts, reversed);

  assert.equal(forwardResult.closed, true);
  assert.equal(forwardResult.diodes.diode.forward, true);
  assert.equal(forwardResult.diodes.diode.conducting, true);
  assert.equal(reversedResult.closed, false);
  assert.equal(reversedResult.diodes.diode.reversed, true);
  assert.equal(reversedResult.diodes.diode.conducting, false);
});

test("ammeter reports the current through its branch", () => {
  const parts = [
    part("battery", "battery"),
    part("switch", "switch", { closed: true }),
    part("ammeter", "ammeter"),
    part("bulb", "bulb"),
    part("resistor", "resistor", { resistance: 48 }),
  ];
  const wires = [
    wire("wire-1", "battery", "b", "switch", "a"),
    wire("wire-2", "switch", "b", "ammeter", "a"),
    wire("wire-3", "ammeter", "b", "bulb", "a"),
    wire("wire-4", "bulb", "b", "resistor", "b"),
    wire("wire-5", "resistor", "a", "battery", "a"),
  ];
  const result = circuit.evaluateCircuit(parts, wires);

  assert.equal(result.closed, true);
  assert.equal(result.currentMilliAmps, 134);
  assert.equal(result.ammeters.ammeter.active, true);
  assert.equal(result.ammeters.ammeter.currentMilliAmps, result.currentMilliAmps);
});

test("voltmeter reads voltage across connected nodes without closing the circuit", () => {
  const parts = [part("battery", "battery"), part("voltmeter", "voltmeter")];
  const wires = [
    wire("wire-1", "battery", "b", "voltmeter", "b"),
    wire("wire-2", "battery", "a", "voltmeter", "a"),
  ];
  const result = circuit.evaluateCircuit(parts, wires);

  assert.equal(result.closed, false);
  assert.equal(result.currentMilliAmps, 0);
  assert.equal(result.voltmeters.voltmeter.active, true);
  assert.equal(result.voltmeters.voltmeter.voltage, 9);
});

test("reversing battery polarity flips wire animation direction", () => {
  const normal = evaluate(singleBulbCircuit());
  const reversed = evaluate(singleBulbCircuit({ battery: { polarity: "reversed" } }));

  assert.equal(normal.currentMilliAmps, reversed.currentMilliAmps);
  assert.equal(normal.wires["wire-1"].reverse, false);
  assert.equal(reversed.wires["wire-1"].reverse, true);
});

test("physical build plan turns the workspace into a component list and wiring steps", () => {
  const workspace = singleBulbCircuit();
  const plan = buildPlan.createPhysicalBuildPlan(workspace.parts, workspace.wires);
  const markdown = buildPlan.formatPhysicalBuildPlanMarkdown(plan);

  assert.equal(plan.ready, true);
  assert.equal(plan.connections.length, workspace.wires.length);
  assert.deepEqual(
    plan.items.map((item) => [item.id, item.quantity]),
    [
      ["battery", 1],
      ["switch", 1],
      ["bulb", 1],
      ["resistor", 1],
      ["wire", 4],
    ],
  );
  assert.ok(plan.items.find((item) => item.id === "wire").purchaseKeywords.includes("杜邦线"));
  assert.match(plan.connections[0].instruction, /battery \+端/);
  assert.match(markdown, /## 物料/);
  assert.match(markdown, /采购关键词/);
  assert.match(markdown, /## 接线步骤/);
});

test("physical build plan warns about LED circuits without current limiting", () => {
  const parts = [part("battery", "battery"), part("led", "led")];
  const wires = [
    wire("wire-1", "battery", "b", "led", "b"),
    wire("wire-2", "led", "a", "battery", "a"),
  ];
  const plan = buildPlan.createPhysicalBuildPlan(parts, wires);

  assert.equal(plan.ready, true);
  assert.ok(plan.warnings.some((warning) => warning.id === "missing-current-limit"));
});
