import { computed } from "vue";
import { roundedOrthogonalPath, routeWire, type WireRoutePoint } from "@/lib/wire-routing";
import type { CircuitPart, TerminalKey, TerminalRef, Wire, WireEnd } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Point = { x: number; y: number };
type EndpointDrag = { wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null };
type NewWireDrag = { from: TerminalRef; moved: boolean; over: TerminalRef | null; x: number; y: number };
type WireBridge = {
  gapPath: string;
  id: string;
  path: string;
  stroke: string;
  verticalPath: string;
  verticalStroke: string;
  verticalWidth: number;
  width: number;
};

type Options = {
  currentVisualStrength: () => number;
  endpointDrag: { value: EndpointDrag | null };
  getPart: (partId: string) => CircuitPart | undefined;
  getSpec: (part: CircuitPart) => PartSpec;
  getTerminalPosition: (ref: TerminalRef) => Point;
  hoveredEndpoint: { value: { wireId: string; end: WireEnd } | null };
  hoveredWireId: { value: string | null };
  isDesktopViewport: () => boolean;
  newWireDrag: { value: NewWireDrag | null };
  selectedWireId: { value: string | null };
  simulationWire: (wireId: string) => { active?: boolean } | undefined;
  terminalDisplayLabel: (part: CircuitPart, terminal: TerminalKey) => string;
  wireEndpointPosition: (wire: Wire, end: WireEnd) => Point;
  wires: { value: Wire[] };
  workbenchLimitHeight: () => number;
  workbenchLimitWidth: () => number;
};

