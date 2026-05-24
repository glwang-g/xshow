# Roadmap

[中文版本](ROADMAP.zh-CN.md)

`xshow circuits` is moving toward a friendly electronic brick playground for teaching simple circuits.

The project should stay visual, approachable, and immediate: users should be able to build a circuit, see what happens, and learn from the result without needing a full engineering simulator.

## Progress

Current focus: **expanding circuit examples and guided lesson guidance**.

| Area | Status | Notes |
| --- | --- | --- |
| Interactive circuit playground | Done | Battery, switch, bulb, resistor, wires, brightness, and circuit state are working. |
| Wire selection and reconnecting | Done for v0.1 | Wires can be selected, deleted, reconnected, snapped to nearby terminals, show clearer hover/drag/drop feedback, and use more readable orthogonal routing. |
| Current direction animation | Done | Closed circuits now show animated current flow on energized wires. Further polish remains possible. |
| Guided lesson mode | Expanding | Lesson content, hints, visual targets, and starter workspaces live in editable data; multiple lesson experiments are available, and the panel checks simple circuit goals automatically. |

## Near Term

### Better wire interactions

Status: **Done for v0.1**

- [x] Select wires directly on the workbench
- [x] Drag wire endpoints to reconnect to other terminals
- [x] Drag an unselected wire endpoint directly without a separate select step
- [x] Keep selected wires above overlapping endpoints
- [x] Snap wire endpoints more clearly to nearby terminals
- [x] Improve wire routing so connections remain readable
- [x] Add clearer hover, drag, and drop states for wire endpoints

### Refine current direction animation

Status: **Done for v0.1, polish later**

- [x] Animate current flow when the circuit is closed
- [x] Pause current animation when the circuit is open
- [x] Make animation speed reflect simulated current strength
- [ ] Reverse animation direction when polarity changes
- [ ] Make brightness and current feedback feel more visually connected

### Guided lesson mode

Status: **Expanding**

- [x] Add a lesson panel with step-by-step tasks
- [x] Start with battery, switch, bulb, and resistor exercises
- [x] Allow switching between multiple guided experiments
- [x] Provide simple success checks, such as "the bulb is on"
- [x] Keep lesson content editable in plain data files
- [x] Add one-click starter workspaces for each lesson
- [x] Add lesson-level hints for the next incomplete step
- [x] Add more visual guidance on the workbench for the active step
- [ ] Add richer step completion feedback when a lesson finishes

### More circuit examples

Status: **Next**

- [ ] Add a series circuit example
- [ ] Add a parallel circuit example
- [ ] Add lesson checks for comparing brightness across examples
- [ ] Keep example circuits editable from data

## Later

- [ ] More components: LED, motor, buzzer, diode, capacitor, ammeter, voltmeter
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
