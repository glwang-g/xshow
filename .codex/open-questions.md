# Open Questions

These are not decisions yet. Promote an answer to `docs/` and `.codex/decisions.md` only after implementation pressure or product direction makes it durable.

## World Engine

- Should `Signal` become a formal top-level engine type later, or stay as a payload inside components, state, actions, and events?
- Which adapter should come first after the type contract: `TankBattleWorld`, `ComputerWorld`, `LogicWorld`, or `CircuitWorld`?
- Where should the eventual scenario registry live: per-layer modules, a shared `src/data/scenarios`, or a route-level registry?
- What is the minimum replay format needed before persistence or share links matter?

## Product Layers

- What criteria would move Tank Lab from experiment-zone prototype into the main algorithm/battle layer?
- Should algorithm visualization first target data-structure traces, machine-linked execution traces, or programmable battle/mission scenarios?

## Runtime And UI

- When two adapters exist, should shared run/pause/step/reset behavior become a Vue composable such as `useWorldRunner()`?
- Which visualizations should become explicit projection helpers first: circuit status, machine memory/register rows, or tank canvas state?
