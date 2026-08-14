# Active context

Updated: 2026-08-14T13:35:00Z

## Objective

Ship the complete public Museum correction through PR, review, staging, E2E,
production, production E2E, and live visual readback.

## Timing

- Work began: approximately 2026-08-14T11:29:00Z.
- Fastest credible target: 2026-08-14T14:29:00Z.
- External-latency ceiling: 2026-08-14T15:29:00Z.

## Exact baseline

- Frontend base: `8e0be513a34c8d3b120f283e28215fa618f8c18c`.
- Integration branch: `codex/museum-public-site-final-release2`.
- Qualified production at start: `962e6882648d0b3cb3c28820c553a99f16c8c17d`.
- Current main already contains Museum merge `c9f99c3baf3fbaec4d5faa606024400e5a8fa44f`.
- The older Luna commits `02adff08`, `4b821c2c`, and `81efd252` are already
  integrated or superseded on current main and must not be cherry-picked.

## Parallel lanes

| Lane | Task | Ownership |
|---|---|---|
| A | Home, Collection, Acquisitions | runtime and focused tests |
| B | Acquisition Programs, About | runtime copy, layout, focused tests |
| C | Research landing | runtime and focused tests |
| D | deterministic release acceptance | Museum tests and test helpers only |
| Captain | shared source strip, integration, full qualification, release | this worktree |

## Non-negotiable acceptance

- Magnum images render on Collection through derivative-first media.
- Casey, Magnum, and Keys and Gates have balanced Museum-wide presence.
- Gifts and Meme Card-funded acquisition programs are the standing frameworks.
- Casey and Magnum are permanent-Collection acquisitions; Keys and Gates is
  shown as in progress and not counted as a holding.
- No duplicate public acquisition identifiers.
- No accidental nested box system, clipped art, horizontal overflow, or empty
  fixed-height fields at 1440, 1024, 820, and 390 pixels.
- Research is curated rather than ordered by repository completeness.
- Public copy passes the Museum scholarship standard without fake-profound,
  process-first, or contrastive LLM language.
- Exact source, rights, credit, and contribution routes remain available.

## Current phase

Ready PR `#3751` is open. Exact-head CI run `31804454944` found one real mobile
media defect and canceled its sibling lanes. The corrected local state resolves
Magnum Work media through typed aliases so a reviewed derivative renders before
the large original, and recognizes the canonical Gift Acquisitions entity in the
fail-closed framework classifier. Focused component tests, changed lint,
changed typecheck, diff hygiene, and the complete Network IA replay in desktop
and 390 px mobile Chromium pass. The next mutation is a signed corrective commit
to PR `#3751`, followed by fresh exact-head CI.
