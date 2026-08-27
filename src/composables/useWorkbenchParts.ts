import type { Ref } from "vue";
import { batteryPolarity, clampResistorOhms, normalizePartRotation, type CircuitPart, type PartType, type Wire } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Options = {
  clearInteractionState: () => void;
  closePalette: () => void;
  getSpec: (part: CircuitPart) => PartSpec;
  getNewPartLayoutScale?: () => number;
  pushHistory: () => void;
  selectedPartId: Ref<string>;
  setStatusTab: (tab: "selection") => void;
  parts: Ref<CircuitPart[]>;
  wires: Ref<Wire[]>;
  clampPosition: (part: CircuitPart, x: number, y: number) => { x: number; y: number };
};

export function useWorkbenchParts(options: Options) {
  let editHistory: { key: string; timer: number } | null = null;

  function addPartAt(type: PartType, x?: number, y?: number) {
    const index = options.parts.value.filter((part) => part.type === type).length + 1;
    const spec = options.getSpec({ id: "new", name: "", type, x: 0, y: 0 });
    options.pushHistory();
    const nextPart: CircuitPart = { id: `${type}-${Date.now()}`, name: `${spec.label} ${index}`, type, x: 180 + ((index * 70) % 420), y: 180 + ((index * 48) % 260) };
    if (type === "switch") nextPart.closed = false;
    if (type === "resistor") nextPart.resistance = 60;
    if (type === "spring") { nextPart.contactMode = "normally-open"; nextPart.closed = false; }
    const layoutScale = options.getNewPartLayoutScale?.() ?? 1;
    if (layoutScale !== 1) nextPart.layoutScale = layoutScale;
    if (x !== undefined && y !== undefined) {
      const position = options.clampPosition(nextPart, x - spec.width / 2, y - spec.height / 2);
      nextPart.x = position.x;
      nextPart.y = position.y;
    }
    options.parts.value.push(nextPart);
    options.clearInteractionState();
    options.selectedPartId.value = nextPart.id;
    options.setStatusTab("selection");
    options.closePalette();
  }

  function addPart(type: PartType) {
    addPartAt(type);
  }

  function duplicateSelectedPart() {
    const selected = options.parts.value.find((part) => part.id === options.selectedPartId.value);
    if (!selected) return;
    options.pushHistory();
    const index = options.parts.value.filter((part) => part.type === selected.type).length + 1;
    const position = options.clampPosition(selected, selected.x + 36, selected.y + 36);
    options.parts.value.push({ ...selected, id: `${selected.type}-${Date.now()}`, name: `${options.getSpec(selected).label} ${index}`, x: position.x, y: position.y });
    options.clearInteractionState();
    options.selectedPartId.value = options.parts.value.at(-1)?.id ?? "";
  }

  function removeSelectedPart() {
    const selected = options.parts.value.find((part) => part.id === options.selectedPartId.value);
    if (!selected || options.parts.value.length <= 1) return;
    options.pushHistory();
    options.parts.value = options.parts.value.filter((part) => part.id !== selected.id);
    options.wires.value = options.wires.value.filter((wire) => wire.from.partId !== selected.id && wire.to.partId !== selected.id);
    for (const part of options.parts.value) if (part.controlledBy === selected.id) delete part.controlledBy;
    options.selectedPartId.value = options.parts.value[0]?.id ?? "";
    options.clearInteractionState();
  }

  function toggleSwitch(part: CircuitPart) { options.pushHistory(); part.closed = !part.closed; }

  function toggleBatteryPolarity(part: CircuitPart) {
    options.pushHistory();
    if (batteryPolarity(part) === "normal") part.polarity = "reversed";
    else delete part.polarity;
  }

  function pushPartEditHistory(part: CircuitPart, field: string) {
    const key = `${part.id}:${field}`;
    if (editHistory?.key !== key) {
      if (editHistory) window.clearTimeout(editHistory.timer);
      options.pushHistory();
    } else if (editHistory) window.clearTimeout(editHistory.timer);
    editHistory = { key, timer: window.setTimeout(() => { editHistory = null; }, 400) };
  }

  function setResistance(part: CircuitPart, value: number) {
    const nextValue = clampResistorOhms(value, part.resistance);
    if (part.resistance === nextValue) return;
    pushPartEditHistory(part, "resistance");
    part.resistance = nextValue;
  }

  function setPartRotation(part: CircuitPart, value: number) {
    const nextValue = normalizePartRotation(value, part.rotation);
    if ((part.rotation ?? 0) === nextValue) return;
    pushPartEditHistory(part, "rotation");
    part.rotation = nextValue;
  }

  function setPartPosition(part: CircuitPart, axis: "x" | "y", value: number) {
    if (!Number.isFinite(value)) return;
    const nextPosition = options.clampPosition(part, axis === "x" ? value : part.x, axis === "y" ? value : part.y);
    if (nextPosition.x === part.x && nextPosition.y === part.y) return;
    pushPartEditHistory(part, "position");
    part.x = nextPosition.x;
    part.y = nextPosition.y;
  }

  function setSpringContactMode(part: CircuitPart, value: string) {
    if (part.type !== "spring" || (value !== "normally-open" && value !== "normally-closed") || part.contactMode === value) return;
    pushPartEditHistory(part, "contact-mode");
    part.contactMode = value;
  }

  function dispose() {
    if (editHistory) window.clearTimeout(editHistory.timer);
    editHistory = null;
  }

  return { addPart, addPartAt, dispose, duplicateSelectedPart, removeSelectedPart, setPartPosition, setPartRotation, setResistance, setSpringContactMode, toggleBatteryPolarity, toggleSwitch };
}
