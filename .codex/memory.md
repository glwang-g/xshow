# Codex Memory

These notes are lightweight working memory for future agents. The source of truth lives in `docs/` and the typed contract in `src/lib/world-engine.ts`.

## Source Of Truth

- Product north star: `docs/product-north-star.zh-CN.md` / `docs/product-north-star.md`
- World Engine migration assessment: `docs/world-engine.zh-CN.md` / `docs/world-engine.md`
- Mainline layer ownership: `docs/layers.zh-CN.md` / `docs/layers.md`
- Type contract draft: `src/lib/world-engine.ts`
- Architecture boundaries: `docs/architecture.zh-CN.md` / `docs/architecture.md`

## Current Consensus

- The product mainline is signal/circuit -> logic/memory -> machine -> algorithm/battle.
- World Engine is a gradual contract layer first, not a mandate to rewrite existing labs.
- Phase one should stay limited to docs, type contracts, and later thin adapters around existing modules.
- Keep `src/lib/circuit.ts`, `src/lib/logic-core.ts`, `src/lib/computer-core.ts`, and `src/lib/tank-lab.ts` as current domain boundaries.
- Treat `evaluateCircuit()`, `srLatchStep()`, Rust CPU fetch/decode/execute, and `stepTankBattle()` as Rule Module seeds.
- `src/lib/tank-lab.ts` is the closest working World/Tick/Action/Rule prototype, but Tank Lab remains experiment-zone UI until it clearly serves the mainline.
- Machine-layer behavior should keep Rust CPU/assembler authoritative and enter the main app through WASM plus `src/lib/computer-core.ts`.
- `Signal` is important domain language, but in the current contract it should be represented through component values, state data, actions, or events rather than as a required top-level engine primitive.

## Working Reminders

- Read `docs/context-index.zh-CN.md` or `docs/context-index.md` before broad exploration.
- Do not copy long chat notes into this file; summarize and link the durable docs instead.
- If a new convention becomes durable, update the relevant `docs/` page first, then add only a short pointer here.
