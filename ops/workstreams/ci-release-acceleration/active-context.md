# Active context

- Current branch: `codex/e2e-soft-route-retry`.
- Current base: frontend main
  `1b88da6214d1c97c6a22ea40e8e7e0d5285dcd0d`.
- The accelerated pipeline is live. Merge-to-production was 27m38s and
  merge-to-complete-production-E2E was 38m46s. Production promotion fell from
  22m12s to 5m16s; the final PR gate fell from 45m09s to a 10m34s longest lane.
- Exact live production and its automatic 12-pack E2E are green. Durable run
  references are staging 30965170461 and production 30965872983.
- PR #3599 is merged as `8c7f0daec20d3d4d226ebfef74e4d6a7dbe2e189`.
  Its production prebuild is running. Keys and Gates staging Museum coverage
  passed, but two independent collections runs observed different HTTP 200
  soft-error documents. This branch adds one bounded retry for those documents;
  persistent error/404 pages remain release-blocking.
- Required release work: merge this narrow harness repair, deploy exact main to
  staging, obtain green automatic E2E, promote the exact production prebuild,
  obtain green automatic production E2E, then live readback and closeout.
