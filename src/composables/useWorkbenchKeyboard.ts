import type { ComputedRef } from "vue";
import type { CircuitPart } from "@/lib/circuit";

type Options = {
  duplicatePart: () => void;
  getZoom: () => number;
  isSwitch: (part: CircuitPart | undefined) => boolean;
  isBattery: (part: CircuitPart | undefined) => boolean;
  nudgePart: (deltaX: number, deltaY: number, shouldRecordHistory?: boolean) => void;
  removeSelectedItem: () => void;
  resetView: () => void;
  selectedPart: ComputedRef<CircuitPart | undefined>;
  setZoom: (value: number) => void;
  toggleBattery: (part: CircuitPart) => void;
  toggleSwitch: (part: CircuitPart) => void;
  undo: () => void;
  redo: () => void;
  cancelInteraction: () => void;
};

function isShortcutBlocked(target: EventTarget | null) {
  return target instanceof HTMLElement
    ? Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"))
    : false;
}

export function useWorkbenchKeyboard(options: Options) {
  function handleKeydown(event: KeyboardEvent) {
    if (isShortcutBlocked(event.target)) return;
    const key = event.key;
    const lowerKey = key.toLowerCase();
    const commandKey = event.metaKey || event.ctrlKey;

    if (commandKey && lowerKey === "z") {
      event.preventDefault();
      event.shiftKey ? options.redo() : options.undo();
      return;
    }
    if (commandKey && lowerKey === "y") {
      event.preventDefault();
      options.redo();
      return;
    }
    if (commandKey && lowerKey === "d") {
      event.preventDefault();
      options.duplicatePart();
      return;
    }
    if (key === "Delete" || key === "Backspace") {
      event.preventDefault();
      options.removeSelectedItem();
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      options.cancelInteraction();
      return;
    }

    const distance = event.shiftKey ? 16 : 4;
    const nudge: Partial<Record<string, [number, number]>> = {
      ArrowDown: [0, distance], ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0], ArrowUp: [0, -distance],
    };
    if (nudge[key]) {
      event.preventDefault();
      options.nudgePart(nudge[key]![0], nudge[key]![1], !event.repeat);
      return;
    }
    if ((key === "Enter" || key === " ") && options.isSwitch(options.selectedPart.value)) {
      event.preventDefault();
      options.toggleSwitch(options.selectedPart.value!);
      return;
    }
    if ((key === "Enter" || key === " ") && options.isBattery(options.selectedPart.value)) {
      event.preventDefault();
      options.toggleBattery(options.selectedPart.value!);
      return;
    }
    if (key === "+" || key === "=") {
      event.preventDefault();
      options.setZoom(options.getZoom() + 5);
      return;
    }
    if (key === "-" || key === "_") {
      event.preventDefault();
      options.setZoom(options.getZoom() - 5);
      return;
    }
    if (key === "0") {
      event.preventDefault();
      options.resetView();
    }
  }

  return { handleKeydown };
}