export function useWorkbenchWirePresentation(options: Options) {
  function terminalSide(ref: TerminalRef) {
    const part = options.getPart(ref.partId);
    if (!part) return ref.terminal === "a" ? -1 : 1;
    const spec = options.getSpec(part);
    const offset = spec.terminals[ref.terminal]!;
    const dx = offset.x - spec.width / 2;
    if (Math.abs(dx) < 1) return ref.terminal === "a" ? -1 : 1;
    return dx < 0 ? -1 : 1;
  }

  function wireRoutePoints(wire: Wire): WireRoutePoint[] {
    const start = options.wireEndpointPosition(wire, "from");
    const end = options.wireEndpointPosition(wire, "to");
    const startSide = terminalSide(wire.from);
    const endSide = terminalSide(wire.to);
    // A wire can be stored in either direction. Treating left->right and
    // right->left as different groups makes their corridors overlap again.
    // The physical corridor only depends on the pair of terminal sides.
    const laneKey = [startSide, endSide].sort().join(":");
    const laneGroup = options.wires.value.filter((candidate) => {
      const candidateKey = [terminalSide(candidate.from), terminalSide(candidate.to)].sort().join(":");
      return candidateKey === laneKey;
    });
    const lane = laneGroup.findIndex((candidate) => candidate.id === wire.id) - (laneGroup.length - 1) / 2;
    return routeWire({
      bounds: { height: options.workbenchLimitHeight(), width: options.workbenchLimitWidth() },
      end,
      endSide,
      lane,
      mobile: !options.isDesktopViewport(),
      start,
      startSide,
    });
  }

  function wirePath(wire: Wire) {
    return roundedOrthogonalPath(wireRoutePoints(wire));
  }

  const wireBridges = computed<WireBridge[]>(() => {
    const routed = options.wires.value.map((wire) => ({ points: wireRoutePoints(wire), wire }));
    const bridges: WireBridge[] = [];
    const radius = 10;

    for (let firstIndex = 0; firstIndex < routed.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < routed.length; secondIndex += 1) {
        const first = routed[firstIndex];
        const second = routed[secondIndex];
        for (let firstPoint = 0; firstPoint < first.points.length - 1; firstPoint += 1) {
          const a = first.points[firstPoint];
          const b = first.points[firstPoint + 1];
          for (let secondPoint = 0; secondPoint < second.points.length - 1; secondPoint += 1) {
            const c = second.points[secondPoint];
            const d = second.points[secondPoint + 1];
            const horizontal = a.y === b.y && c.x === d.x;
            const reverse = c.y === d.y && a.x === b.x;
            if (!horizontal && !reverse) continue;

            const horizontalStart = horizontal ? a : c;
            const horizontalEnd = horizontal ? b : d;
            const verticalStart = horizontal ? c : a;
            const verticalEnd = horizontal ? d : b;
            const x = verticalStart.x;
            const y = horizontalStart.y;
            const horizontalMin = Math.min(horizontalStart.x, horizontalEnd.x);
            const horizontalMax = Math.max(horizontalStart.x, horizontalEnd.x);
            const verticalMin = Math.min(verticalStart.y, verticalEnd.y);
            const verticalMax = Math.max(verticalStart.y, verticalEnd.y);
            if (x <= horizontalMin + radius || x >= horizontalMax - radius || y <= verticalMin + radius || y >= verticalMax - radius) continue;

            const horizontalWire = horizontal ? first.wire : second.wire;
            const verticalWire = horizontal ? second.wire : first.wire;
            const bridgeRadius = Math.min(radius, (horizontalMax - horizontalMin) / 2 - 2, (verticalMax - verticalMin) / 2 - 2);
            if (bridgeRadius <= 2) continue;
            bridges.push({
              gapPath: `M ${Math.round(x - bridgeRadius)} ${Math.round(y)} L ${Math.round(x + bridgeRadius)} ${Math.round(y)}`,
              id: `${first.wire.id}-${second.wire.id}-${Math.round(x)}-${Math.round(y)}`,
              path: `M ${Math.round(x - bridgeRadius - 3)} ${Math.round(y)} L ${Math.round(x - bridgeRadius)} ${Math.round(y)} Q ${Math.round(x)} ${Math.round(y - bridgeRadius * 1.4)} ${Math.round(x + bridgeRadius)} ${Math.round(y)} L ${Math.round(x + bridgeRadius + 3)} ${Math.round(y)}`,
              stroke: wireStroke(horizontalWire),
              verticalPath: `M ${Math.round(x)} ${Math.round(y - bridgeRadius)} L ${Math.round(x)} ${Math.round(y + bridgeRadius)}`,
              verticalStroke: wireStroke(verticalWire),
              verticalWidth: wireStrokeWidth(verticalWire),
              width: wireStrokeWidth(horizontalWire),
            });
          }
        }
      }
    }
    return bridges;
  });

  function newWireDragPath() {
    const drag = options.newWireDrag.value;
    if (!drag) return "";
    const start = options.getTerminalPosition(drag.from);
    const end = drag.over ? options.getTerminalPosition(drag.over) : drag;
    const startSide = terminalSide(drag.from);
    const endSide = drag.over
      ? terminalSide(drag.over)
      : (end.x >= start.x ? 1 : -1) as -1 | 1;
    return roundedOrthogonalPath(routeWire({
      bounds: { height: options.workbenchLimitHeight(), width: options.workbenchLimitWidth() },
      end,
      endSide,
      mobile: !options.isDesktopViewport(),
      start,
      startSide,
    }));
  }

  function isEndpointHovered(wire: Wire, end: WireEnd) {
    return options.hoveredEndpoint.value?.wireId === wire.id && options.hoveredEndpoint.value.end === end;
  }

  function isWireHighlighted(wire: Wire) {
    return options.selectedWireId.value === wire.id ||
      options.hoveredWireId.value === wire.id ||
      options.endpointDrag.value?.wireId === wire.id;
  }

  function wireStroke(wire: Wire) {
    if (options.selectedWireId.value === wire.id || options.endpointDrag.value?.wireId === wire.id) return "#f59e0b";
    if (options.hoveredWireId.value === wire.id) return "#0e7490";
    return options.simulationWire(wire.id)?.active ? "#0891b2" : "#64748b";
  }

  function wireStrokeWidth(wire: Wire) {
    if (options.selectedWireId.value === wire.id || options.endpointDrag.value?.wireId === wire.id) return 7;
    if (options.hoveredWireId.value === wire.id) return 6;
    return options.simulationWire(wire.id)?.active ? 5 + options.currentVisualStrength() * 2 : 5;
  }

  function endpointRadius(wire: Wire, end: WireEnd) {
    if (options.endpointDrag.value?.wireId === wire.id && options.endpointDrag.value.end === end) return 12;
    if (options.selectedWireId.value === wire.id || isEndpointHovered(wire, end)) return 10;
    return options.hoveredWireId.value === wire.id ? 9 : 7;
  }

  function endpointFill(wire: Wire, end: WireEnd) {
    return options.selectedWireId.value === wire.id || isEndpointHovered(wire, end) || options.endpointDrag.value?.wireId === wire.id
      ? "#f59e0b"
      : "#0f172a";
  }

  function endpointStrokeWidth(wire: Wire, end: WireEnd) {
    return options.selectedWireId.value === wire.id || isEndpointHovered(wire, end) || options.endpointDrag.value?.wireId === wire.id ? 3 : 0;
  }

  function setWireHover(wireId: string) { options.hoveredWireId.value = wireId; }

  function clearWireHover(wireId: string) {
    if (options.hoveredWireId.value === wireId) options.hoveredWireId.value = null;
  }

  function setEndpointHover(wireId: string, end: WireEnd) {
    options.hoveredWireId.value = wireId;
    options.hoveredEndpoint.value = { wireId, end };
  }

  function clearEndpointHover(wireId: string, end: WireEnd) {
    if (options.hoveredEndpoint.value?.wireId === wireId && options.hoveredEndpoint.value.end === end) {
      options.hoveredEndpoint.value = null;
    }
    if (options.hoveredWireId.value === wireId && !options.endpointDrag.value) {
      options.hoveredWireId.value = null;
    }
  }

  function terminalLabel(ref: TerminalRef) {
    const part = options.getPart(ref.partId);
    return part ? `${part.name}${options.terminalDisplayLabel(part, ref.terminal)}` : "Missing terminal";
  }

  function wireLabel(wire: Wire) {
    return `${terminalLabel(wire.from)} -> ${terminalLabel(wire.to)}`;
  }

  return {
    clearEndpointHover,
    clearWireHover,
    endpointFill,
    endpointRadius,
    endpointStrokeWidth,
    isEndpointHovered,
    isWireHighlighted,
    newWireDragPath,
    setEndpointHover,
    setWireHover,
    terminalLabel,
    wireLabel,
    wireBridges,
    wirePath,
    wireStroke,
    wireStrokeWidth,
  };
}
