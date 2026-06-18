---
name: sonar-guardrails
description: Review TypeScript and JavaScript edits for predictable Sonar quality issues in this repository. Use before and after changing tests, mocks, parsing logic, helper functions, branching logic, or code likely to trigger Sonar complexity and correctness rules.
---

# Sonar Guardrails

Use these guardrails before and after TypeScript or JavaScript edits that are likely to trigger Sonar quality findings.

## Workflow

1. Identify touched TypeScript and JavaScript files, especially tests, mocks, parsers, helpers, and branching-heavy code.
2. Apply the checklist while editing.
3. Re-scan the diff before finishing.
4. Run a focused repo check when the changes are code-bearing:

   ```bash
   6529 run lint:changed
   ```

   Use `6529 run check:changed` when the change also needs type checking.

## Checklist

- Prefer `globalThis` over `global`.
- Avoid empty mock classes; add a minimal member or use a plain object when possible.
- Avoid redundant type assertions in tests.
- Avoid nested ternaries; extract explicit statements or helper functions.
- Keep helper functions below cognitive complexity thresholds by extracting small predicates and mappers.
- Validate string-to-number parsing strictly when partial numeric input must be rejected.
- Prefer named intermediate values when repeated conditions make assertions or branches hard to read.

## Reporting

- Mention any Sonar-sensitive patterns you fixed.
- If focused checks cannot run, report why and include the manual diff scan result.
