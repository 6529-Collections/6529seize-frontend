# Active context

- Current branch: `codex/production-e2e-museum-scope`.
- Current base: frontend main
  `1b88da6214d1c97c6a22ea40e8e7e0d5285dcd0d`.
- The accelerated pipeline is live. Merge-to-production was 27m38s and
  merge-to-complete-production-E2E was 38m46s. Production promotion fell from
  22m12s to 5m16s; the final PR gate fell from 45m09s to a 10m34s longest lane.
- Exact live production and its automatic 12-pack E2E are green. Durable run
  references are staging 30965170461 and production 30965872983.
- One final efficiency defect remains in the deployed workflow: production E2E
  selected the 8m14s Museum pack for a non-Museum change. This branch centralizes
  the exact Museum path boundary, compares production against the prior
  successful production deployment, excludes Museum only when the range is
  proven clean, and validates the resulting evidence inventory.
- Required release work: focused validation, ready PR, bot/check iteration,
  merge, exact staging deployment and automatic E2E, exact production promotion
  and automatic E2E, then live version/route readback and durable closeout.
