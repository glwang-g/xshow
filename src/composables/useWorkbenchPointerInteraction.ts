import { sameTerminal, type CircuitPart, type TerminalKey, type TerminalRef, type Wire } from "@/lib/circuit";
import type { Ref } from "vue";
import type { useWorkbenchPartMovement } from "@/composables/useWorkbenchPartMovement";
import type { useWireInteraction } from "@/composables/useWireInteraction";

type WireInteraction = ReturnType<typeof useWireInteraction>;
type PartMovement = ReturnType<typeof useWorkbenchPartMovement>;

type Options = {
  movement: PartMovement;
  parts: Ref<CircuitPart[]>;
  selectedTerminal: Ref<TerminalRef | null>;
  wire: WireInteraction;
  wires: Ref<Wire[]>;
};

export function useWorkbenchPointerInteraction(options: Options) {
  function handlePartPointerDown(event: PointerEvent, part: CircuitPart) {
    options.wire.selectedWireId.value = null;
    options.wire.rewiring.value = null;
    options.wire.endpointDrag.value = null;
    options.wire.newWireDrag.value = null;
    options.movement.handlePartPointerDown(event, part);
  }

  function handleWorkbenchPointerMove(event: PointerEvent) {
    if (options.wire.newWireDrag.value) {
      options.wire.updateNewWireDrag(event);
      return;
    }
    if (options.wire.endpointDrag.value) {
      options.wire.updateEndpointDrag(event);
      return;
    }
    options.movement.handlePointerMove(event);
  }

  function endDrag() {
    options.movement.endDrag();
    options.wire.finishDrag();
  }

  function finishTerminalDrag() {
    options.wire.finishDrag();
  }

  function isTerminalSelected(part: CircuitPart, terminal: TerminalKey) {
    const terminalRef = { partId: part.id, terminal };
    const isPendingNewWire = options.selectedTerminal.value?.partId === part.id && options.selectedTerminal.value.terminal === terminal;
    const isDraftNewWire =
      (options.wire.newWireDrag.value?.from.partId === part.id && options.wire.newWireDrag.value.from.terminal === terminal) ||
      (options.wire.newWireDrag.value?.over?.partId === part.id && options.wire.newWireDrag.value.over.terminal === terminal);
    if (!options.wire.rewiring.value) {
      const isDropTarget = options.wire.endpointDrag.value?.over?.partId === part.id && options.wire.endpointDrag.value.over.terminal === terminal;
      return isPendingNewWire || isDraftNewWire || isDropTarget;
    }
    const wire = options.wires.value.find((item) => item.id === options.wire.rewiring.value?.wireId);
    const isRewireEnd = wire ? sameTerminal(wire[options.wire.rewiring.value.end], terminalRef) : false;
    const isDropTarget = options.wire.endpointDrag.value?.over?.partId === part.id && options.wire.endpointDrag.value.over.terminal === terminal;
    return isPendingNewWire || isDraftNewWire || isRewireEnd || isDropTarget;
  }

  function isTerminalDropTarget(part: CircuitPart, terminal: TerminalKey) {
    return Boolean(
      (options.wire.endpointDrag.value?.over?.partId === part.id && options.wire.endpointDrag.value.over.terminal === terminal) ||
      (options.wire.newWireDrag.value?.over?.partId === part.id && options.wire.newWireDrag.value.over.terminal === terminal),
    );
  }

  return { endDrag, finishTerminalDrag, handlePartPointerDown, handleWorkbenchPointerMove, isTerminalDropTarget, isTerminalSelected };
}
