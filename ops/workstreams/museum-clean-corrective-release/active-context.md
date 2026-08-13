# Active context

Updated: 2026-08-13 UTC

## Objective

Ship a clean 6529 Network Museum release in which the permanent Collection,
acquisition programmes, artists, works, and research are visually coherent,
factually correct, easy to navigate, and usable at 390px and desktop widths.

## Exact state

- Frontend branch: `codex/museum-responsive-images`
- Frontend base: `ac5f3e1f664e1ca2b79af2ad599369ae9676753c`
- Museum source candidate: PR #59, branch `codex/museum-responsive-magnum`
- Source candidate includes review-pending public projection. The active public
  catalogue must not move until independent review and append-only activation.
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

1. Merge candidate source A after exact-head CI and review disposition.
2. Complete independent reviewed B and append-only catalogue activation C.
3. Re-probe the exact active catalogue in the frontend and run the full focused
   Museum test/build/visual/network suite.
4. Open frontend PR, resolve exact-head bot findings, merge, qualify staging,
   deploy production, and perform live desktop/mobile route and network audits.
