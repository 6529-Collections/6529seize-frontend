---
name: react-doctor
description: Run the repo's React Doctor diff check after React, Next.js, JSX, TSX, hook, routing, or UI state changes. Use when reviewing React work, finishing a feature, fixing bugs, or checking changed files for security, performance, correctness, and architecture issues.
---

# React Doctor

Run the repo-local React Doctor diff check after React or Next.js changes to catch security, performance, correctness, and architecture issues early.

## Workflow

1. Confirm the touched files include React, Next.js, JSX, TSX, hook, routing, or UI state behavior.
2. Run the repo wrapper command from the repository root:

   ```bash
   6529 run react-doctor:diff
   ```

3. Fix errors and high-confidence diagnostics first.
4. Re-run the command after React changes made in response to findings.

## Guardrails

- Use the repo-local `6529` command path. Do not run `npx react-doctor` directly in this repository.
- If the command cannot run, report the reason and perform a focused manual review of the touched React code.
- Do not claim the React Doctor score improved unless the command was re-run successfully.
