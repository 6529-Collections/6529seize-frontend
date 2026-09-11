# Network Museum Visual Release Acceptance

## Purpose

The 6529 Network Museum is judged as a museum, a publication, and a public
website. Code review and automated browser checks cannot establish that a page
is visually coherent, editorially finished, or worthy of the art it presents.
Every visible Museum change therefore has a human-readable, image-based release
gate before a pull request is opened.

This is a blocking standard. It applies even when unit tests, Playwright checks,
accessibility checks, and production builds pass.

## Scope

Apply this gate to every changed public route under `/museum/network` when the
change can affect layout, media, typography, copy, navigation, status language,
or visual hierarchy. Include every changed route and every distinct route
template affected by a shared component.

Do not substitute a representative route when the visible content differs in a
way that can expose different image proportions, text lengths, tables, source
notes, empty states, or relationship panels.

## Pre-PR Gate

A Museum visual PR must not be opened until all of the following are complete:

1. Build the exact proposed head with the production build command.
2. Render that build locally. Do not use a development build for final evidence.
3. Capture each changed route as a complete page at these viewports:
   - desktop: `1440 x 1000`
   - tablet: `820 x 1000`
   - mobile: `390 x 844`
4. Use full-page captures. A viewport crop, component story, DOM snapshot, or
   screenshot of the first screen is insufficient.
5. Record the exact commit, route, viewport, screenshot SHA-256, capture time,
   browser, rendered source commit, and any media fallback state in an evidence
   manifest.
6. Assemble a route contact sheet for each viewport so reviewers can evaluate
   balance and repetition across the section, not only one page at a time.
7. Send the exact screenshot set to three independent adversarial reviewers:
   - **Museum and curatorial review:** art hierarchy, institutional accuracy,
     status language, captioning, rights presentation, scholarship, and whether
     the page is credible as a museum publication.
   - **Visual and UX review:** composition, pacing, image choice and repetition,
     typography, line length, spacing, boxes and borders, responsive behavior,
     navigation, discoverability, and interaction clarity.
   - **Copy and editorial review:** factual precision, plain museum language,
     title and label hierarchy, repetition, unsupported claims, internal jargon,
     machine identifiers, clipped source prose, and LLM-style abstraction.
8. Each reviewer must receive the route list, the release intent, and the exact
   screenshot hashes. Reviewers must return route-specific findings with a
   blocking or non-blocking disposition. A summary without looking at the
   screenshots does not count.
9. Resolve every blocking finding, rebuild when code or copy changes, recapture
   every affected page, and repeat the relevant reviews against the new hashes.
10. Retain prompts, screenshot manifests, reviewer findings, resolutions, and
    final accepted hashes in the active Museum workstream.

Only the final accepted screenshot set may be cited in the PR. Earlier captures
must be marked superseded rather than silently reused.

## Required Automated Checks

The adversarial review sits above, not instead of, deterministic checks. The
pre-PR evidence must also show:

- no horizontal overflow at all three viewports;
- no clipped headings, body copy, captions, tables, or controls;
- no unresolved principal media or unexplained fallback panels;
- no repeated primary image within the reviewed route set unless the repetition
  is an explicit curatorial decision recorded in the evidence;
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

After merge, repeat complete-page captures of the changed route set on staging
at desktop and mobile. Run browser E2E and resolve any divergence before the
production deployment.

After production deployment, capture and inspect every changed route again at
desktop and mobile. Compare live screenshots with the final accepted local
evidence and confirm the exact deployed version. A successful workflow, HTTP
200, or DOM assertion is not a visual acceptance result.

## Claims

Do not write “visual QA passed,” “museum-quality,” “production-ready,” or an
equivalent claim unless the exact evidence above exists for the exact reviewed
head. If any part of the gate was not performed, state that plainly and keep the
release unqualified.
