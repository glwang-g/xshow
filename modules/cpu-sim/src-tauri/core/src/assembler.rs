//! Two-pass assembler for the teaching ISA.
//!
//! Pass 1 walks each source line and records the *address* every label
//! resolves to (based on the size of the instructions before it). Pass 2
//! walks the same lines a second time and emits bytes, resolving any label
//! reference against the table built in pass 1.
//!
//! Kept intentionally forgiving: whitespace is free-form, commas optional,
//! comments start with `;`, and everything is case-insensitive except labels
//! (which are matched exactly).

use std::collections::HashMap;

use crate::cpu::{
    OP_ADD, OP_CMP, OP_HALT, OP_JMP, OP_JZ, OP_LOAD, OP_MOV_IMM, OP_MOV_REG, OP_STORE, OP_SUB,
    REG_A, REG_B,
};

/// Human-friendly assembler error carrying a 1-based line number.
#[derive(Debug, Clone)]
pub struct AsmError {
    pub line: usize,
    pub message: String,
}

impl std::fmt::Display for AsmError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "line {}: {}", self.line, self.message)
    }
}

impl std::error::Error for AsmError {}

/// Convenience type used everywhere in this module.
type Result<T> = std::result::Result<T, AsmError>;

/// Assemble `source` into a byte image ready to be loaded at address 0.
pub fn assemble(source: &str) -> Result<Vec<u8>> {
    let cleaned = clean(source);

    // --- Pass 1: label → address --------------------------------------------
    let mut labels: HashMap<String, u8> = HashMap::new();
    let mut cursor: usize = 0;
    for (lineno, raw) in cleaned.iter().enumerate() {
        let (label, body) = split_label(raw);
        if let Some(lbl) = label {
            if labels.contains_key(&lbl) {
                return Err(err(lineno, format!("duplicate label `{lbl}`")));
            }
            if cursor > u8::MAX as usize {
                return Err(err(lineno, "program exceeds 256 bytes".into()));
            }
            labels.insert(lbl, cursor as u8);
        }
        if let Some(body) = body {
            cursor += instr_size(body, lineno)?;
        }
    }

    // --- Pass 2: emit bytes -------------------------------------------------
    let mut out: Vec<u8> = Vec::with_capacity(cursor);
    for (lineno, raw) in cleaned.iter().enumerate() {
        let (_, body) = split_label(raw);
        let Some(body) = body else { continue };
        emit(body, lineno, &labels, &mut out)?;
    }

    if out.len() > 256 {
        return Err(err(0, format!("program is {} bytes (max 256)", out.len())));
    }
    Ok(out)
}

// --- text preparation -------------------------------------------------------

/// Strip comments and trailing whitespace but *preserve* line indices so
/// error messages point at the source the user actually typed.
fn clean(source: &str) -> Vec<String> {
    source
        .lines()
        .map(|l| {
            let no_comment = match l.find(';') {
                Some(i) => &l[..i],
                None => l,
            };
            no_comment.trim().to_string()
        })
        .collect()
}

/// Split `"label: MOV A, #1"` → (`Some("label")`, `Some("MOV A, #1")`).
/// A bare label line yields `(Some(_), None)`. An empty line yields
/// `(None, None)`.
fn split_label(line: &str) -> (Option<String>, Option<&str>) {
    if line.is_empty() {
        return (None, None);
    }
    if let Some(colon) = line.find(':') {
        let (lbl, rest) = line.split_at(colon);
        let rest = rest[1..].trim();
        let label = lbl.trim().to_string();
        let body = if rest.is_empty() { None } else { Some(rest) };
        return (Some(label), body);
    }
    (None, Some(line))
}

// --- pass 1 helpers ---------------------------------------------------------

fn instr_size(body: &str, lineno: usize) -> Result<usize> {
    let mnem = body
        .split_whitespace()
        .next()
        .ok_or_else(|| err(lineno, "empty instruction".into()))?
        .to_ascii_uppercase();
    Ok(match mnem.as_str() {
        "MOV" | "ADD" | "SUB" | "LOAD" | "STORE" | "CMP" => 3,
        "JMP" | "JZ" => 2,
        "HALT" => 1,
        other => return Err(err(lineno, format!("unknown mnemonic `{other}`"))),
    })
}

