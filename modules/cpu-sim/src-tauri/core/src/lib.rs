//! Pure-Rust kernel for the 8-bit teaching simulator. Kept in a lib crate so
//! `cargo test` can exercise the VM without pulling in Tauri.

pub mod assembler;
pub mod cpu;
