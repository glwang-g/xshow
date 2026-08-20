# Product Backlog

This backlog organizes the current product direction into priority bands so `xshow circuits` can keep exploring while converging on the updated product north star.

The current north star is in [product-north-star.md](product-north-star.md):

> `xshow` is an interactive computer science visualization platform that connects signals, circuits, machines, and algorithms.

It assumes the project now has these layers:

- Mainline units: signal/circuit, component workshop, logic/memory, machine, and algorithm
- Current foundation: circuit workbench, repair tasks, and teaching flow
- Logic-layer progress: Logic Lab now has a main-app preview entry covering gates, an SR latch, and a 1-bit register
- Machine-layer progress: the CPU simulator now has a main-app preview entry; next, wire it to the Rust/WASM machine core
- Experiment zone: Tank Lab, Rubik's Cube, and future interactive prototypes

The goal is not to freeze exploration. The goal is to make it obvious which work strengthens the core product first.

For the practical near-term sequence, see [execution-plan.md](execution-plan.md).

## P0: Core Product

These items should get the next serious push because they make the main product more stable, teachable, and easier to extend.

### Workbench reliability and interaction quality

- Make drag, wire creation, endpoint reconnecting, selection, and arbitrary rotation feel consistently reliable
- Reduce accidental taps and touch misfires on phones and tablets
- Improve canvas performance and frame stability on larger workspaces
- Retest keyboard shortcuts, hover states, and small-screen HUD flows after major workbench changes

### Simulation credibility

- Keep improving the node/branch solver for teaching-grade correctness
- Expand regression coverage for polarity, current flow, meter readings, and component feedback
- Make error and edge-case states easier to understand when a circuit is invalid or incomplete
- Keep simulation outputs visually aligned across wire animation, brightness, meters, and status copy

### Teaching loop and guided lessons

- Strengthen lesson progression, step checks, and completion feedback
- Add clearer "what should I do next" guidance for new users
- Keep lesson starter workspaces easy to load, reset, and compare
- Tune guided content so users can move from free play into structured experiments without confusion

### Publishable layered construction

- Follow [buildable-computing-stack.md](buildable-computing-stack.md): publish circuit constructions as expandable logic modules, then publish logic modules as hardware modules
- Finish hand-built relays, contacts, latches, and port marking before progressing to gates, adders, and 8-bit machine composition
- Keep repair tasks as an introductory and diagnostic path rather than the priority for mainline expansion

### Local records, export, and recovery

- Polish autosave, restore, named records, JSON import/export, PNG export, and share-link restore
- Make recovery flows calmer and clearer after failed imports, invalid data, or stale shared links
- Keep signed-out local usage first-class even when cloud features are unavailable

### Architecture and test safety rails

- Continue moving domain logic out of large view components and into composables or library modules
- Add stronger automated coverage around circuit evaluation, workspace codecs, physical build output, and experiment reports
- Protect current features with regression checks before expanding into larger product slices

## P1: Productization

These items move the project from a good prototype toward a tool that feels coherent and repeatable for teaching use.

### Repair task system

- Expand task count, failure patterns, hint levels, and progression pacing
- Add stronger replay, review, and "try again" loops
- Clarify the relationship between repair tasks and the free-form circuit workbench

### Reports, build plans, and classroom deliverables

- Improve experiment report quality so it is more useful for review, submission, or printing
- Improve physical build plans with clearer wiring steps, inventory grouping, and better educational language
- Add printable output formats where they help teachers or students use results outside the app

### Sharing and templates

- Improve read-only share flows and copy-to-own-record flows
- Add reusable starter templates for lessons, demos, or teacher-prepared exercises
- Make it easier to move from a shared example into an editable personal workspace

### Cloud continuation

- Improve live QA and reliability around sign-in, save, load, rename, delete, and conflict handling
- Organize cloud records more clearly as usage grows
- Keep cloud sync visible but non-blocking for users who only want local use

### Information architecture and product clarity

- Keep separating the signal/circuit, component workshop, logic/memory, machine, algorithm, and experiment areas on the hub page
- Reduce ambiguity about what the project is primarily for
- Keep side experiments visible without letting them compete with the core entry points

### Gamified mainline and mission world

- Use [gamified-evolution-plan.md](gamified-evolution-plan.md) to turn the mainline into a mission world instead of a module directory
- Start by turning "light, measure, diagnose, build, run" into explicit mission nodes before adding competitions or growth systems
- Make Logic Lab and Computer Lab feel like next stages in the same campaign rather than detached tools
- Add chapter trees, map structure, and visible progression without regressing into a quiz-first platform

## P2: Expansion

These items are valuable, but they should follow after the core loop and product shape are more stable.

### More components and richer circuit rules

- Add more teaching-friendly components and scenarios
- Improve realism only where it clearly supports learning and does not turn the app into a full engineering simulator
- Add more guided examples that use the newer components well

### Teacher-oriented workflows

- Add teacher templates, presentation presets, or classroom-ready starter packs
- Explore assignment, review, or classroom organization flows if the product direction keeps pointing there

### Desktop enhancement

- Evaluate a thin Tauri shell only after the Web/PWA core feels settled
- For the machine layer, prefer Rust/WASM core reuse before making the whole product desktop-first
- Start with native file access, export destinations, and packaging rather than rewriting the product around desktop assumptions

### Hardware integration

- Explore serial, USB, or board integration only if the project deliberately expands into physical-device workflows
- Treat hardware support as a separate product bet, not a casual add-on

### Experiment zone growth

- Keep Tank Lab, Rubik's Cube, and future side projects in a clearly marked exploration area
- Reevaluate later whether any experiment deserves its own repo, domain, or product identity

## Idea Pool

These ideas are worth tracking, but they should stay out of the active backlog until a stronger product need appears.

- Class spaces
- Assignment submission
- Teacher review dashboards
- Community circuit sharing
- Achievement or progression systems
- Deeper 3D visualization
- Real kit SKU mapping and purchasing bundles
- Device-specific integrations

## Working Rules

- Work that strengthens the "signal -> circuit -> machine -> algorithm" path beats side exploration when priorities conflict
- Side projects are allowed, but they should not blur the hub's main message
- Product direction should stay compatible with signed-out local use, fast first-time play, and teaching-friendly immediacy
- New ideas should enter through this backlog instead of expanding the main roadmap without priority
