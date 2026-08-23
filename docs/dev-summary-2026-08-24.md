# Development Handoff: 2026-08-24

This note records the mainline work and hardening merged into `master` from `2026-08-23` through `2026-08-24`. Commit range: `758a478` through `690025c`.

## Goal

Move the five-unit path beyond page-to-page navigation into a traceable, verifiable learning chain: gates published from the component workshop compose into logic modules, and those modules explain machine- and algorithm-layer results. At the same time, remove immature public capability and lower workbench regression risk.

## Completed

### 1. Buildable-computing mainline

- Published workshop gates now compose into half adders, full adders, and an eight-bit ripple-carry adder.
- Algorithm-layer addition predictions trace back to verified workshop gates; machine runs provide cross-checks for those predictions.
- Published modules retain complete source workspaces so later layers can safely expand them back into the workshop for inspection.
- Truth tables must be complete with unique inputs, and damaged, stale, or topologically incomplete local modules do not enter the mainline.

### 2. Expression and reliability

- The algorithm lab now starts in an observable idle state rather than auto-running.
- Machine bridge status no longer claims a fixed WASM availability; failed actions retain visible, recoverable explanation.
- Direct dragging, rotation, resistance, coordinates, and contact-mode edits participate in undo history. Continuous property input is coalesced, and empty relay-binding operations do not create history entries.

### 3. Public boundaries and performance

- The immature physical-build checklist was removed from public workbench tabs, runtime computation, and experiment reports. Its underlying library and tests remain until real kit mapping is ready.
- The palette and status panel are asynchronous modules. Rubik rendering and solving remain behind the exploration route, outside workbench first-load cost.
- Vite was upgraded to `6.4.3`, with a safe `brace-expansion` version locked. Local `pnpm audit` and production-dependency audit report zero findings. Old GitHub Dependabot notices may be scan lag and must not be presented as remotely cleared.

### 4. Desktop workbench regression fixes

- With deferred side panels absent, CSS Grid could auto-place the canvas in the left column and shift the whole workspace.
- The left, center, and right regions now use explicit columns in one row, so deferred mounting cannot move the canvas.
- Desktop viewports render the palette and status panel on entry; small screens retain on-demand panels, preventing empty desktop rails.

Key commits: `0fc273f`, `629ff41`, and `690025c`.

## Verification record

```bash
pnpm test       # 102 tests
pnpm typecheck
pnpm build
pnpm test:dist  # 4 tests
git diff --check
```

No connectable browser instance was available in this environment, so the desktop side-panel result is not claimed as a real-browser visual regression pass. The next QA should first open `/workbench/free` and `/workbench/workshop` in a real desktop browser at >=1280px and verify visible side panels, a centered canvas, and stable layout after resizing.

## Recommended next steps

1. Run desktop and real-device visual QA before further feature expansion.
2. Keep the physical-build checklist hidden until real kit/SKU mapping and safety wording are reviewed.
3. Any future change to deferred workbench panels must cover desktop entry, panel opening/closing, and resize transitions from small to desktop layouts.
