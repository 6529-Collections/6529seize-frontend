# Public Contract Reviews

## Overview

Public Contract Reviews are source-pinned, versioned reading rooms for proposed
6529 contracts. They combine plain-language editorial pages with visible
evidence labels and exact source links so artists, community members, technical
reviewers, and auditors can examine the same candidate before deployment.

The first review covers 6529 Stream. Stream is not deployed, is pre-audit, and
is not presented as final or production-ready.

## Availability

The initial Stream review is enabled only on:

- local development at `localhost` or `127.0.0.1`
- the shared `staging.6529.io` host

It is disabled on production. When disabled:

- the NFT navigation does not show the review
- `/stream` and `/reviews/6529-stream*` return the standard not-found behavior
- review pages are excluded from the production sitemap
- review content and future staging discussion destinations are not rendered

Production activation requires a later reviewed configuration change.

## Entry Points

- `/reviews/6529-stream`: active review overview
- `/reviews/6529-stream/{page}`: one of fourteen active editorial pages
- `/reviews/6529-stream/versions/{version}`: versioned overview
- `/reviews/6529-stream/versions/{version}/{page}`: versioned editorial page
- `/stream`: gated convenience redirect to the active overview

When enabled, **NFTs > 6529 Stream — Review** appears after the live collection
links and before NFT Activity.

## What Readers See

Every page includes:

- a persistent status area showing **Public review**, **Not deployed**, and
  **Pre-audit**
- the review version and a link to the exact source snapshot
- page-level evidence labels
- navigation across fourteen stable pages
- an on-page contents list generated from the editorial headings
- previous and next page controls
- an evidence-label glossary

The overview also provides reading paths for community members, artists,
technical reviewers, and auditors.

## Evidence Labels

- **Implemented** means the behavior is present in the pinned Solidity source.
- **Tested** means retained automated tests exercise it; this is not a security
  guarantee.
- **Proposed** means a design or specification describes it but the pinned
  implementation does not fully provide it.
- **Open for feedback** identifies an active review decision.
- **Audit pending** means no completed external audit covers the candidate.
- **Deferred** identifies work intentionally outside the current target.
- **Known limitation** identifies a recorded constraint, gap, or unresolved
  risk.

## Editorial Content

Editorial source lives under
`content/public-reviews/6529-stream/versions/{version}/editorial/` as plain
UTF-8 Markdown. Active and historical routes both load from their exact
immutable version directory. The shell validates the editorial manifest
against the configured review version, source commit, page IDs, page titles,
and filenames before rendering, then derives stable on-page anchors from
level-two headings.

The shell, status, navigation, audience, evidence, and metadata copy use the
shared message system. The long-form Stream editorial is currently maintained
in `en-US` only and falls back to English for all supported locales. Localized
editorial versions are follow-up work; the English-only state must remain
visible in future language controls.

## Feedback Status

The review shell currently explains that structured feedback is being
connected. It does not contain a Wave identifier and does not submit feedback.
The reusable feedback transport, structured fields, code references, and
review-ledger views are separate delivery slices.

Until that module is enabled, readers should retain:

- the page URL
- the displayed review version
- the exact source link
- the relevant evidence label
- a concise expected-versus-observed description

## Failure and Recovery

- If the review is missing on production, that is the intended initial gate.
- If it is missing on staging, confirm the exact hostname is
  `staging.6529.io`; personal and lookalike hosts fail closed.
- If a page URL is unknown, use the overview contents rather than guessing a
  slug.
- If an on-page link misses its heading, report the page and heading text; the
  anchor is derived from the maintained Markdown.
- If the displayed source differs from a code link, stop relying on the page
  and report the mismatch. All review evidence must refer to one source
  snapshot.

## Related Pages

- [Public Contract Review Platform Specification](../specs/2026-07-26-public-contract-review-platform.md)
- [Web Sidebar Navigation](../navigation/feature-sidebar-navigation.md)
- [App Sidebar Menu](../navigation/feature-app-sidebar-menu.md)
