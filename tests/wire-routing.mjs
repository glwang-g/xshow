import assert from "node:assert/strict";
import test from "node:test";
import { routeWire, roundedOrthogonalPath } from "../src/lib/wire-routing.ts";

const bounds = { width: 1060, height: 640 };

test("parallel same-side wires receive separate stable corridors", () => {
  const base = { bounds, end: { x: 500, y: 300 }, endSide: 1, start: { x: 200, y: 100 }, startSide: 1 };
  const first = routeWire({ ...base, lane: -0.5 });
  const second = routeWire({ ...base, lane: 0.5 });
  assert.notDeepEqual(first, second);
  assert.notEqual(first[1].x, second[1].x);
  assert.notEqual(first[2].x, second[2].x);
});

test("same-side wires use a clean outside detour without collinear braid points", () => {
  const points = routeWire({
    bounds,
    end: { x: 500, y: 300 },
    endSide: 1,
    start: { x: 200, y: 100 },
    startSide: 1,
  });
  const outside = points[2];
  assert.ok(outside.x > 544);
  assert.ok(points.every((point, index) => {
    if (index === 0 || index === points.length - 1) return true;
    const previous = points[index - 1];
    const next = points[index + 1];
    return !((previous.y === point.y && point.y === next.y) || (previous.x === point.x && point.x === next.x));
  }));
});

test("reversed terminal directions still share one lane group", () => {
  const forward = routeWire({
    bounds,
    end: { x: 500, y: 300 },
    endSide: 1,
    lane: -0.5,
    start: { x: 200, y: 100 },
    startSide: -1,
  });
  const reversed = routeWire({
    bounds,
    end: { x: 200, y: 100 },
    endSide: -1,
    lane: 0.5,
    start: { x: 500, y: 300 },
    startSide: 1,
  });
  assert.notDeepEqual(forward, reversed);
});

test("rounded orthogonal paths remain free of duplicate points", () => {
  const points = routeWire({
    bounds,
    end: { x: 900, y: 520 },
    endSide: -1,
    lane: 0,
    start: { x: 140, y: 120 },
    startSide: 1,
  });
  assert.match(roundedOrthogonalPath(points), /^M /);
  assert.ok(points.every((point, index) => index === 0 || point.x !== points[index - 1].x || point.y !== points[index - 1].y));
  assert.ok(points.every((point, index) => {
    if (index === 0 || index === points.length - 1) return true;
    const previous = points[index - 1];
    const next = points[index + 1];
    return !((previous.y === point.y && point.y === next.y) || (previous.x === point.x && point.x === next.x));
  }));
});
