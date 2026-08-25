import type { ComputedRef, Ref } from "vue";
import type { AmmeterState, BuzzerState, CapacitorState, CircuitPart, CircuitSimulation, DiodeState, LedState, MotorState, VoltmeterState, Wire } from "@/lib/circuit";
import { exportWorkbenchImage as exportImageFile } from "@/lib/workbench-export";

export function useWorkbenchImageExport(options: {
  activeLessonTitle: ComputedRef<string>;
  ammeterStatus: (part: CircuitPart) => AmmeterState;
  buzzerStatus: (part: CircuitPart) => BuzzerState;
  capacitorStatus: (part: CircuitPart) => CapacitorState;
  diodeStatus: (part: CircuitPart) => DiodeState;
  ledStatus: (part: CircuitPart) => LedState;
  motorStatus: (part: CircuitPart) => MotorState;
  parts: Ref<CircuitPart[]>;
  selectedPartId: Ref<string>;
  simulation: ComputedRef<CircuitSimulation>;
  voltmeterStatus: (part: CircuitPart) => VoltmeterState;
  wirePath: (wire: Wire) => string;
  wireStroke: (wire: Wire) => string;
  wireStrokeWidth: (wire: Wire) => number;
  wires: Ref<Wire[]>;
}) {
  function exportWorkbenchImage() {
    exportImageFile({
      activeLessonTitle: options.activeLessonTitle.value,
      ammeterStatus: options.ammeterStatus,
      buzzerStatus: options.buzzerStatus,
      capacitorStatus: options.capacitorStatus,
      diodeStatus: options.diodeStatus,
      ledStatus: options.ledStatus,
      motorStatus: options.motorStatus,
      parts: options.parts.value,
      selectedPartId: options.selectedPartId.value,
      simulation: options.simulation.value,
      voltmeterStatus: options.voltmeterStatus,
      wirePath: options.wirePath,
      wireStroke: options.wireStroke,
      wireStrokeWidth: options.wireStrokeWidth,
      wires: options.wires.value,
    });
  }

  return { exportWorkbenchImage };
}
