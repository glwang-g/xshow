import type { ComputedRef, Ref } from "vue";
import type { CircuitPart, TerminalRef, Wire, WireEnd } from "@/lib/circuit";

type Options = {
  clearDrag: () => void;
  clearWireSelection: () => void;
  endpointDrag: Ref<{ wireId: string; end: WireEnd; x: number; y: number; over: TerminalRef | null } | null>;
  hoveredEndpoint: Ref<{ wireId: string; end: WireEnd } | null>;
  hoveredWireId: Ref<string | null>;
  isDragging: () => boolean;
  newWireDrag: Ref<{ from: TerminalRef; moved: boolean; over: TerminalRef | null; x: number; y: number } | null>;
  removePart: () => void;
  removeWire: (wireId: string) => void;
  rewiring: Ref<{ wireId: string; end: WireEnd } | null>;
  selectedPart: ComputedRef<CircuitPart | undefined>;
  selectedPartId: Ref<string>;
  selectedTerminal: Ref<TerminalRef | null>;
  selectedWire: ComputedRef<Wire | undefined>;
  selectedWireId: Ref<string | null>;
  suppressNextTerminalClick: Ref<boolean>;
};

export function useWorkbenchSelection(options: Options) {
  function clearInteractionState() {
    options.clearWireSelection();
    options.clearDrag();
  }

  function clearSelection() {
    clearInteractionState();
    options.selectedPartId.value = "";
  }

  function hasTransientInteraction() {
    return Boolean(
      options.isDragging() ||
      options.endpointDrag.value ||
      options.newWireDrag.value ||
      options.rewiring.value ||
      options.selectedTerminal.value ||
      options.hoveredEndpoint.value ||
      options.hoveredWireId.value,
    );
  }

  function clearCanvasSelection() {
    options.selectedPartId.value = "";
    options.clearWireSelection();
  }

  function deleteSelectedWorkbenchItem() {
    if (options.selectedWire.value) {
      options.removeWire(options.selectedWire.value.id);
      return;
    }
    if (options.selectedPart.value) {
      options.removePart();
    }
  }

  return { clearCanvasSelection, clearInteractionState, clearSelection, deleteSelectedWorkbenchItem, hasTransientInteraction };
}
