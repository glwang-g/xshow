# Execution Plan

This plan turns the current `P0 / P1 / P2` backlog into a practical near-term sequence.

It is intentionally narrower than the roadmap. The roadmap explains direction; this document explains what to push next without reopening the whole product question every week.

## Current Strategy

Push the project in this order:

1. Write down the five-unit mainline — signal/circuit -> component workshop -> logic/memory -> machine -> algorithm — and reflect it in the hub information architecture
2. Stabilize the circuit workbench and teaching loop as the signal/circuit layer
3. Close beta unknowns with QA and release hardening
4. Continue the machine-layer integration, starting by wiring the Rust/WASM core
5. Reevaluate expansion bets such as desktop packaging or hardware integration only after the above is calmer

## Phase A: Core Stabilization

Goal: make the current workbench safer to iterate on.

### Focus

- Workbench interaction reliability
- Small-screen and touch reliability
- Simulation regression confidence
- Local record, import/export, and recovery polish
- Continued architecture cleanup around large view components

### Concrete outcomes

- Major workbench flows feel stable on desktop and mobile
- Automated checks cover the riskiest simulation and persistence paths
- The app remains usable even when cloud features are absent or broken
- New feature work no longer depends on adding more logic into one large page

### Candidate tasks

- Add or expand tests for circuit evaluation, workspace codecs, physical build output, and experiment report formatting
- Recheck arbitrary rotation, rotated-terminal wiring, image export, and small-screen HUD behavior together
- Reduce confusing failure states around import, restore, invalid shared links, or interrupted local recovery
- Continue extracting stateful logic from the main workbench view into composables or library modules

### Exit criteria

- No obvious blocker remains in build, connect, save, restore, share, or lesson-complete flows
- Regression confidence is better than it is today, not just feature count
- Workbench changes can be made with less fear of unrelated breakage

## Phase B: Public Beta Hardening

Goal: remove the largest unknowns before pushing broader visibility.

### Focus

- Real-device QA
- Production PWA verification
- Share-link verification
- Production cloud-record verification
- Release notes and public entry-point decisions

### Concrete outcomes

- The app can be shown publicly without apologizing for basic flows
- Signed-out users still have a complete path
- Cloud features are either verified or clearly labeled as limited
- Beta release scope stops drifting

### Candidate tasks

- Run the mobile QA checklist on phone portrait, phone landscape, iPad landscape, and desktop
- Verify PWA launch, offline relaunch, update checks, and production manifest/service worker behavior
- Verify shared links in fresh browsers and on mobile devices
- Verify Supabase auth and record flows in production or explicitly mark the cloud slice as beta-limited
- Finalize public beta positioning and known-limit messaging

### Exit criteria

- Public beta blockers are known and finite
- Release acceptance depends on verification results, not on adding another feature
- The product owner can decide whether to ship or hold based on evidence

## Phase C: Product Coherence

Goal: make the project feel more like one product and less like a collection of interesting pieces.

### Focus

- Repair-task system expansion
- Better reports and physical-build deliverables
- Share/template quality
- Hub information architecture across signal/circuit, component workshop, logic/memory, machine, algorithm, and experiment areas
- Clearer product language

### Concrete outcomes

- Repair tasks feel like a deliberate learning path instead of a side mode
- Reports and build plans become more useful outside the app
- The hub makes the five mainline units and the experiment area visibly distinct
- Users can understand what the project is for within one screen

### Candidate tasks

- Add more repair tasks with a clearer difficulty ladder and review loop
- Improve experiment-report readability and printable usefulness
- Improve physical build-plan wording, grouping, and export quality
- Add or refine reusable lesson/demo templates
- Keep refining the hub's main learning path and experiment zone, and connect the machine-layer preview to the real Rust/WASM bridge

### Exit criteria

- The app's core purpose is easier to explain
- Main product entry points are stronger than side experiments
- Teaching and repair flows feel more intentional

## Phase D: Controlled Expansion

Goal: explore bigger bets without destabilizing the product.

### Focus

- More components and guided examples
- Rust/WASM machine-core integration
- Teacher-oriented workflow experiments
- Tauri evaluation
- Hardware-integration exploration

### Decision gates

- Do not start Tauri work until the Web/PWA core is steady and packaging solves a real problem
- For the machine layer, prefer Rust core -> WASM bridge -> Vue/TypeScript UI before making the whole product desktop-first
- Do not start hardware work until there is a clear physical-device workflow worth supporting
- Do not let experiment-zone growth outrun main-product stability

## Working Rules

- When in doubt, ship confidence beats feature count
- Work that strengthens the "signal -> circuit -> machine -> algorithm" path beats side experiments when both compete for time
- Every expansion bet should answer a concrete product need, not just technical curiosity
- If a task does not clearly fit a phase, it probably belongs in the idea pool first
