# Active context

Updated: 2026-08-14T13:55:00Z

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

| Lane    | Task                                                          | Ownership                           |
| ------- | ------------------------------------------------------------- | ----------------------------------- |
| A       | Home, Collection, Acquisitions                                | runtime and focused tests           |
| B       | Acquisition Programs, About                                   | runtime copy, layout, focused tests |
| C       | Research landing                                              | runtime and focused tests           |
| D       | deterministic release acceptance                              | Museum tests and test helpers only  |
| Captain | shared source strip, integration, full qualification, release | this worktree                       |

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

Ready PR `#3751` is open at exact pushed head
`436f641ecbd81e51142746953504dde5c8b36dc4`. Hosted mobile qualification exposed
one further product defect under the immutable release fixture: the accessioned
Lorenzo Meloni Work page still offered the 16.9 MB source because that source
snapshot has no preserved responsive derivative. The local correction delivers
the governed source through Next's responsive runtime image optimizer only for
an accessioned Magnum Work with the recorded institutional-display basis. The
source locator, credit, rights statement, and Wave publication link remain
unchanged; non-accessioned large proposal media still requires explicit visitor
intent. Focused unit tests, changed lint and typecheck across 1,715 files, and
the clean optimized build pass. Exact fixed-fixture Playwright replay passes in
desktop and 390 px mobile Chromium. The next mutation is one signed follow-up
commit, then exact-head hosted CI and merge.