// --- pass 2 helpers ---------------------------------------------------------

fn emit(
    body: &str,
    lineno: usize,
    labels: &HashMap<String, u8>,
    out: &mut Vec<u8>,
) -> Result<()> {
    let (mnem, operands) = split_operands(body);
    match mnem.as_str() {
        "MOV" => {
            let (dst, src) = need_two(&operands, lineno, "MOV")?;
            let rd = parse_reg(dst, lineno)?;
            // Second operand is either a register or `#imm`.
            if let Some(imm) = src.strip_prefix('#') {
                let value = parse_u8(imm.trim(), lineno)?;
                out.extend_from_slice(&[OP_MOV_IMM, rd, value]);
            } else if src.starts_with(|c: char| c.is_ascii_digit()) || src.starts_with("0x") {
                // Convenience: `MOV A, 5` is treated as `MOV A, #5`, matching
                // most beginner assembly examples in textbooks.
                let value = parse_u8(&src, lineno)?;
                out.extend_from_slice(&[OP_MOV_IMM, rd, value]);
            } else {
                let rs = parse_reg(&src, lineno)?;
                out.extend_from_slice(&[OP_MOV_REG, rd, rs]);
            }
        }
        "ADD" => emit_reg_reg(OP_ADD, &operands, lineno, out)?,
        "SUB" => emit_reg_reg(OP_SUB, &operands, lineno, out)?,
        "CMP" => emit_reg_reg(OP_CMP, &operands, lineno, out)?,
        "LOAD" => {
            let (dst, addr) = need_two(&operands, lineno, "LOAD")?;
            out.extend_from_slice(&[
                OP_LOAD,
                parse_reg(dst, lineno)?,
                parse_addr(addr, labels, lineno)?,
            ]);
        }
        "STORE" => {
            let (src, addr) = need_two(&operands, lineno, "STORE")?;
            out.extend_from_slice(&[
                OP_STORE,
                parse_reg(src, lineno)?,
                parse_addr(addr, labels, lineno)?,
            ]);
        }
        "JMP" => {
            let addr = need_one(&operands, lineno, "JMP")?;
            out.extend_from_slice(&[OP_JMP, parse_addr(addr, labels, lineno)?]);
        }
        "JZ" => {
            let addr = need_one(&operands, lineno, "JZ")?;
            out.extend_from_slice(&[OP_JZ, parse_addr(addr, labels, lineno)?]);
        }
        "HALT" => out.push(OP_HALT),
        other => return Err(err(lineno, format!("unknown mnemonic `{other}`"))),
    }
    Ok(())
}

fn emit_reg_reg(op: u8, operands: &[String], lineno: usize, out: &mut Vec<u8>) -> Result<()> {
    let (a, b) = need_two(operands, lineno, "instruction")?;
    out.extend_from_slice(&[op, parse_reg(a, lineno)?, parse_reg(b, lineno)?]);
    Ok(())
}

fn split_operands(body: &str) -> (String, Vec<String>) {
    let mut it = body.splitn(2, char::is_whitespace);
    let mnem = it.next().unwrap_or("").to_ascii_uppercase();
    let rest = it.next().unwrap_or("").trim();
    let operands: Vec<String> = if rest.is_empty() {
        Vec::new()
    } else {
        rest.split(',').map(|s| s.trim().to_string()).collect()
    };
    (mnem, operands)
}

fn need_one<'a>(ops: &'a [String], lineno: usize, name: &str) -> Result<&'a str> {
    if ops.len() != 1 {
        return Err(err(lineno, format!("{name} expects 1 operand, got {}", ops.len())));
    }
    Ok(ops[0].as_str())
}

fn need_two<'a>(ops: &'a [String], lineno: usize, name: &str) -> Result<(&'a str, &'a str)> {
    if ops.len() != 2 {
        return Err(err(lineno, format!("{name} expects 2 operands, got {}", ops.len())));
    }
    Ok((ops[0].as_str(), ops[1].as_str()))
}

