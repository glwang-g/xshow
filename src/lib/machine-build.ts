import { evaluatePublishedModule, type PublishedRelayModule } from "@/lib/published-modules";

export type MachineLogicGate = "AND" | "OR" | "NOT";

export type MachineLogicSlot = {
  gate: MachineLogicGate;
  role: string;
};

export type MachineLogicManifest = {
  missing: MachineLogicSlot[];
  ready: boolean;
  slots: Array<MachineLogicSlot & { module: PublishedRelayModule | null }>;
};

/**
 * The first explicit bridge from workshop artifacts to the machine layer. The
 * CPU still runs through its core adapter; this keeps its logic basis visible.
 */
export const machineLogicSlots: MachineLogicSlot[] = [
  { gate: "AND", role: "产生进位条件" },
  { gate: "OR", role: "合并进位路径" },
  { gate: "NOT", role: "构成反相控制" },
];

function hasCompleteVerification(module: PublishedRelayModule) {
  const expectedRows = module.behavior.gate === "AND" || module.behavior.gate === "OR" ? 4 : 2;
  const rows = module.verification?.truthTable;
  const inputCount = expectedRows === 4 ? 2 : 1;
  if (!rows || rows.length !== expectedRows) return false;

  const seenInputs = new Set<string>();
  for (const row of rows) {
    if (
      !Array.isArray(row.inputs)
      || row.inputs.length !== inputCount
      || !row.inputs.every((input) => typeof input === "boolean")
      || typeof row.output !== "boolean"
      || evaluatePublishedModule(module, row.inputs) !== row.output
    ) return false;
    seenInputs.add(row.inputs.map(Number).join(""));
  }
  // A row count alone is insufficient: a locally edited record could repeat
  // the easy cases and falsely claim that every input state was verified.
  return seenInputs.size === expectedRows;
}

export function buildMachineLogicManifest(modules: PublishedRelayModule[]): MachineLogicManifest {
  const slots = machineLogicSlots.map((slot) => ({
    ...slot,
    module: modules.find(
      (module) => module.kind === "logic-gate" && module.behavior.gate === slot.gate && hasCompleteVerification(module),
    ) ?? null,
  }));
  const missing = slots.filter((slot) => !slot.module).map(({ gate, role }) => ({ gate, role }));
  return { slots, missing, ready: missing.length === 0 };
}
