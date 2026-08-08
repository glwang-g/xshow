# CPU Sim WASM Facade

This crate is the browser bridge for the `cpu-sim-core` Rust VM.

It keeps the CPU behavior in Rust and exposes the same operations the main app
expects through `src/lib/computer-core.ts`:

- `loadProgram(source)`
- `step()`
- `reset()`
- `getState()`
- `runUntilHalt(maxSteps)`

Snapshots are serialized with camelCase fields (`flagsByte`,
`currentInstruction`) so the Vue app can consume them without depending on the
Tauri frontend's snake_case types.

## Build

When Rust and `wasm-pack` are available:

```bash
cd modules/cpu-sim/wasm
wasm-pack build --target bundler --out-dir pkg
```

The generated package can then be wrapped with `createWasmComputerCore()` in the
main app.

## Verification Note

The facade has been compiled with `wasm-pack build --target web --out-dir pkg`
and the generated `pkg/` is committed so the main app builds without a local
Rust toolchain. After changing Rust code, regenerate and commit the package:

```bash
cd modules/cpu-sim/wasm
wasm-pack build --target web --out-dir pkg
```

`wasm-opt` is disabled in `Cargo.toml` because binaryen downloads are
unreliable on CN networks; the small teaching CPU does not need it. The main
app calls the package's default `init()` (which Vite resolves to the emitted
`.wasm` asset) before wrapping the module with `createWasmComputerCore()`.
The TypeScript-side `ComputerCoreApi` adapter is covered by the main app tests.
