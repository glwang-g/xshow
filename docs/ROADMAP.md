# Roadmap

[中文版本](ROADMAP.zh-CN.md)

`xshow circuits` is moving toward a friendly electronic brick playground for teaching simple circuits.

The project should stay visual, approachable, and immediate: users should be able to build a circuit, see what happens, and learn from the result without needing a full engineering simulator.

## Near Term

### Better wire interactions

- Snap wire endpoints to nearby terminals
- Keep selected wires above overlapping endpoints
- Improve wire routing so connections remain readable
- Add clearer hover, drag, and drop states for wire endpoints

### Refine current direction animation

- Improve the initial current flow animation on closed circuits
- Reverse animation direction when polarity changes
- Pause current animation when the circuit is open
- Make brightness and current feedback feel visually connected

### Guided lesson mode

- Add a lesson panel with step-by-step tasks
- Start with battery, switch, bulb, and resistor exercises
- Provide simple success checks, such as "the bulb is on"
- Keep lesson content editable in plain data files

## Later

- More components: LED, motor, buzzer, diode, capacitor, ammeter, voltmeter
- Series and parallel circuit examples
- Save and load circuit workspaces
- Export circuits as images
- Circuit state sharing by URL
- More realistic simulation rules without turning the app into a full SPICE clone

## Product Principles

- Prefer direct manipulation over forms
- Keep the first screen useful, not explanatory
- Make circuit state visible through motion, light, and status
- Use simple educational approximations before complex physical models
- Keep the codebase small enough for learners to read
