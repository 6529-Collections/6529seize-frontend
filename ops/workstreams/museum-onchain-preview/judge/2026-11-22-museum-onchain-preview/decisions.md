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
