# Active context

Updated: 2026-08-18T11:34:00Z

## Research-only corrective release (2026-08-15)

- Branch: `codex/museum-research-editorial`.
- Base: frontend main `f5ab92357a5d8797313f88a436dcecc67b846e63`.
- Scope is limited to the Research landing and Research section/detail routes.
- The landing is an authored catalogue with six counted content sections and 25
  landing cards. Its authoritative inventory is:
  - Acquisition research: 3 cards — _The System in Seven States_ (Casey Reas,
    Permanent Collection), _Conflict at Its Edges_ (Magnum Photos, Permanent
    Collection), and _Access, Control, and Exit_ (Keys and Gates, Acquisition
    in progress).
  - Artists: 6 cards — Casey Reas, Larry Towell, Moisés Saman, HugoFaz,
    nasimghanizadeh, and shamspranto. Each is one canonical artist profile;
    none is an acquisition-owned artist row, and the prohibited label
    “connected work” is not used.
  - Works and projects: 6 cards — _Pre-Process #63_, _Phototaxis #308_,
    _Demonstration, Western Wall, Jerusalem_, _Palmyra, Syria_, _No Key, Only
    Light_, and _the cost of open_. Each study is tied to the Work it reads.
  - Organizations and contexts: 2 cards — Magnum Photos as an organization
    and Keys and Gates as an acquisition-program context. Neither is presented
    as an artist or as a substitute artist profile.
  - Digital-art stewardship: 4 cards — _Inside the System_, _Rights and
    licenses_, _Data architecture and the public record_, and the reproducible
    generative-art descriptor methodology.
  - Museum practice: 4 cards — _Museums to learn from_, _Scholarship and
    writing standard_, _The Open Museum_, and _Repository-to-chain transition_.
    The Rights and licenses card and the Data architecture and the public record
    card occur once each, in Digital-art stewardship. They are not repeated in
    Museum practice; their detail routes are supporting reading, not duplicate
    landing cards. The complete 101-record index remains searchable but is closed
    on initial load.
- Acquisition status is explicit: Casey Reas and Magnum are in the permanent
  Collection; Keys and Gates remains an acquisition in progress.
- The permanent pre-PR gate is recorded in `AGENTS.md` and
  `ops/standards/museum-visual-release-acceptance.md`: production-build,
  full-page screenshots of every changed route at 1440, 820, and 390 pixels,
  followed by independent museum-quality, visual/UX, and copy reviews.
- The reviewed Research publication commit is
  `75171e81587c9da313e4e3967b12cfe0aa6bbf46`. Museum PR #64 merged as
  canonical main `53f449dfbee4dc30cf7ccbc18f8a0ed36da65cdd`; exact PR validation run
  `32131079246` succeeded across the full validator, public-publication checks,
  focused Stream/catalog checks, and deterministic Ubuntu and Windows suites.
- The first production-build screenshot corpus at frontend candidate `98c7fbab`
  was rejected by all three independent reviewers. It is superseded and must
  not be cited as release evidence.
- Blocking findings from that review have been corrected locally: all five
  Magnum works now use hash-pinned 640 and 1280 pixel display copies; the
  Conflict page resolves the catalogue essay; acquisition counts and labels
  are accurate; visitor manuscripts precede technical context; and identified
  formulaic copy was revised in the canonical Museum source.
- Frontend PR #3753 is open on branch `codex/museum-research-editorial`.
  Exact head `db3c2dce68b67237d11441c6b5cfa2b8692602b8` was pushed after
  the v15 full-page acceptance gate. Any successor must repeat the production
  build, 33-capture corpus, and all three independent reviews before push.
- Exact local runtime commit `850d993d378e69ace069a4844a844b28223669ce`
  fixes the canonical data-architecture route after the v9 copy and curatorial
  reviewers correctly blocked release: the visible non-adoption status had
  been tested on a shadowed dynamic route rather than the route visitors see.
  The production route now renders `Working standard; not adopted policy`, and
  its own route test requires the label to be visible.
- The blocked v9 corpus remains at
  `C:\Users\Administrator\.codex\artifacts\museum-research-prepr\candidate-f090b9b71-source-cd67a9cb2cba-canonical-8a2918b2be6c-v9`.
  Its UX reviewer passed the complete 33-image set; its copy and curatorial
  reviewers both blocked screenshots 07, 18, and 29 for the missing status.
  This is preserved as negative evidence and must not be cited as release
  acceptance. A clean production build, a new exact-head 33-image corpus, and
  three fresh independent PASS decisions are required before push.

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

Museum PR #64 is merged at canonical main
`53f449dfbee4dc30cf7ccbc18f8a0ed36da65cdd`. Its frozen candidate
`0a0545181daa07761e6aeaf30788db842fa68f58` received an independent APPROVE
verdict with no blocking findings. The activated publication catalog reads
reviewed commit `75171e81587c9da313e4e3967b12cfe0aa6bbf46`. The final canonical
whole-release manifest is
`sha256:d71c5be183dcccac3a279b8c9a8383d5a38600a69ddcf2c87ebbb42379c935d1`
with Keccak commitment
`0xc38cab32167f158a520fa49842594a954c0c30dc082328918cf70c5568cd8cc2`.

Frontend PR #3753 remains open. The local branch includes the final Research
copy, current frontend main `385771000528b5c5bc41da3f937b29020c1c0cb9`,
the exact canonical Museum pins, and a Research-only correction that keeps the
item-level source link visible for public-domain editorial illustrations. The
current post-merge Museum regression surface passes 81 suites and 604 tests,
with one suite and 17 tests intentionally skipped; changed lint, changed
typecheck, and the Windows-safe diff check also pass. The resulting exact frontend head
must now pass a clean production build, 33 full-page captures across all 11
Research routes at 1440, 820, and 390 pixels, and three fresh independent
curatorial, visual/UX, and copy reviews before it is pushed. Any later
pixel-affecting change repeats that gate. The release then proceeds through
exact-head PR checks, staging deployment and retained browser sweep, followed
by production deployment and live 11-route verification.

Candidate `bbb62eae45548bfab9b7a7d265146fad33c28075` completed its clean
production build and deterministic 33-image corpus with zero transport,
overflow, media, fallback, console, or page errors. Curatorial and visual/UX
review passed. Copy review blocked the candidate because one exact submitted
title typo and its editorial note were visible, and the shared source strip
printed a raw commit fragment. The replacement keeps the submitted title and
exact commit in the governed record and immutable links while using a corrected
visitor title and ordinary museum language in the interface. Focused tests pass;
the replacement exact build, corpus, and three-review gate now remain.
