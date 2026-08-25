# Architecture Notes

`Home.vue` started as a fast prototype shell. It still owns the page composition, but new domain logic should move out of it as the project grows.

## Current Split

| Area | Location | Notes |
| --- | --- | --- |
| Page shell and orchestration | `src/views/Home.vue` | Composes the two workbench UI regions, watches routes, owns a small set of page actions, and coordinates resource teardown; stable domain logic lives in composables and libraries. |
| Workbench UI regions | `src/components/workbench` | Header, component palette, canvas, and status panel are split from the page shell. |
| Circuit domain model and simulation | `src/lib/circuit.ts` | Owns component types, wire types, polarity helpers, wire-node merging, branch solving, and circuit evaluation. |
| Workbench UI configuration | `src/lib/workbench-ui.ts` | Owns reusable part specs, palette entries, status tabs, and board dimensions. |
| Workbench export | `src/lib/workbench-export.ts` | Renders the current circuit to a PNG without living in the page component. |
| Physical build plan | `src/lib/physical-build.ts` | Converts the current workspace into a first-pass component list, purchase keywords, wiring steps, and safety notes for hands-on building. |
| Workspace codec and records | `src/lib/workspace-codec.ts`, `src/lib/workspace-records.ts` | Owns workspace snapshot types, record types, validation, share-link encoding, and time formatting. |
| Editor history | `src/composables/useWorkbenchHistory.ts` | Owns undo/redo stacks for workspace snapshots. |
| Wire interaction | `src/composables/useWireInteraction.ts` | Owns wire creation, rewiring, branch dragging, endpoint interaction, selection, and deletion; the page keeps canvas coordinates and orchestration. |
| Canvas viewport and touch | `src/composables/useCanvasViewportGesture.ts` | Owns mobile canvas sizing, one-finger panning, pinch zooming, and pointer lifecycles. |
| Local workspace records | `src/composables/useWorkspaceRecords.ts` | Owns autosave, local records, share links, JSON import/export, and recovery messages; the page keeps snapshot content and cloud orchestration. |
| Cloud workspace sync | `src/composables/useCloudWorkspaceSync.ts` | Owns Supabase auth, account state, cloud record loading/saving/renaming/deletion, conflict handling, and sign-out. |
| Part editing | `src/composables/useWorkbenchParts.ts` | Owns part creation, duplication, deletion, switch/battery toggles, resistance/rotation/position/spring-contact editing, and coalesced history for continuous edits. |
| Part movement and relay coupling | `src/composables/useWorkbenchPartMovement.ts` | Owns dragging, keyboard nudging, grouped coil/spring movement, binding, snapping, and movement history boundaries. |
| Circuit status view adapter | `src/composables/useCircuitStatusView.ts` | Owns part classification, simulation-state fallbacks, and wire animation timing; the page keeps lesson orchestration and display composition. |
| Circuit lesson checks | `src/composables/useCircuitLessonChecks.ts` | Owns topology, component-state, and relay conditions used by lesson steps; the page keeps active-lesson selection and progress presentation. |
| Workbench selection and keyboard commands | `src/composables/useWorkbenchSelection.ts`, `src/composables/useWorkbenchKeyboard.ts` | Owns transient-selection cleanup, current-item deletion, undo/redo, duplication, nudging, zoom, and component shortcuts; the page registers events and wires commands. |
| Mobile starter layout | `src/composables/useMobileWorkbenchStarter.ts` | Owns portrait detection, lesson starter row layouts, and mobile starter-workspace adaptation. |
| Mobile workbench sizing | `src/composables/useMobileWorkbenchSizing.ts` | Owns content bounds, visible-workspace sizing, fit zoom, and default workbench-size calculations. |
| Mobile viewport effects | `src/composables/useMobileWorkbenchViewport.ts` | Owns workbench expansion, fit/scroll centering, render-frame scheduling, view reset, and teardown cleanup. |
| Experiment report | `src/composables/useExperimentReport.ts` | Owns report Markdown generation, copy feedback, clipboard fallback, and file export. |
| Workbench image export | `src/composables/useWorkbenchImageExport.ts` | Owns exporting the current workbench, simulation state, and wire styling as an image. |
| Relay module publication | `src/composables/useRelayPublication.ts` | Owns pre-publication validation, module construction, truth-table records, and local persistence. |
| Part and terminal presentation | `src/composables/useWorkbenchPartPresentation.ts` | Owns rotation, terminal coordinates, part styles, pointer coordinate conversion, and wire endpoint positions. |
| Cloud workspace view | `src/composables/useCloudWorkspaceView.ts` | Owns derived cloud-sync state, authentication copy, sync badge styling, and save-button labels. |
| Beginner guide | `src/composables/useBeginnerGuide.ts` | Owns beginner-guide state, step progression, diagnosis, guide actions, and local dismissal state; the page only connects workbench actions and presentation. |
| Workbench workspace state | `src/composables/useWorkbenchWorkspaceState.ts` | Owns workspace loading, snapshot copying, history keys, and snapshot restoration; the page keeps lesson and route navigation orchestration. |
| Workbench navigation | `src/composables/useWorkbenchNavigation.ts` | Owns lesson loading, workshop mode, published-module expansion, next-lesson flow, and demo reset; the page keeps route watching and completion-panel presentation. |
| Workbench autosave lifecycle | `src/composables/useWorkbenchAutosave.ts` | Owns workspace-change watching, debounced autosave, startup recovery, and teardown cleanup; the page supplies the default workspace and cloud-dirty callback. |
| Workbench geometry and hit testing | `src/composables/useWorkbenchGeometry.ts` | Owns terminal enumeration, nearest-terminal hit testing, and part-position constraints; the page only connects presentation coordinates and mobile workbench sizing. |
| Workbench pointer interaction | `src/composables/useWorkbenchPointerInteraction.ts` | Owns part pointer-down handling, wire/endpoint drag priority, drag completion, and terminal highlighting; the page only connects canvas events and state. |
| Circuit workbench view model | `src/composables/useWorkbenchCircuitView.ts` | Owns part counts, warnings, lesson-step state, progress, and active-lesson derivations; the page only composes the resulting view data. |
| Wire routing and crossing presentation | `src/lib/wire-routing.ts`, `src/composables/useWorkbenchWirePresentation.ts` | `wire-routing` owns orthogonal routes, collinear-point cleanup, and outside detours; the presentation composable owns terminal-side decisions, wire styling, preview paths, and topology-neutral crossing bridges. |
| PWA update prompt | `src/composables/usePwaUpdate.ts` | Owns update-event listening, prompt state, applying updates, and teardown cleanup; the page only connects the state to the canvas. |
| Workbench window lifecycle | `src/composables/useWorkbenchWindowLifecycle.ts` | Owns window/viewport events, keyboard listening, initial mobile fitting, guide restoration, and delayed cloud-session startup; the page supplies business callbacks. |
| Safe local storage | `src/composables/useSafeLocalStorage.ts` | Owns SSR-safe browser-storage access and failure fallbacks; the page and records/sync composables share one interface. |
| Workbench panel state | `src/composables/useWorkbenchPanels.ts` | Owns palette/status panel toggles, status tabs, lesson-completion prompt, and its watcher; the page only connects panel state to components. |
| Lesson highlight targets | `src/composables/useWorkbenchLessonTargets.ts` | Owns part and terminal highlight targets derived from the current lesson step; the page only passes the results to the canvas. |
| Lesson content | `src/data/lessons.ts` | Keeps lesson text, starter workspaces, and checks data-editable. |
| Cloud records | `src/lib/cloud.ts` | Wraps Supabase auth and workspace record calls. |
| Machine logic foundation | `src/lib/machine-build.ts` | Turns published, fully truth-table-verified AND / OR / NOT modules into an inspectable machine-layer logic manifest; it does not misrepresent CPU preview as gate-level execution. |
| Shared board state | `src/stores/board.ts` | Tracks zoom and viewport-related workbench state. |
| Small UI primitives | `src/components/ui` | Local shadcn-vue inspired components. |
| Domain regression tests | `tests/simulation.mjs` | Covers single-loop, series, parallel, LED/diode polarity, meter readings, battery reversal, and physical build-plan output. |

## Refactor Direction

- Keep `src/lib/circuit.ts` framework-agnostic so it can be tested without Vue.
- Continue splitting large UI regions only when the boundary is stable: records/cloud/account flows, selection inspector, and wire list.
- Keep lesson content in data files rather than hard-coding it in Vue components.
- Keep persistence and cloud APIs behind small modules instead of calling browser storage or Supabase directly from every component.
- Prefer small extraction steps with passing builds over a large rewrite.

## Suggested Next Extractions

- Focused `StatusPanel` tab components for lesson, circuit, records, cloud, selection, and wires.
- Part property editing, movement and relay coupling, wire interaction, canvas viewport, pointer lifecycle, local records, cloud sync, lesson derivations, and window lifecycle now live in focused composables; future boundaries should follow the same incremental migration and verification loop.
- Expand domain tests as new components, physical-build rules, and lesson circuits are added.
