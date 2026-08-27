import type { Ref } from "vue";
import type { CircuitPart, TerminalKey, TerminalRef } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Point = { x: number; y: number };
export type TerminalHit = { distance: number; position: Point; ref: TerminalRef };

type Options = {
  expandWorkbenchTo: (x: number, y: number) => void;
  getSpec: (part: CircuitPart) => PartSpec;
  getTerminalPosition: (ref: TerminalRef) => Point;
  limitHeight: () => number;
  limitWidth: () => number;
  parts: Ref<CircuitPart[]>;
};

export function useWorkbenchGeometry(options: Options) {
  function allTerminals() {
    return options.parts.value.flatMap((part) => {
      const terminals: TerminalKey[] = part.type === "module" ? ["a", "b", "com", "out"] : ["a", "b"];
      return terminals.map((terminal) => ({
        ref: { partId: part.id, terminal },
        position: options.getTerminalPosition({ partId: part.id, terminal }),
      }));
    });
  }

  function closestTerminal(point: Point, excluded?: TerminalRef) {
    let best: TerminalHit | null = null;
    for (const terminal of allTerminals()) {
      if (excluded && terminal.ref.partId === excluded.partId && terminal.ref.terminal === excluded.terminal) continue;
      const distance = Math.hypot(terminal.position.x - point.x, terminal.position.y - point.y);
      if (distance <= 42 && (!best || distance < best.distance)) best = { ref: terminal.ref, position: terminal.position, distance };
    }
    return best;
  }

  function clampPosition(part: CircuitPart, x: number, y: number) {
    const spec = options.getSpec(part);
    const scale = part.layoutScale ?? 1;
    const width = spec.width * scale;
    const height = spec.height * scale;
    options.expandWorkbenchTo(x + width, y + height);
    return {
      x: Math.round(Math.min(options.limitWidth() - width - 16, Math.max(16, x))),
      y: Math.round(Math.min(options.limitHeight() - height - 16, Math.max(16, y))),
    };
  }

  return { allTerminals, clampPosition, closestTerminal };
}
