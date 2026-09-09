# Run log

## 2026-08-13

- Audited production and local Museum routes. Confirmed missing Magnum imagery
  in Collection, oversized original-source payloads, empty research detail,
  administrative programme/research indexes, detached mobile counts, duplicated
  labels, and several weak empty/loading states.
- Built a deterministic source-media package with three uncropped WebP sizes per
  Magnum work and uploaded all fifteen immutable objects with exact hash, byte,
  content-type, and caching readback.
- Added strict frontend parsing and responsive image propagation across every
  relevant Museum surface. Small derivatives load first; browser selection may
  promote to larger derivatives according to viewport and pixel density.
- Integrated independent route audits and bounded corrections for research,
  detail pages, loading states, and the Lorenzo Meloni media omission.
- Passed 62 focused tests, changed lint, changed typecheck, and whitespace checks
  before source catalogue activation.
- Merged the responsive source package as
  `32637be32992a1e17981ba2919b53aac19c218a4`, its independently reviewed child
  as `8414fcea5c846ab7112fa3fa9fe936c09cdc60b2`, and the append-only catalogue
  activation as `9caa28e2eaa3d32c790850e46dea04753e71aa2a` after all exact-head Museum,
  deterministic Ubuntu/Windows, public-publication, and bot checks passed.
- Bound the frontend candidate to active catalogue
  `6529NM-PUBCAT-8414fcea5c846ab7112fa3fa9fe936c09cdc60b2`, file SHA-256
  `sha256:01c8598b0cd2019ea59e1c65595d8e57bc929bc1d2c585b2fb0e16d70af01f5e`,
  and envelope commitment
  `0xdd880b410acdcf8fd7bcdf2f2087be373fdaf1d380e88b976e1f81c1bd51564f`.
- The strict frontend compatibility probe accepted exact canonical source main
  `9caa28e2eaa3d32c790850e46dea04753e71aa2a` and resolved the reviewed
  publication commit, catalogue ID, and envelope commitment above without a
  fallback or stale state.
