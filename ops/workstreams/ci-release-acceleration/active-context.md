# Active context

- The CI and release acceleration workstream is complete.
- Live production version:
  `2edfb2610c0cca9f49d45c5465c43bba8a20077e`, with three consecutive
  `/api/version` readbacks reporting the same announced and served version and
  `stale:false`.
- Exact staging composition:
  `12b40bd96de7f3769c4738a8796e7f915d34db0f`, containing exact main
  `2edfb2610c0cca9f49d45c5465c43bba8a20077e`.
- Final hosted qualification:
  - PR App CI 30979078634: success; quality 2m56s, smoke 3m33s, critical
    shell 4m39s, production build 11m23s, Museum omitted.
  - Staging deploy 30979848612: success in 12m59s.
  - Concurrent production prebuild 30979804039: success in 14m47s; immutable
    artifact SHA-256
    `5006419d86d2ab7faad723896a22590fac69b40caddf277f295bf6cd3e96c0d9`.
  - Staging E2E 30980599423: success in 6m49s; 12 packs, three workers, zero
    Museum packs, one collection-only retry, zero final failures.
  - Production promotion 30981038834: success in 5m58s without rebuilding.
  - Production E2E 30981386269: success in 2m53s; 11 packs, three workers,
    zero Museum packs, zero retries, zero failures.
- Merge-to-production was 27m47s. Merge-to-qualified-production was 30m47s.
- Reviewer-accessible retained evidence:
  - [Staging E2E run 30980599423](https://github.com/6529-Collections/6529seize-frontend/actions/runs/30980599423),
    artifact `staging-e2e-artifacts-30980599423`, retained by GitHub through
    2026-09-04.
  - [Production E2E run 30981386269](https://github.com/6529-Collections/6529seize-frontend/actions/runs/30981386269),
    artifact `production-e2e-artifacts-30981038834`, retained by GitHub through
    2026-09-04.
  - Operator-local mirrors are under
    `C:\Users\Administrator\.codex\artifacts\ci-release-final`; these are
    machine-local convenience copies, not the portable review record.
- No release action remains. A future performance iteration can benchmark a
  provisioned larger build runner against `ubuntu-latest`; runner variables are
  already available, but no unprovisioned label is referenced.
