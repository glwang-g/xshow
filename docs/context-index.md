# Context Index

Use this index to quickly find the repository conventions and durable notes that already exist. Before broad code exploration, read this file and then open only the relevant docs for the task.

## Default Reading Order

1. Read this file.
2. Pick the relevant docs from the routing table below.
3. Then inspect source, tests, or git diffs.

## Task Routing

| Question | Read First |
| --- | --- |
| Product origin, north star, and mainline boundaries | `docs/product-north-star.md`, `docs/product-backlog.md`, `docs/execution-plan.md` |
| Building circuits into reusable logic, hardware, and algorithm layers | `docs/buildable-computing-stack.md` |
| Gamified direction, mission world, and campaign structure | `docs/gamified-evolution-plan.md`, `docs/product-north-star.md` |
| Roadmap and phased capabilities | `docs/ROADMAP.md` |
| Near-term release scope and public beta status | `docs/release-backlog.md`, `docs/releases/public-beta-candidate.md` |
| Architecture boundaries and where code should live | `docs/architecture.md` |
| Programmable World Engine migration and layer ownership | `docs/world-engine.md`, `docs/layers.md`, `src/lib/world-engine.ts` |
| Cloud records, Supabase, cross-device sync | `docs/cloud-sync-plan.md`, `docs/supabase-schema.sql` |
| Deployment and server release flow | `docs/DEPLOYMENT.md` |
| Mobile, PWA, and QA notes | `docs/mobile-qa.md`, `docs/v0.2-qa-report.md` |
| Cross-project Freexlib world contract | sibling repo `freexlib-portal` -> `docs/world-contract.md` |
| What the latest dev pull added | `docs/dev-pull-summary-2026-07-03.zh-CN.md` |
| CPU simulator and Rust/WASM integration | `docs/rust-wasm-computer-core.md`, `modules/cpu-sim/README.md` |
| Issue ideas or scoped task drafts | `docs/issue-drafts/*.md` |

## Existing Conventions

- Product north star: an interactive computer science visualization platform connecting signals, circuits, machines, and algorithms.
- Mainline layers: signal/circuit, logic/memory, machine, and algorithm.
- The circuit workbench and repair tasks belong to the signal/circuit layer.
- The mainline crosses layers by publishing expandable modules: circuit work becomes logic input, logic work becomes hardware input, then an executable machine and algorithms. See `docs/buildable-computing-stack.md`.
- Logic Lab is now a mainline logic/memory preview bridging circuit signals and machine state.
- The CPU simulator is now a mainline machine-layer preview, not just another experiment.
- Tank Lab and 3D Rubik's Cube belong to the experiment zone unless they start serving the mainline path.
- Put broad product direction in `docs/product-backlog.md`; use `docs/execution-plan.md` for near-term order.
- For gamification, prefer missions, debugging, construction, and world-map structure over quiz-centric design.
- Use `docs/release-backlog.md` for release scoping.
- Check `docs/architecture.md` before moving logic across modules.
- Treat the World Engine as a gradual contract layer first: add adapters around existing rule modules before rewriting labs.
- Cross-project terms (World, Entity, Observation, Intent, Rule, Event, Replay, Snapshot) follow the Freexlib contract in sibling repo `freexlib-portal/docs/world-contract.md`.
- Keep `docs/world-engine.md` and `docs/layers.md` as the migration map for World/Entity/State/Tick/Rule/Scenario/Replay work.
- For machine-layer integration, prefer Rust core -> WASM bridge -> Vue/TypeScript UI.
- Keep English and Chinese docs aligned when both versions exist.
- If a temporary discovery becomes reusable context, write a short doc and link it from this index.

## Common Verification

Main project:

```bash
pnpm test
pnpm typecheck
pnpm build
```

CPU simulator core:

```bash
cd modules/cpu-sim/src-tauri
cargo test
```

Note: after pulling code with new dependencies, run `pnpm install` first. Otherwise typecheck/build can fail because local `node_modules` is stale.
