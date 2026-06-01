# Architecture Notes

`Home.vue` started as a fast prototype shell. It still owns the page composition, but new domain logic should move out of it as the project grows.

## Current Split

| Area | Location | Notes |
| --- | --- | --- |
| Page shell and workbench UI | `src/views/Home.vue` | Coordinates panels, workbench interactions, persistence actions, and rendering. |
| Circuit domain model and simulation | `src/lib/circuit.ts` | Owns component types, wire types, polarity helpers, path checks, and circuit evaluation. |
| Lesson content | `src/data/lessons.ts` | Keeps lesson text, starter workspaces, and checks data-editable. |
| Cloud records | `src/lib/cloud.ts` | Wraps Supabase auth and workspace record calls. |
| Shared board state | `src/stores/board.ts` | Tracks zoom and viewport-related workbench state. |
| Small UI primitives | `src/components/ui` | Local shadcn-vue inspired components. |

## Refactor Direction

- Keep `src/lib/circuit.ts` framework-agnostic so it can be tested without Vue.
- Split large UI regions into components when they have stable boundaries: palette, workbench canvas, status tabs, records panel, cloud panel, and property inspector.
- Keep lesson content in data files rather than hard-coding it in Vue components.
- Keep persistence and cloud APIs behind small modules instead of calling browser storage or Supabase directly from every component.
- Prefer small extraction steps with passing builds over a large rewrite.

## Suggested Next Extractions

- `ComponentPalette.vue` for the left component picker.
- `StatusPanel.vue` plus focused tab components for lesson, circuit, records, cloud, selection, and wires.
- `WorkbenchCanvas.vue` for part rendering, wire rendering, and pointer interactions.
- Unit tests around `evaluateCircuit` before the node/branch model becomes more advanced.
