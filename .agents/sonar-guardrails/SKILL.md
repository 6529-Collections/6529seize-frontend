---
name: sonar-guardrails
description: Use before and after TypeScript edits to avoid predictable Sonar issues in this repository.
version: 1.0.0
---

# Sonar Guardrails

Before finishing TypeScript changes, scan touched code for predictable Sonar issues:

- Prefer `globalThis` over `global`.
- Avoid empty mock classes.
- Avoid redundant type assertions in tests.
- Avoid nested ternaries; extract explicit statements or helper functions.
- Keep helper functions below cognitive complexity thresholds by extracting small predicates and mappers.
- Validate string-to-number parsing strictly when partial numeric input must be rejected.
