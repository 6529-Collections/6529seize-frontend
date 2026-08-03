# Active context

## Current state

- Clean frontend worktree and branch were created from exact `origin/main`
  `472da902945bfeab51cde4439da6dbafa90ecb90` before any tracked edit.
- Runtime, tests, i18n, help and shared-shell integration are implemented.
- Canonical Museum main is
  `bd853b483f807aad6d737305a9f78b1273bb2356` with 213 governed entries,
  manifest SHA-256
  `sha256:a403df4d775def50abf22e45829c4c47f8c239f98adb72a0375e589425f4c2cf`
  and Keccak
  `0x9e3eb6b11197c67ad4c92106213568e0af33018b8bd9fd312f2b5376c0d399c4`.
- The strict canonical-main probe is current and contains all three required
  source documents. Runtime has no candidate-branch pin.
- Desktop 1280x720 and mobile 390x844 browser review passed for About, Sources
  and the home-page source strip with the native shell and no overflow.

## Decisions

1. Add the quiet provenance/contribution strip once in `MuseumShell`; all
   Museum routes inherit it from the shared layout.
2. Pass the already-loaded atomic publication identity through the layout. Do
   not add per-page source requests.
3. Exact inspection links use the resolved commit; the actionable contribution
   link uses canonical main so instructions remain current.
4. Require `CONTRIBUTING.md`, `docs/open-museum.md` and
   `docs/onchain-transition.md` in the strict publication boundary.
5. Render visitor manuscripts as sanitized governed writing. Keep UI framing in
   Museum i18n keys and preserve authored English as explicit fallback debt.
6. State the exact Fall 2026 admitted-record and append-only-lineage goal only
   beside the explicit fact that the custom contract is not deployed or
   activated. The contract records authorized claims but makes no curatorial or
   governance decisions.
7. Preserve the art-first black/Montserrat/iron/primary-blue system. The shared
   provenance surface is quiet and never becomes a status dashboard.

## Next work

1. Freeze final formatting, focused/regression tests, changed lint/typecheck,
   React Doctor, whitespace checks and production build evidence.
2. Commit with DCO sign-off, push and open a ready focused PR.
3. Resolve every actionable bot/review thread and require exact-head green CI.
4. Merge and qualify the exact release through sanctioned staging and
   production with retained Museum desktop/mobile readback.

## External dependency

Museum post-merge workflow run `30790167909` must finish successfully. The
frontend source contract itself is no longer blocked: canonical main contains
the required governed publication.
