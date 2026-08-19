import assert from "node:assert/strict";
import test from "node:test";
import { compiledModuleUrl } from "./helpers/compile-module.mjs";

const modules = await import(
  await compiledModuleUrl("../src/lib/published-modules.ts", import.meta.url, [["@/lib/circuit", "./circuit"]]),
);

const parts = [
  { id: "coil-1", name: "线圈", type: "coil", x: 120, y: 200 },
  { controlledBy: "coil-1", id: "spring-1", name: "弹簧开关", type: "spring", contactMode: "normally-closed", x: 120, y: 100 },
];
const wires = [{ id: "wire-1", from: { partId: "coil-1", terminal: "a" }, to: { partId: "spring-1", terminal: "a" } }];

test("publishing a hand-built relay keeps ports and an independent source snapshot", () => {
  const relay = modules.createPublishedRelayModule({
    createdAt: "2026-08-20T00:00:00.000Z",
    id: "relay-test",
    name: "NC Relay",
    parts,
    springId: "spring-1",
    wires,
  });

  assert.equal(relay.name, "NC Relay");
  assert.deepEqual(relay.ports.map((port) => [port.id, port.label]), [
    ["coil-a", "线圈 A"],
    ["coil-b", "线圈 B"],
    ["contact-com", "COM"],
    ["contact-nc", "NC"],
  ]);
  assert.equal(modules.relayOutputForInput(relay, false), true);
  assert.equal(modules.relayOutputForInput(relay, true), false);

  parts[0].x = 999;
  wires[0].from.partId = "changed";
  assert.equal(relay.implementation.parts[0].x, 120);
  assert.equal(relay.implementation.wires[0].from.partId, "coil-1");
});

test("a relay cannot be published before the spring is bound to a coil", () => {
  assert.equal(
    modules.createPublishedRelayModule({ parts: [{ ...parts[1], controlledBy: undefined }], springId: "spring-1", wires: [] }),
    null,
  );
});
