# TDH Formal Model

Parent: [Network Index](README.md)

## Overview

`/network/tdh/formal` explains the Lean 4 model of TDH-v1 that is being
written, what its proofs will state and what they will not guarantee. The
page carries an `In progress` pill.

## Location in the Site

- Route: `/network/tdh/formal`
- Page heading: `Formal model`
- Browser title: `TDH formal model | Network`
- TDH section navigation: `Formal model`

## Content

- Why write the rule again (the 23 ambiguities a clean-room implementation
  found).
- What the model contains: one module per specification section; the model
  computes TDH and runs the same 36 conformance vectors.
- What the proofs will state: twelve statements, each with plain words, the
  rule it formalises and a status. Each row expands to its Lean statement.
- What the proofs will not guarantee: the English text, the Rust and Python
  code, the inputs, the fairness of the rule, Lean itself.
- Three layers of assurance diagram, and how anyone will be able to check
  once the source is published.

## Data

- Without a published manifest every statement is `Planned`.
- With `{NEXT_PUBLIC_TDH_VERIFICATION_BASE}/formal/manifest.json`, the table
  lists only what the manifest states (`Stated`, `Proved`, `Gap`), so the page
  never shows a statement as proved that the build did not prove.

## Related Pages

- [TDH-v1 Specification](feature-tdh-specification.md)
- [TDH Implementations](feature-tdh-implementations.md)
