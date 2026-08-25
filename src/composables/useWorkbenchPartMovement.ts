import { ref, type Ref } from "vue";
import type { CircuitPart, PartType } from "@/lib/circuit";
import type { PartSpec } from "@/lib/workbench-ui";

type Point = { x: number; y: number };

type DragState = {
  historyRecorded: boolean;
  id: string;
  offsetX: number;
  offsetY: number;
};

type Options = {
  boardPoint: (event: PointerEvent) => Point;
  clampPosition: (part: CircuitPart, x: number, y: number) => Point;
  getSpec: (part: CircuitPart | PartType) => PartSpec;
  parts: Ref<CircuitPart[]>;
  pushHistory: () => void;
  selectedPartId: Ref<string>;
  setStatusTab: (tab: "selection") => void;
  workbenchLimitHeight: () => number;
  workbenchLimitWidth: () => number;
};

export function useWorkbenchPartMovement(options: Options) {
  const dragging = ref<DragState | null>(null);

  function getPart(partId: string) {
    return options.parts.value.find((part) => part.id === partId);
  }

  function relayPartner(part: CircuitPart) {
    if (part.type === "coil") {
      return options.parts.value.find(
        (candidate) => candidate.type === "spring" && candidate.controlledBy === part.id,
      );
    }

    if (part.type === "spring" && part.controlledBy) {
      return options.parts.value.find(
        (candidate) => candidate.id === part.controlledBy && candidate.type === "coil",
      );
    }

    return undefined;
  }

  function moveGroup(part: CircuitPart, deltaX: number, deltaY: number, recordHistory = true) {
    const partner = relayPartner(part);
    const group = partner ? [part, partner] : [part];
    const appliedX = partner
      ? Math.min(
          ...group.map(
            (item) => options.workbenchLimitWidth() - options.getSpec(item).width - 16 - item.x,
          ),
          Math.max(...group.map((item) => 16 - item.x), deltaX),
        )
      : undefined;
    const appliedY = partner
      ? Math.min(
          ...group.map(
            (item) => options.workbenchLimitHeight() - options.getSpec(item).height - 16 - item.y,
          ),
          Math.max(...group.map((item) => 16 - item.y), deltaY),
        )
      : undefined;

    const nextX = partner ? appliedX ?? 0 : options.clampPosition(part, part.x + deltaX, part.y + deltaY).x - part.x;
    const nextY = partner ? appliedY ?? 0 : options.clampPosition(part, part.x + deltaX, part.y + deltaY).y - part.y;
    if (nextX === 0 && nextY === 0) {
      return false;
    }

    if (recordHistory) {
      options.pushHistory();
    }
    for (const item of group) {
      item.x = Math.round(item.x + nextX);
      item.y = Math.round(item.y + nextY);
    }
    return true;
  }

  function handlePartPointerDown(event: PointerEvent, part: CircuitPart) {
    options.selectedPartId.value = part.id;
    options.setStatusTab("selection");
    const point = options.boardPoint(event);
    dragging.value = {
      historyRecorded: false,
      id: part.id,
      offsetX: point.x - part.x,
      offsetY: point.y - part.y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragging.value) {
      return;
    }

    const part = getPart(dragging.value.id);
    if (!part) {
      return;
    }

    const point = options.boardPoint(event);
    const partner = relayPartner(part);
    if (partner) {
      const moved = moveGroup(
        part,
        point.x - dragging.value.offsetX - part.x,
        point.y - dragging.value.offsetY - part.y,
        !dragging.value.historyRecorded,
      );
      if (moved) {
        dragging.value.historyRecorded = true;
      }
      return;
    }

    const position = options.clampPosition(
      part,
      point.x - dragging.value.offsetX,
      point.y - dragging.value.offsetY,
    );
    if (position.x === part.x && position.y === part.y) {
      return;
    }
    if (!dragging.value.historyRecorded) {
      options.pushHistory();
      dragging.value.historyRecorded = true;
    }
    part.x = position.x;
    part.y = position.y;
  }

  function endDrag() {
    dragging.value = null;
  }

  function clearDrag() {
    dragging.value = null;
  }

  function isDragging() {
    return Boolean(dragging.value);
  }

  function nudgeSelectedPart(deltaX: number, deltaY: number, shouldRecordHistory = true) {
    const selected = getPart(options.selectedPartId.value);
    if (!selected) {
      return;
    }
    moveGroup(selected, deltaX, deltaY, shouldRecordHistory);
  }

  function snapRelayAssembly(coil: CircuitPart, spring: CircuitPart) {
    const coilSpec = options.getSpec(coil);
    const springSpec = options.getSpec(spring);
    const groupX = Math.round(
      Math.min(options.workbenchLimitWidth() - coilSpec.width - 16, Math.max(16, coil.x)),
    );
    const groupY = Math.round(
      Math.min(
        options.workbenchLimitHeight() - coilSpec.height - springSpec.height - 28,
        Math.max(16, coil.y - springSpec.height - 12),
      ),
    );
    spring.x = groupX;
    spring.y = groupY;
    coil.x = groupX;
    coil.y = groupY + springSpec.height + 12;
  }

  function snapBoundRelayAssemblies() {
    const claimedCoils = new Set<string>();
    for (const spring of options.parts.value.filter(
      (part) => part.type === "spring" && part.controlledBy,
    )) {
      const coil = getPart(spring.controlledBy!);
      if (coil?.type === "coil" && !claimedCoils.has(coil.id)) {
        snapRelayAssembly(coil, spring);
        claimedCoils.add(coil.id);
      }
    }
  }

  function bindSpringToCoil(spring: CircuitPart, coilId: string) {
    if (spring.type !== "spring") {
      return;
    }
    if (!coilId) {
      if (!spring.controlledBy) {
        return;
      }
      options.pushHistory();
      delete spring.controlledBy;
      return;
    }

    const coil = getPart(coilId);
    const alreadyBound = options.parts.value.find(
      (part) => part.type === "spring" && part.id !== spring.id && part.controlledBy === coilId,
    );
    if (!coil || coil.type !== "coil" || alreadyBound || spring.controlledBy === coil.id) {
      return;
    }

    options.pushHistory();
    spring.controlledBy = coil.id;
    snapRelayAssembly(coil, spring);
  }

  return {
    bindSpringToCoil,
    clearDrag,
    endDrag,
    handlePartPointerDown,
    handlePointerMove,
    isDragging,
    nudgeSelectedPart,
    relayPartner,
    snapBoundRelayAssemblies,
  };
}
