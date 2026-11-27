---
name: fe-polish-judge
description: Run an independent judge loop that scores a 6529 frontend surface against the frontend polish rubric and drives builder repairs to the 8.5 bar. Use when asked for a polish review, a builder–judge or judge loop, an FE quality score, or autonomous iteration on a page until it meets the 6529 standard, including wallet, mint, delegation, and other crypto flows, and the Network Museum pre-PR visual gate (Museum profile). Not for WCAG conformance audits (use wcag-22-aa) or ordinary code review.
---

# FE Polish Judge

Run the loop defined in `ops/standards/frontend-polish-judge.md`. Read that
standard and `ops/standards/frontend-design-ui-ux.md` first.

## Workflow

1. **Pin the run.** Create `<run-dir>/run.json` from
   `references/run-record.md` (full or lite template). Record the audience,
   primary task, routes, in-scope states, viewports, locales, auth, N/A
   dimensions with reasons, references, and budget. Mark J13 applicable for any
   wallet, signature, transaction, address, ownership, delegation,
   consolidation, or fee surface. For changed `/museum/network` routes, use
   the Museum template (`"profile": "museum"`).
2. **Capture evidence.** Render the candidate and capture the pinned matrix into
   `<run-dir>/evidence/` with the browser tooling at hand. Set the browser
   context locale for non-`en-US` cells. Record task and recovery-path
   observations alongside the screenshots. For crypto flows, use simulated
   stages or a component harness; never sign a real transaction. Use the
   `6529-agent-login` skill for signed-in surfaces. After the baseline,
   recapture only what the repair batch can affect. Museum runs use a
   production build, full-page captures at all three widths, and a contact
   sheet per viewport.
3. **Judge.** Start a fresh-context judge agent (prefer a different model from
   the builder) with `references/judge-prompt.md`, `run.json`, the evidence
   folder, and the previous round's output. Leave out the builder's narrative.
   Save its JSON as `<run-dir>/rounds/NN.json` (`00-baseline.json` first).
   For a Museum run, start three independent judges, one per lens
   (`curatorial`, `visual`, `copy`), each with its lens brief from the prompt,
   and save their outputs as `<run-dir>/rounds/NN/<lens>.json`.
4. **Score.** Run:

   ```bash
   node ops/skills/fe-polish-judge/scripts/score.mjs <run-dir>
   ```

   Act on `decision`:
   - `invalid_judge_output`: rerun the judge once with `errors` quoted. If it
     fails again, stop and report.
   - `incomplete`: capture the missing evidence named in `unverified`, then
     rejudge.
   - `repair`: fix the open required findings in user-impact order as one
     coherent batch, commit, set `candidate.commit` in `run.json` to the new
     head, then repeat from step 2. When `budget.recovery_batch` is
     true, target the single most promising required finding.
   - `accepted`: stop. Report the label `judge-accepted (partially calibrated)`.
   - `threshold_not_reached`: stop. Report the `best` round and its unresolved
     findings.
   - If a prerequisite (fixture, environment, auth) is genuinely unavailable,
     stop as `blocked` with the evidence.

5. **Accessibility.** When the task needs an AA outcome, run the `wcag-22-aa`
   skill on the accepted candidate. Report it separately. AA repairs trigger a
   rejudge of only the affected findings and evidence.

## Builder rules

- Fix findings within the authorized scope. Do not edit `run.json` frozen
  fields, the judge's scores, or finding statuses; only the judge resolves a
  finding.
- Keep everything listed under `preserve`.
- Put replacement copy into `i18n/messages` keys for every supported locale.
- Respect the Capacitor iOS NFT purchasing rule in `AGENTS.md` for any mint or
  subscription surface.
- Commit repairs with the usual DCO signoff and run the changed-file checks from
  `AGENTS.md` before closing the loop.

## Closeout

Report the decision, the final total, any P3 findings left as optional, the
evidence location, the separate accessibility outcome, and the calibration
label. For a Museum run, open the PR only after `accepted`, and do the
staging and production readback in
`ops/standards/museum-visual-release-acceptance.md`.

## Resources

- `references/run-record.md`: run record templates and run directory layout.
- `references/judge-prompt.md`: the judge's instructions and output format.
- `scripts/score.mjs`: validates judge output, enforces the iteration rules,
  and computes the decision.
