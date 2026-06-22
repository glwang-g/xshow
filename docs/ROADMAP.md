# Roadmap

[中文版本](ROADMAP.zh-CN.md)

`xshow circuits` is moving toward a friendly electronic brick playground for teaching simple circuits.

The project should stay visual, approachable, and immediate: users should be able to build a circuit, see what happens, and learn from the result without needing a full engineering simulator.

## Progress

Current focus: **v0.4 simulation calibration and lessons for new components**.

| Area | Status | Notes |
| --- | --- | --- |
| Interactive circuit playground | Done | Battery, switch, bulb, resistor, LED, buzzer, motor, diode, capacitor, ammeter, voltmeter, wires, brightness, polarity, and circuit state are working. |
| Wire selection and reconnecting | Done for v0.1 | Wires can be selected, deleted, reconnected, snapped to nearby terminals, show clearer hover/drag/drop feedback, and use more readable orthogonal routing. |
| Current direction animation | Done | Closed circuits now show animated current flow on energized wires. Further polish remains possible. |
| Guided lesson mode | Expanding | Lesson content, hints, visual targets, and starter workspaces live in editable data; basic, open-circuit, brightness, series, parallel, and LED experiments are available. |
| Workspace records | v0.3 feature complete | The browser automatically restores local workspaces; v0.3 adds Supabase email/password auth, explicit cloud records, renaming, conflict handling, and visible sync states. |
| More components | v0.4 first slice | Buzzer, motor, diode, capacitor, ammeter, and voltmeter components are available with first-pass educational feedback driven by the node/branch model. |
| Physical build bridge | First slice | The current workspace can generate, copy, and export a component list, purchase keywords, wiring steps, safety notes for hands-on building, and Markdown experiment reports. |
| Mobile responsive experience | Released in v0.2 | Small screens now use a canvas-first HUD, component drawer, floating status panel, touch pan/zoom, and larger hit targets. |
| Workbench image export | First slice | The current workbench can be exported as a PNG image for saving and sharing experiment results. |
| PWA and cross-device archives | First slice | Manifest, service worker, offline fallback, and current-workbench JSON import/export are available. |
| Deployment automation | First slice | Pushes to `main` can build the app and deploy `dist/` to a cloud server over SSH when repository secrets are configured. |

## Near Term

See [release-backlog.md](release-backlog.md) for the versioned backlog. v0.3 is now focused on cloud records without blocking signed-out local use.

### Better wire interactions

Status: **Done for v0.1**

- [x] Select wires directly on the workbench
- [x] Drag wire endpoints to reconnect to other terminals
- [x] Drag an unselected wire endpoint directly without a separate select step
- [x] Create wires by dragging directly from terminal to terminal, without a separate wire mode
- [x] Hold Alt while dragging an existing endpoint to create a branch wire from the same terminal
- [x] Keep selected wires above overlapping endpoints
- [x] Snap wire endpoints more clearly to nearby terminals
- [x] Improve wire routing so connections remain readable
- [x] Add clearer hover, drag, and drop states for wire endpoints

### Refine current direction animation

Status: **Done for v0.1, polish later**

- [x] Animate current flow when the circuit is closed
- [x] Pause current animation when the circuit is open
- [x] Make animation speed reflect simulated current strength
- [x] Reverse animation direction when polarity changes
- [x] Make brightness and current feedback feel more visually connected

### Guided lesson mode

Status: **Expanding**

- [x] Add a lesson panel with step-by-step tasks
- [x] Start with battery, switch, bulb, and resistor exercises
- [x] Allow switching between multiple guided experiments
- [x] Provide simple success checks, such as "the bulb is on"
- [x] Add guided series and parallel two-bulb experiments
- [x] Add a guided LED polarity experiment
- [x] Keep lesson content editable in plain data files
- [x] Add one-click starter workspaces for each lesson
- [x] Add lesson-level hints for the next incomplete step
- [x] Add more visual guidance on the workbench for the active step
- [x] Add richer step completion feedback when a lesson finishes

### More circuit examples

Status: **v0.3 first slice in progress**

- [x] Add a series circuit example
- [x] Add a parallel circuit example
- [x] Add lesson checks for comparing brightness across examples
- [x] Keep example circuits editable from data

### Mobile responsive experience

Status: **In progress for v0.2**

- [x] Rework the layout for narrow screens so the component palette, workbench, and right panel do not compete for the same space
- [x] Make lesson progress, status, and workspace records usable from a compact bottom sheet or drawer
- [x] Tune touch interactions for moving components, drawing wires, and reconnecting wire endpoints
- [x] Keep board zoom, pan, and terminal hit targets comfortable on phones and tablets
- [x] Add mobile screenshots or manual QA notes before tagging the next release
- [ ] Retest on iPad landscape, phone portrait, and phone landscape

### Workspace records

Status: **In progress for v0.3**

- [x] Automatically save and restore the current workspace in the same browser
- [x] Save named local records for intermediate experiment states
- [x] Load or delete saved local records from the status panel
- [x] Export the current workbench as a JSON archive
- [x] Import the current workbench from a JSON archive
- [x] Share the current workbench state by URL
- [x] Add a cloud records and cross-device sync plan
- [x] Choose Supabase and add non-blocking email/password auth
- [x] Add explicit cloud-backed save, list, load, rename, and delete records
- [x] Add visible cloud sync states
- [x] Add conflict handling for cloud records
- [x] Let shared links be copied into a signed-in user's cloud records
- [x] Prompt first-time cloud users to upload the current local workbench

### PWA and offline experience

Status: **First slice**

- [x] Add a Web App Manifest
- [x] Add iOS home screen meta tags and apple touch icon
- [x] Register a production service worker
- [x] Cache the app shell, manifest, and core icons
- [x] Add an offline fallback page
- [x] Add a refresh prompt when a new version is available

### Deployment automation

Status: **First slice done**

- [x] Build on pushes to `main`
- [x] Deploy static `dist/` output to a cloud server over SSH when secrets are configured
- [x] Document server and repository secret setup
- [x] Add a public demo URL after the first production server is configured

## Later

- [x] Generate a first-pass physical component list, purchase keywords, and wiring steps
- [ ] Map virtual parts to real kit parts or purchase links
- [ ] Export a printable physical assembly sheet
- [x] Add a polarity-sensitive LED component
- [x] Add a buzzer component
- [x] Add a motor component
- [x] More components: diode, capacitor, ammeter, voltmeter
- [x] Save and load circuit workspaces
- [x] Export circuits as images
- [x] Circuit state sharing by URL
- [x] More realistic simulation rules without turning the app into a full SPICE clone

## Product Principles

- Prefer direct manipulation over forms
- Keep the first screen useful, not explanatory
- Make circuit state visible through motion, light, and status
- Use simple educational approximations before complex physical models
- Keep the codebase small enough for learners to read
