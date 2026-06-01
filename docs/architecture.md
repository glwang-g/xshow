# Architecture Notes

`Home.vue` started as a fast prototype shell. It still owns the page composition, but new domain logic should move out of it as the project grows.

## Current Split

| Area | Location | Notes |
| --- | --- | --- |
| Page shell and orchestration | `src/views/Home.vue` | Coordinates workbench state, interaction handlers, persistence actions, and cloud sync. |
| Workbench UI regions | `src/components/workbench` | Header, component palette, canvas, and status panel are split from the page shell. |
| Circuit domain model and simulation | `src/lib/circuit.ts` | Owns component types, wire types, polarity helpers, path checks, and circuit evaluation. |
| Workbench UI configuration | `src/lib/workbench-ui.ts` | Owns reusable part specs, palette entries, status tabs, and board dimensions. |
| Workbench export | `src/lib/workbench-export.ts` | Renders the current circuit to a PNG without living in the page component. |
| Workspace codec and records | `src/lib/workspace-codec.ts`, `src/lib/workspace-records.ts` | Owns workspace snapshot types, record types, validation, share-link encoding, and time formatting. |
| Editor history | `src/composables/useWorkbenchHistory.ts` | Owns undo/redo stacks for workspace snapshots. |
| Lesson content | `src/data/lessons.ts` | Keeps lesson text, starter workspaces, and checks data-editable. |
| Cloud records | `src/lib/cloud.ts` | Wraps Supabase auth and workspace record calls. |
| Shared board state | `src/stores/board.ts` | Tracks zoom and viewport-related workbench state. |
| Small UI primitives | `src/components/ui` | Local shadcn-vue inspired components. |

## Refactor Direction

- Keep `src/lib/circuit.ts` framework-agnostic so it can be tested without Vue.
- Continue splitting large UI regions only when the boundary is stable: records/cloud/account flows, lesson progress, selection inspector, and wire list.
- Keep lesson content in data files rather than hard-coding it in Vue components.
- Keep persistence and cloud APIs behind small modules instead of calling browser storage or Supabase directly from every component.
- Prefer small extraction steps with passing builds over a large rewrite.

## Suggested Next Extractions

- Focused `StatusPanel` tab components for lesson, circuit, records, cloud, selection, and wires.
- Cloud/workspace sync composables so account state and record persistence stop living in `Home.vue`.
- Wire interaction composables for endpoint dragging, snapping, and route rendering.
- Unit tests around `evaluateCircuit` before the node/branch model becomes more advanced.
