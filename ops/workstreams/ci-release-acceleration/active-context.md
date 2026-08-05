# Active context

- Current branch: `codex/e2e-pack-targeted-rerun`.
- Current base: frontend main
  `5b03302719b306b29582d43f6910fd1a843de1f7`.
- The accelerated pipeline is live. Merge-to-production was 27m38s and
  merge-to-complete-production-E2E was 38m46s. Production promotion fell from
  22m12s to 5m16s; the final PR gate fell from 45m09s to a 10m34s longest lane.
- Exact live production and its automatic 12-pack E2E are green. Durable run
  references are staging 30965170461 and production 30965872983.
- The first staging qualification of current main failed collections while an
  immediate isolated replay passed 20/20. The hosted retry passed collections
  but failed social while an immediate isolated replay passed 12/12. Both
  Museum packs passed on both hosted attempts.
- This branch keeps the three-worker first pass and adds one serial rerun of
  failed packs with per-attempt evidence. Persistent failures remain blocking.
- Required release work: open and qualify the targeted-retry PR, merge it,
  deploy exact main to staging, obtain green automatic E2E, promote the exact
  production prebuild, obtain green automatic production E2E, then live
  readback and closeout.