fn parse_reg(s: &str, lineno: usize) -> Result<u8> {
    match s.trim().to_ascii_uppercase().as_str() {
        "A" => Ok(REG_A),
        "B" => Ok(REG_B),
        other => Err(err(lineno, format!("expected register A or B, got `{other}`"))),
    }
}

/// Parse a decimal (`42`) or hex (`0x2A`) byte literal, rejecting anything
/// out of range so the user finds out at assemble time, not runtime.
fn parse_u8(s: &str, lineno: usize) -> Result<u8> {
    let s = s.trim();
    let parsed = if let Some(hex) = s.strip_prefix("0x").or_else(|| s.strip_prefix("0X")) {
        u16::from_str_radix(hex, 16)
    } else {
        s.parse::<u16>()
    };
    let value = parsed.map_err(|_| err(lineno, format!("cannot parse byte literal `{s}`")))?;
    if value > u8::MAX as u16 {
        return Err(err(lineno, format!("byte literal `{s}` doesn't fit in 8 bits")));
    }
    Ok(value as u8)
}

/// An address operand is either a numeric literal or a label reference.
fn parse_addr(s: &str, labels: &HashMap<String, u8>, lineno: usize) -> Result<u8> {
    let s = s.trim();
    // Numeric first so labels can't accidentally shadow "0x40" etc.
    if s.starts_with(|c: char| c.is_ascii_digit()) {
        return parse_u8(s, lineno);
    }
    labels
        .get(s)
        .copied()
        .ok_or_else(|| err(lineno, format!("undefined label `{s}`")))
}

fn err(line: usize, message: String) -> AsmError {
    // Convert the internal 0-based index to the 1-based line number people
    // actually see in editors.
    AsmError {
        line: line + 1,
        message,
    }
}

// ---- tests -----------------------------------------------------------------
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn assembles_basic_program() {
        let src = "MOV A, #3\nMOV B, #4\nADD A, B\nHALT\n";
        let bytes = assemble(src).unwrap();
        assert_eq!(
            bytes,
            vec![OP_MOV_IMM, REG_A, 3, OP_MOV_IMM, REG_B, 4, OP_ADD, REG_A, REG_B, OP_HALT]
        );
    }

    #[test]
    fn labels_resolve_forwards() {
        let src = "        JMP done\n        HALT\ndone:   HALT\n";
        let bytes = assemble(src).unwrap();
        // JMP + addr + HALT + HALT — done is at address 3.
        assert_eq!(bytes, vec![OP_JMP, 3, OP_HALT, OP_HALT]);
    }

    #[test]
    fn hex_and_dec_literals_both_parse() {
        let bytes = assemble("MOV A, #0x2A\nMOV B, #42\nHALT\n").unwrap();
        assert_eq!(bytes[2], 0x2A);
        assert_eq!(bytes[5], 42);
    }

    #[test]
    fn unknown_mnemonic_errors_with_line_number() {
        let e = assemble("MOV A, #1\nWAT\nHALT\n").unwrap_err();
        assert_eq!(e.line, 2);
        assert!(e.message.contains("WAT"));
    }

    #[test]
    fn undefined_label_errors() {
        let e = assemble("JMP nowhere\n").unwrap_err();
        assert!(e.message.contains("nowhere"));
    }

    #[test]
    fn duplicate_label_errors() {
        let e = assemble("l: HALT\nl: HALT\n").unwrap_err();
        assert!(e.message.contains("duplicate"));
    }

    #[test]
    fn comments_and_blank_lines_ignored() {
        let src = "; comment only\n\n   ; indented comment\nMOV A, #1 ; trailing\nHALT\n";
        let bytes = assemble(src).unwrap();
        assert_eq!(bytes, vec![OP_MOV_IMM, REG_A, 1, OP_HALT]);
    }

    #[test]
    fn mov_between_registers_uses_reg_opcode() {
        let bytes = assemble("MOV A, B\nHALT\n").unwrap();
        assert_eq!(bytes, vec![OP_MOV_REG, REG_A, REG_B, OP_HALT]);
    }
}
