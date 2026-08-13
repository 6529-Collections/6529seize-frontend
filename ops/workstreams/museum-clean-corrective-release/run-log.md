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
