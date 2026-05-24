# Roadmap

[中文版本](ROADMAP.zh-CN.md)

`xshow circuits` is moving toward a friendly electronic brick playground for teaching simple circuits.

The project should stay visual, approachable, and immediate: users should be able to build a circuit, see what happens, and learn from the result without needing a full engineering simulator.

## Progress

Current focus: **wire routing and drag state polish**.

| Area | Status | Notes |
| --- | --- | --- |
| Interactive circuit playground | Done | Battery, switch, bulb, resistor, wires, brightness, and circuit state are working. |
| Wire selection and reconnecting | In progress | Wires can be selected, deleted, reconnected, and snapped to nearby terminals. Routing and drag states still need polish. |
| Current direction animation | Done | Closed circuits now show animated current flow on energized wires. Further polish remains possible. |
| Guided lesson mode | Not started | Needs lesson data model, lesson panel, and simple success checks. |

## Near Term

### Better wire interactions

Status: **In progress**

- [x] Select wires directly on the workbench
- [x] Drag wire endpoints to reconnect to other terminals
- [x] Drag an unselected wire endpoint directly without a separate select step
- [x] Keep selected wires above overlapping endpoints
- [x] Snap wire endpoints more clearly to nearby terminals
- [ ] Improve wire routing so connections remain readable
- [ ] Add clearer hover, drag, and drop states for wire endpoints

### Refine current direction animation

Status: **Done for v0.1, polish later**

- [x] Animate current flow when the circuit is closed
- [x] Pause current animation when the circuit is open
- [x] Make animation speed reflect simulated current strength
- [ ] Reverse animation direction when polarity changes
- [ ] Make brightness and current feedback feel more visually connected

### Guided lesson mode

Status: **Not started**

- [ ] Add a lesson panel with step-by-step tasks
- [ ] Start with battery, switch, bulb, and resistor exercises
- [ ] Provide simple success checks, such as "the bulb is on"
- [ ] Keep lesson content editable in plain data files

## Later

- [ ] More components: LED, motor, buzzer, diode, capacitor, ammeter, voltmeter
- [ ] Series and parallel circuit examples
- [ ] Save and load circuit workspaces
- [ ] Export circuits as images
- [ ] Circuit state sharing by URL
- [ ] More realistic simulation rules without turning the app into a full SPICE clone

## Product Principles

- Prefer direct manipulation over forms
- Keep the first screen useful, not explanatory
- Make circuit state visible through motion, light, and status
- Use simple educational approximations before complex physical models
- Keep the codebase small enough for learners to read
