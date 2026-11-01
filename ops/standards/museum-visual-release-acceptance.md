# Network Museum Visual Release Acceptance

## Purpose

The 6529 Network Museum is judged as a museum, a publication, and a public
website. Code review and automated browser checks cannot establish that a page
is visually coherent, editorially finished, or worthy of the art it presents.
Every visible Museum change therefore passes an image-based review before a
pull request is opened.

This is a blocking standard. It applies even when unit tests, Playwright checks,
accessibility checks, and production builds pass.

The gate runs the [frontend polish judge](frontend-polish-judge.md) loop with
the Museum profile. Three independent lens reviews share one findings ledger,
a frozen scope, and a stopping rule, so a review converges instead of raising
new taste-level blockers every round.

## Scope

Apply this gate to every changed public route under `/museum/network` when the
change can affect layout, media, typography, copy, navigation, status language,
or visual hierarchy. Include every changed route and every distinct route
template affected by a shared component.

Do not substitute a representative route when the visible content differs in a
way that can expose different image proportions, text lengths, tables, source
notes, empty states, or relationship panels.

## Pre-PR Gate

A Museum visual PR must not be opened until the judge scoring script returns
`accepted` for a Museum-profile run on the proposed head.

1. Pin a run record with `"profile": "museum"`, the in-scope routes, and the
   release intent. See the
   [`fe-polish-judge` skill](../skills/fe-polish-judge/SKILL.md).
2. Build the proposed head with the production build command and render that
   build locally. Do not use a development build.
3. Capture each in-scope route as a complete page at these viewports:
   - desktop: `1440 x 1000`
   - tablet: `820 x 1000`
   - mobile: `390 x 844`

   A viewport crop, component story, DOM snapshot, or screenshot of the first
   screen is insufficient.

4. Assemble a contact sheet for each viewport so reviewers can evaluate balance
   and repetition across the section, not only one page at a time.
5. Run three independent lens reviews. Each is a fresh-context judge that
   receives the run record, the captures, the contact sheets, and the current
   ledger:
   - **Curatorial:** art hierarchy, institutional accuracy, status language,
     captioning, rights presentation, scholarship, and whether the page is
     credible as a museum publication.
   - **Visual and UX:** composition, pacing, image choice and repetition,
     typography, line length, spacing, boxes and borders, responsive behavior,
     navigation, discoverability, and interaction clarity.
   - **Copy and editorial:** factual precision, plain museum language, title
     and label hierarchy, repetition, unsupported claims, internal jargon,
     machine identifiers, clipped source prose, and LLM-style abstraction.

   Each lens scores only the dimensions and checks it owns and files its
   findings on the shared ledger. A summary written without looking at the
   captures does not count.

6. Repair the required findings, rebuild, and rejudge under the judge's
   iteration rules. Findings stay on the ledger until resolved. A late blocker
   needs an admission reason: a regression, a previously missed P0 or P1, or a
   defect revealed by resolving an evidence gap. The loop stops on acceptance or
   when the repair budget runs out.
7. On later rounds, recapture and re-review only the routes the repair batch can
   affect, plus refreshed contact sheets. Carry the rest forward.
8. Keep the run directory (run record, captures, contact sheets, lens outputs,
   and scoring results) in the active Museum workstream.

A `threshold_not_reached` or `blocked` result means the PR is not opened.
Report the best candidate and its unresolved findings instead.

## Required Automated Checks

The lens reviews sit above, not instead of, deterministic checks. Before the
baseline review, the captured build must also show:

- no horizontal overflow at all three viewports;
- no clipped headings, body copy, captions, tables, or controls;
- no unresolved principal media or unexplained fallback panels;
- no repeated primary image within the reviewed route set unless the run record
  names the repetition as a curatorial decision;
- no nested or accidental box borders, card-within-card framing, broken image
  aspect ratios, or empty space created by a fixed-height container;
- readable type and line spacing at every viewport;
- keyboard-visible links and controls;
- no new browser console errors;
- no internal source paths or identifiers presented as public headlines;
- accurate public status for collection holdings, acquisitions, programs, and
  works in progress.

Automated checks may identify defects. They cannot decide that the page is
beautiful, editorially finished, or museum-quality.

## Staging And Production Readback

After the staging deployment and again after the production deployment,
spot-check the changed routes at desktop and mobile on that environment:
principal media loads, no fallback panels appear, the layout matches the
accepted captures, and the deployed version is the expected one. Automatic E2E
runs and reports separately; it does not gate the release. The lens review is
not repeated. Fix any divergence through the normal development-branch flow.

## Claims

Do not write “visual QA passed,” “museum-quality,” “production-ready,” or an
equivalent claim unless the gate accepted the reviewed head. Report the outcome
with the label the scoring script prints, currently `judge-accepted (partially
calibrated)`. If any part of the gate was not performed, state that plainly and
keep the release unqualified.
