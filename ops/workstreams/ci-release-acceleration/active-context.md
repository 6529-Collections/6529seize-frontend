# Active context

- Current branch: `codex/all-museum-e2e-selection`.
- Current base: frontend main
  `a36a5a437e68d03c886471caefe0bf01afc3827c`.
- The accelerated pipeline is live. Merge-to-production was 27m38s and
  merge-to-complete-production-E2E was 38m46s. Production promotion fell from
  22m12s to 5m16s; the final PR gate fell from 45m09s to a 10m34s longest lane.
- Exact live production and its automatic 12-pack E2E are green. Durable run
  references are staging 30965170461 and production 30965872983.
- The first staging qualification of current main failed collections while an
  immediate isolated replay passed 20/20. The hosted retry passed collections
  but failed social while an immediate isolated replay passed 12/12. Both
  Museum packs passed on both hosted attempts.
- Targeted failed-pack retry is merged as `852b43fd9dc5af86aaf75c2942aea6e490544e25`.
  Staging run 30976430422 proved the retry contract but exposed one new Museum
  pack outside the original single-alias exclusion.
- Concurrent Museum shell-diagnostic PR #3602 is merged on the current base;
  its test-only change is preserved and does not overlap this manifest fix.
- This branch gives every dedicated Museum pack a manifest-owned change scope,
  excludes every scoped pack on unrelated automatic releases, and ratchets
  future `tests/museum/` packs into the same policy.
- Required release work: qualify this manifest fix, merge it, deploy exact main
  to staging, prove both Museum packs are absent for the tooling-only delta,
  promote the new exact production prebuild, obtain green automatic production
  E2E, then live readback and closeout.
