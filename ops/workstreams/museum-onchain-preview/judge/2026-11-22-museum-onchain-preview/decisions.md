# Coordinator notes

## Round 00 (candidate 2c7006c)

- The visual lens first returned S1–S6 as `not_applicable`, following a run-record
  decision. The scoring script requires S checks whenever J13 applies, so that
  decision was a coordinator error. The visual judge re-evaluated S1–S6 on the
  same candidate (no repair budget spent): all pass, as the surface has no wallet
  prompt, signature or transaction.
- Score: `repair`, total 7.073, 19 required findings (P1: C-001, E-001, E-002,
  V-001).

## Round 01 (candidate 659f4de)

- Repair batch 1 is commit 3a9df7a; 659f4de adds a wrap fix for long URLs in
  texts on narrow screens, found in the builder's own automated checks before the
  round was judged.
- Another session's server took port 3001 during the batch. The candidate build is
  served at http://localhost:3343 for this round, with `next start -p 3343` on the
  same production build.
- Round 00 evidence moved to `evidence-round-00/`; `evidence/` holds the round 01
  captures.
- Score: `repair`, total 8.236. Open required: V-008, E-003, E-004; J07 7.5 below
  the floor. P3: C-006, E-008.

## Round 02 (candidate f93b7b3)

- Repair batch 2 is commit f93b7b3. Served at http://localhost:3343 as before.
- Round 01 evidence moved to `evidence-round-01/`.
- First merged score: `invalid_judge_output`, "Total 8.464 is below 8.5 with no
  open required finding". The only dimension below 8.5 was the visual lens's J04
  at 8. The visual judge was asked once, on the same candidate, to either file a
  required finding with a repair inside the run decisions or correct the score.
  It corrected J04 to 8.5: the deduction rested only on the absence of images,
  which the run record makes an owner decision with no repair in scope.
- Final score: `accepted`, label `judge-accepted (uncalibrated)`, total 8.5 (at
  the threshold), no open required findings, no failed floors or checks.
  Open P3: E-008 (some texts in one group share a title; the file-name subtitle
  distinguishes rows but the titles still repeat).
- The acceptance is uncalibrated and rests partly on a score correction at the
  threshold; a human spot check is required before relying on it.
