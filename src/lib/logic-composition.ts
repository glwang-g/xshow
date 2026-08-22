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

export type FullAdderComposition = {
  available: boolean;
  carry: boolean;
  firstHalf: HalfAdderComposition;
  missing: string[];
  modules: PublishedRelayModule[];
  secondHalf: HalfAdderComposition;
  sum: boolean;
};

export type ByteAdderStep = {
  a: boolean;
  b: boolean;
  bit: number;
  carryIn: boolean;
  carryOut: boolean;
  sum: boolean;
};

export type ByteAdderComposition = {
  available: boolean;
  carry: boolean;
  missing: string[];
  modules: PublishedRelayModule[];
  steps: ByteAdderStep[];
  sum: number;
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

/** Two reusable half adders plus OR form a one-bit full adder. */
export function composeFullAdder(modules: PublishedRelayModule[], a: boolean, b: boolean, carryIn: boolean): FullAdderComposition {
  const firstHalf = composeHalfAdder(modules, a, b);
  const secondHalf = composeHalfAdder(modules, firstHalf.sum, carryIn);
  if (!firstHalf.available || !secondHalf.available) {
    return {
      available: false,
      carry: false,
      firstHalf,
      missing: [...new Set([...firstHalf.missing, ...secondHalf.missing])],
      modules: firstHalf.modules,
      secondHalf,
      sum: false,
    };
  }

  const orModule = firstHalf.modules.find((module) => module.behavior.gate === "OR") as PublishedRelayModule;
  return {
    available: true,
    carry: evaluatePublishedModule(orModule, [firstHalf.carry, secondHalf.carry]),
    firstHalf,
    missing: [],
    modules: firstHalf.modules,
    secondHalf,
    sum: secondHalf.sum,
  };
}

/** An eight-bit ripple-carry adder built from the same reusable full adder. */
export function composeByteAdder(modules: PublishedRelayModule[], left: number, right: number): ByteAdderComposition {
  const normalizedLeft = Number.isFinite(left) ? Math.max(0, Math.min(255, Math.trunc(left))) : 0;
  const normalizedRight = Number.isFinite(right) ? Math.max(0, Math.min(255, Math.trunc(right))) : 0;
  const probe = composeFullAdder(modules, false, false, false);
  if (!probe.available) {
    return { available: false, carry: false, missing: probe.missing, modules: probe.modules, steps: [], sum: 0 };
  }

  let carry = false;
  let sum = 0;
  const steps: ByteAdderStep[] = [];
  for (let bit = 0; bit < 8; bit += 1) {
    const a = Boolean(normalizedLeft & (1 << bit));
    const b = Boolean(normalizedRight & (1 << bit));
    const result = composeFullAdder(modules, a, b, carry);
    steps.push({ a, b, bit, carryIn: carry, carryOut: result.carry, sum: result.sum });
    if (result.sum) sum |= 1 << bit;
    carry = result.carry;
  }
  return { available: true, carry, missing: [], modules: probe.modules, steps, sum };
}
