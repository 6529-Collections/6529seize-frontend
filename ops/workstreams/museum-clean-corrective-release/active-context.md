# Active context

Updated: 2026-08-13 UTC

## Objective

Ship a clean 6529 Network Museum release in which the permanent Collection,
acquisition programmes, artists, works, and research are visually coherent,
factually correct, easy to navigate, and usable at 390px and desktop widths.

## Exact state

- Frontend branch: `codex/museum-responsive-images`
- Frontend base: `ac5f3e1f664e1ca2b79af2ad599369ae9676753c`
- Museum responsive source package: PR #59, merged as
  `32637be32992a1e17981ba2919b53aac19c218a4`.
- Independently reviewed source package: PR #60, merged as
  `8414fcea5c846ab7112fa3fa9fe936c09cdc60b2`.
- Append-only catalogue activation: PR #61, merged as
  `9caa28e2eaa3d32c790850e46dea04753e71aa2a`.
- Active catalogue ID:
  `6529NM-PUBCAT-8414fcea5c846ab7112fa3fa9fe936c09cdc60b2`.
- Active catalogue file SHA-256:
  `sha256:01c8598b0cd2019ea59e1c65595d8e57bc929bc1d2c585b2fb0e16d70af01f5e`.
- Active catalogue envelope commitment:
  `0xdd880b410acdcf8fd7bcdf2f2087be373fdaf1d380e88b976e1f81c1bd51564f`.
- Fifteen governed Magnum WebP derivatives are uploaded under immutable CDN
  keys: 640, 1280, and 2400 pixels for each of the five accessioned works.

## Implemented frontend boundary

- Strict parser joins the accession presentation manifest to exact catalogue
  files, source fixity, display authority, and work media entities.
- Image rendering starts with the 640px derivative and supplies 1280/2400
  `srcset` candidates plus route-appropriate `sizes`; large Arweave source files
  are never the ordinary page payload when governed derivatives exist.
- Collection, acquisition, work, artist, research, and home call sites carry the
  same responsive media model.
- Research cards and detail pages render complete governed manuscripts without
  raw filenames, duplicated labels, or empty article bodies.
- Mobile counts, work labels, captions, loading states, and project headings are
  corrected.

## Local validation

- Focused Museum suites: 62 tests across 11 suites pass.
- Changed-file typecheck: pass, 1,657 files.
- Changed-file lint: pass.
- `codex-diff-check`: pass.

## Remaining release path

1. Re-probe the exact active catalogue in the frontend and rerun candidate CI
   against the active publication.
2. Merge frontend PR #3744, qualify staging, deploy production, and perform live
   desktop/mobile route and network audits.
