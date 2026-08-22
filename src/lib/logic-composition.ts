import { buildMachineLogicManifest } from "@/lib/machine-build";
import { evaluatePublishedModule, type PublishedRelayModule } from "@/lib/published-modules";

export type HalfAdderComposition = {
  available: boolean;
  carry: boolean;
  intermediate: { eitherInput: boolean; notCarry: boolean };
  missing: string[];
  modules: PublishedRelayModule[];
  sum: boolean;
};

/**
 * A half adder composed from workshop-built gates. XOR is deliberately not a
 * black box here: (A OR B) AND NOT(A AND B), while the same AND module is
 * reusable at both points in the graph.
 */
export function composeHalfAdder(modules: PublishedRelayModule[], a: boolean, b: boolean): HalfAdderComposition {
  const manifest = buildMachineLogicManifest(modules);
  const selected = manifest.slots.map((slot) => slot.module).filter((module): module is PublishedRelayModule => Boolean(module));
  if (!manifest.ready) {
    return {
      available: false,
      carry: false,
      intermediate: { eitherInput: false, notCarry: true },
      missing: manifest.missing.map((slot) => slot.gate),
      modules: selected,
      sum: false,
    };
  }

  const andModule = manifest.slots.find((slot) => slot.gate === "AND")?.module as PublishedRelayModule;
  const orModule = manifest.slots.find((slot) => slot.gate === "OR")?.module as PublishedRelayModule;
  const notModule = manifest.slots.find((slot) => slot.gate === "NOT")?.module as PublishedRelayModule;
  const carry = evaluatePublishedModule(andModule, [a, b]);
  const eitherInput = evaluatePublishedModule(orModule, [a, b]);
  const notCarry = evaluatePublishedModule(notModule, [carry]);
  const sum = evaluatePublishedModule(andModule, [eitherInput, notCarry]);

  return {
    available: true,
    carry,
    intermediate: { eitherInput, notCarry },
    missing: [],
    modules: [andModule, orModule, notModule],
    sum,
  };
}
