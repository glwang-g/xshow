import type { Ref } from "vue";
import { batteryPositiveTerminal, normalizePartRotation, type CircuitPart, type PartType, type TerminalKey, type TerminalRef, type Wire, type WireEnd } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Point = { x: number; y: number };
type WorkbenchElement = { getBoundingClientRect: () => DOMRect };

export function useWorkbenchPartPresentation(options: {
  boardZoom: () => number;
  getSpec: (part: CircuitPart | PartType) => PartSpec;
  parts: Ref<CircuitPart[]>;
  endpointDrag: Ref<{ wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null } | null>;
  workbenchRef: Ref<WorkbenchElement | null>;
}) {
  function batteryPolarityLabel(part: CircuitPart) {
    return batteryPositiveTerminal(part) === "a" ? "正极在左侧" : "正极在右侧";
  }

  function terminalDisplayLabel(part: CircuitPart, terminal: TerminalKey) {
    if (part.type === "battery") return batteryPositiveTerminal(part) === terminal ? "+" : "-";
    if (part.type === "spring") return terminal === "a" ? "COM" : part.contactMode === "normally-closed" ? "NC" : "NO";
    if (part.type === "module" && terminal === "out") return part.moduleContactMode === "normally-closed" ? "NC" : "NO";
    return options.getSpec(part).terminals[terminal]!.label;
  }

  function partRotation(part: CircuitPart) {
    return normalizePartRotation(part.rotation ?? 0);
  }

  function layoutScale(part: CircuitPart) {
    return Math.min(1.6, Math.max(0.6, part.layoutScale ?? 1));
  }

  function rotateLocalPoint(point: Point, center: Point, degrees: number): Point {
    if (degrees === 0) return point;
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians); const sin = Math.sin(radians);
    const dx = point.x - center.x; const dy = point.y - center.y;
    return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
  }

  function rotatedTerminalOffset(part: CircuitPart, terminal: TerminalKey) {
    const spec = options.getSpec(part);
    const scale = layoutScale(part);
    const offset = spec.terminals[terminal]!;
    return rotateLocalPoint(
      { x: offset.x * scale, y: offset.y * scale },
      { x: (spec.width * scale) / 2, y: (spec.height * scale) / 2 },
      partRotation(part),
    );
  }

  function getPart(partId: string) {
    return options.parts.value.find((part) => part.id === partId);
  }

  function getTerminalPosition(ref: TerminalRef) {
    const part = getPart(ref.partId);
    if (!part) return { x: 0, y: 0 };
    const offset = rotatedTerminalOffset(part, ref.terminal);
    return { x: part.x + offset.x, y: part.y + offset.y };
  }

  function terminalStyle(part: CircuitPart, terminal: TerminalKey) {
    const offset = options.getSpec(part).terminals[terminal]!;
    return { left: `${offset.x - 16}px`, top: `${offset.y - 16}px` };
  }

  function partStyle(part: CircuitPart) {
    const spec = options.getSpec(part);
    const scale = layoutScale(part);
    return {
      left: `${part.x + ((scale - 1) * spec.width) / 2}px`, top: `${part.y + ((scale - 1) * spec.height) / 2}px`, width: `${spec.width}px`, height: `${spec.height}px`,
      transform: `rotate(${partRotation(part)}deg) scale(${scale})`, transformOrigin: "center",
    };
  }

  function wireEndpointPosition(wire: Wire, end: WireEnd) {
    if (options.endpointDrag.value?.wireId === wire.id && options.endpointDrag.value.end === end) {
      return { x: options.endpointDrag.value.x, y: options.endpointDrag.value.y };
    }
    return getTerminalPosition(wire[end]);
  }

  function boardPoint(event: PointerEvent) {
    const element = options.workbenchRef.value;
    if (!element) return { x: 0, y: 0 };
    const rect = element.getBoundingClientRect();
    const scale = options.boardZoom() / 100;
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  }

  return { batteryPolarityLabel, boardPoint, getPart, getTerminalPosition, layoutScale, partRotation, partStyle, terminalDisplayLabel, terminalStyle, wireEndpointPosition };
}
