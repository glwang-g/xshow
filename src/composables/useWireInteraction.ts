import { computed, ref, type Ref } from "vue";
import { sameTerminal, type CircuitPart, type TerminalKey, type TerminalRef, type Wire, type WireEnd } from "@/lib/circuit";

type Point = { x: number; y: number };
type NewWireDrag = { from: TerminalRef; moved: boolean; over: TerminalRef | null; x: number; y: number };
type EndpointDrag = { wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null };

type Options = {
  boardPoint: (event: PointerEvent) => Point;
  closestTerminal: (point: Point, excluded?: TerminalRef) => { position: Point; ref: TerminalRef } | null;
  expandMobileWorkbenchTo: (x: number, y: number) => void;
  getTerminalPosition: (ref: TerminalRef) => Point;
  limitHeight: () => number;
  limitWidth: () => number;
  onWireAdded?: () => void;
  pushEditorHistory: () => void;
  selectedPartId: Ref<string>;
  statusPanelTab: Ref<string>;
  wires: Ref<Wire[]>;
};

export function useWireInteraction(options: Options) {
  const hoveredWireId = ref<string | null>(null);
  const hoveredEndpoint = ref<{ wireId: string; end: WireEnd } | null>(null);
  const selectedTerminal = ref<TerminalRef | null>(null);
  const selectedWireId = ref<string | null>(null);
  const newWireDrag = ref<NewWireDrag | null>(null);
  const suppressNextTerminalClick = ref(false);
  const rewiring = ref<{ wireId: string; end: WireEnd } | null>(null);
  const endpointDrag = ref<EndpointDrag | null>(null);

  const selectedWire = computed(() => options.wires.value.find((wire) => wire.id === selectedWireId.value));
  const renderedWires = computed(() => {
    if (!selectedWireId.value) return options.wires.value;
    return [
      ...options.wires.value.filter((wire) => wire.id !== selectedWireId.value),
      ...options.wires.value.filter((wire) => wire.id === selectedWireId.value),
    ];
  });

  function clearCanvasSelection() {
    hoveredEndpoint.value = null;
    hoveredWireId.value = null;
    selectedTerminal.value = null;
    selectedWireId.value = null;
    rewiring.value = null;
    endpointDrag.value = null;
    newWireDrag.value = null;
    suppressNextTerminalClick.value = false;
  }

  function selectWire(wireId: string) {
    hoveredWireId.value = wireId;
    selectedWireId.value = wireId;
    selectedTerminal.value = null;
    rewiring.value = null;
    options.statusPanelTab.value = "selection";
  }

  function startRewire(wireId: string, end: WireEnd) {
    selectedWireId.value = wireId;
    selectedTerminal.value = null;
    endpointDrag.value = null;
    newWireDrag.value = null;
    rewiring.value = { wireId, end };
  }

  function startBranchWireDrag(event: PointerEvent, wire: Wire, end: WireEnd) {
    const from = { ...wire[end] };
    const start = options.getTerminalPosition(from);
    selectedTerminal.value = null;
    selectedWireId.value = null;
    hoveredWireId.value = wire.id;
    hoveredEndpoint.value = { wireId: wire.id, end };
    rewiring.value = null;
    endpointDrag.value = null;
    newWireDrag.value = { from, moved: false, over: null, x: start.x, y: start.y };
    (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId);
  }

  function startEndpointDrag(event: PointerEvent, wire: Wire, end: WireEnd) {
    if (event.altKey) {
      startBranchWireDrag(event, wire, end);
      return;
    }
    if (selectedWireId.value !== wire.id) selectWire(wire.id);
    const start = options.getTerminalPosition(wire[end]);
    selectedTerminal.value = null;
    selectedWireId.value = wire.id;
    hoveredWireId.value = wire.id;
    hoveredEndpoint.value = { wireId: wire.id, end };
    rewiring.value = { wireId: wire.id, end };
    newWireDrag.value = null;
    endpointDrag.value = { wireId: wire.id, end, x: start.x, y: start.y, over: null };
    (event.currentTarget as SVGCircleElement).setPointerCapture(event.pointerId);
  }

  function finishRewire(target: TerminalRef) {
    if (!rewiring.value) return;
    const current = rewiring.value;
    const wire = options.wires.value.find((item) => item.id === current.wireId);
    if (!wire) {
      rewiring.value = null;
      return;
    }
    const otherEnd = current.end === "from" ? wire.to : wire.from;
    if (sameTerminal(target, otherEnd)) {
      rewiring.value = null;
      endpointDrag.value = null;
      return;
    }
    const nextFrom = current.end === "from" ? target : wire.from;
    const nextTo = current.end === "to" ? target : wire.to;
    const duplicate = options.wires.value.some((item) => item.id !== wire.id && (
      (sameTerminal(item.from, nextFrom) && sameTerminal(item.to, nextTo)) ||
      (sameTerminal(item.to, nextFrom) && sameTerminal(item.from, nextTo))
    ));
    if (!duplicate) {
      options.pushEditorHistory();
      wire[current.end] = target;
    }
    hoveredEndpoint.value = null;
    hoveredWireId.value = wire.id;
    selectedWireId.value = wire.id;
    rewiring.value = null;
    selectedTerminal.value = null;
    endpointDrag.value = null;
  }

  function finishEndpointDrag() {
    if (!endpointDrag.value) return;
    if (endpointDrag.value.over) finishRewire(endpointDrag.value.over);
    endpointDrag.value = null;
  }

  function addWireBetween(from: TerminalRef, to: TerminalRef) {
    if (sameTerminal(from, to)) return null;
    const duplicate = options.wires.value.some((wire) =>
      (sameTerminal(wire.from, from) && sameTerminal(wire.to, to)) ||
      (sameTerminal(wire.to, from) && sameTerminal(wire.from, to)),
    );
    if (duplicate) return null;
    options.pushEditorHistory();
    const wire = { id: `wire-${Date.now()}`, from, to };
    options.wires.value.push(wire);
    hoveredWireId.value = wire.id;
    selectedWireId.value = wire.id;
    options.onWireAdded?.();
    return wire;
  }

  function startNewWireDrag(event: PointerEvent, part: CircuitPart, terminal: TerminalKey) {
    if (rewiring.value) return;
    const from = { partId: part.id, terminal };
    const start = options.getTerminalPosition(from);
    options.selectedPartId.value = part.id;
    selectedWireId.value = null;
    hoveredWireId.value = null;
    endpointDrag.value = null;
    newWireDrag.value = { from, moved: false, over: null, x: start.x, y: start.y };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function updateNewWireDrag(event: PointerEvent) {
    if (!newWireDrag.value) return;
    const point = options.boardPoint(event);
    const start = options.getTerminalPosition(newWireDrag.value.from);
    const hit = options.closestTerminal(point, newWireDrag.value.from);
    const nextPoint = hit?.position ?? point;
    newWireDrag.value.moved = newWireDrag.value.moved || Math.hypot(point.x - start.x, point.y - start.y) > 6;
    options.expandMobileWorkbenchTo(nextPoint.x, nextPoint.y);
    newWireDrag.value.x = Math.min(options.limitWidth(), Math.max(0, nextPoint.x));
    newWireDrag.value.y = Math.min(options.limitHeight(), Math.max(0, nextPoint.y));
    newWireDrag.value.over = hit?.ref ?? null;
  }

  function updateEndpointDrag(event: PointerEvent) {
    if (!endpointDrag.value) return;
    const point = options.boardPoint(event);
    const wire = options.wires.value.find((item) => item.id === endpointDrag.value?.wireId);
    const otherEnd = wire ? (endpointDrag.value.end === "from" ? wire.to : wire.from) : undefined;
    const hit = options.closestTerminal(point, otherEnd);
    const nextPoint = hit?.position ?? point;
    options.expandMobileWorkbenchTo(nextPoint.x, nextPoint.y);
    endpointDrag.value.x = Math.min(options.limitWidth(), Math.max(0, nextPoint.x));
    endpointDrag.value.y = Math.min(options.limitHeight(), Math.max(0, nextPoint.y));
    endpointDrag.value.over = hit?.ref ?? null;
  }

  function finishNewWireDrag() {
    if (!newWireDrag.value) return;
    const drag = newWireDrag.value;
    newWireDrag.value = null;
    if (!drag.moved) return;
    suppressNextTerminalClick.value = true;
    selectedTerminal.value = null;
    if (drag.over) addWireBetween(drag.from, drag.over);
  }

  function finishDrag() {
    const rewired = Boolean(endpointDrag.value);
    finishEndpointDrag();
    finishNewWireDrag();
    if (rewired) suppressNextTerminalClick.value = true;
  }

  function handleTerminalClick(part: CircuitPart, terminal: TerminalKey) {
    if (suppressNextTerminalClick.value) {
      suppressNextTerminalClick.value = false;
      return;
    }
    options.selectedPartId.value = part.id;
    const target = { partId: part.id, terminal };
    if (rewiring.value) {
      finishRewire(target);
      return;
    }
    selectedWireId.value = null;
    if (!selectedTerminal.value) {
      selectedTerminal.value = target;
      return;
    }
    const from = selectedTerminal.value;
    if (sameTerminal(from, target)) {
      selectedTerminal.value = null;
      return;
    }
    addWireBetween(from, target);
    selectedTerminal.value = null;
  }

  function removeWire(wireId: string) {
    if (!options.wires.value.some((wire) => wire.id === wireId)) return;
    options.pushEditorHistory();
    options.wires.value = options.wires.value.filter((wire) => wire.id !== wireId);
    if (selectedWireId.value === wireId) selectedWireId.value = null;
    if (hoveredWireId.value === wireId) hoveredWireId.value = null;
    if (hoveredEndpoint.value?.wireId === wireId) hoveredEndpoint.value = null;
    if (rewiring.value?.wireId === wireId) rewiring.value = null;
    if (endpointDrag.value?.wireId === wireId) endpointDrag.value = null;
  }

  function clearWires() {
    if (!options.wires.value.length) return;
    options.pushEditorHistory();
    options.wires.value = [];
    clearCanvasSelection();
  }

  return {
    addWireBetween,
    clearCanvasSelection,
    clearWires,
    endpointDrag,
    finishDrag,
    finishEndpointDrag,
    finishNewWireDrag,
    finishRewire,
    handleTerminalClick,
    hoveredEndpoint,
    hoveredWireId,
    newWireDrag,
    renderedWires,
    removeWire,
    rewiring,
    selectedTerminal,
    selectedWire,
    selectedWireId,
    selectWire,
    suppressNextTerminalClick,
    startBranchWireDrag,
    startEndpointDrag,
    startNewWireDrag,
    startRewire,
    updateEndpointDrag,
    updateNewWireDrag,
  };
}
