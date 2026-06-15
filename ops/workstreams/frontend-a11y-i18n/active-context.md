# Active Context

## Current Goal

Maintain the existing review-ready WCAG/i18n implementation stack, harden it
bottom-up where safe, and build durable inventory for the next stack. Do not
merge page implementation PRs.

## Current Branch

`codex/user-about-edit-a11y-i18n`

## Constraints

- Preserve unrelated dirty files:
  - `__tests__/components/nft-image/RememeImage.test.tsx`
  - `contexts/EmojiContext.tsx`
  - `__tests__/contexts/EmojiContext.test.tsx`
  - `styles/seize-bootstrap.scss`
- Use `6529` wrapper commands for project checks.
- Use signed commits with the configured Git identity.
- Merge only the standards PR when bot-happy and branch protection allows.
- Do not merge page implementation PRs.

## Defaults

- WCAG target: WCAG 2.2 AA.
- Source locale: `en-US`.
- Initial supported locales: `en-US`, `en-GB`, `fr-FR`, `es-ES`, `de-DE`.
- PR #2623 is bot-happy on the latest head and remains review-ready only.
- PR #2624 is open and review-ready only after the CodeRabbit video-fallback
  fix; keep it unmerged.
- PR #2625 is bot-happy on the latest head and remains review-ready only.
- PR #2626 is bot-happy on the latest head and remains review-ready only.
- PR #2627 remains review-ready only with a bot-happy latest head.
- PR #2628 is bot-happy on the latest head and remains review-ready only.
- PR #2629 is bot-happy on the latest head and remains review-ready only.
- PR #2630 is bot-happy on the latest head and remains review-ready only.
- PR #2631 is bot-happy on the latest head and remains review-ready only.
- PR #2633 is bot-happy on the latest head and remains review-ready only.
- PR #2634 is bot-happy on the latest head and remains review-ready only.
- PR #2635 is bot-happy on the latest head and remains review-ready only.
- PR #2636 is bot-happy on the latest head and remains review-ready only.
- PR #2637 is bot-happy on the latest head and remains review-ready only.
- PR #2638 is bot-happy on the latest head and remains review-ready only.
- PR #2639 is bot-happy on the latest head and remains review-ready only.
- PR #2640 is bot-happy on the latest head and remains review-ready only. It
  covers profile shell tab titles, beta badge text, navigation landmark labels,
  scroll button labels, and active-page semantics. It is stacked from PR #2639
  and must not be merged.
- PR #2641 is bot-happy on the latest head and remains review-ready only. It
  covers the profile followers modal title, follower list label, loading
  status, nullable follower handle fallback, follower profile link names,
  avatar alt text, and semantic list structure. It is stacked from PR #2640 and
  must not be merged.
- PR #2642 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header stats row labels, accessible names, and
  follower-count formatting. It is stacked from PR #2641 and must not be
  merged.
- PR #2643 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header identity/name/media labels, profile-enabled
  date formatting, and read-only wrapper semantics. It is stacked from PR #2642
  and must not be merged.
- PR #2644 is bot-happy on the latest head and remains review-ready only. It
  covers the user profile header About statement placeholder, add/edit controls,
  mobile expand/collapse toggle, and nested-interactive-control cleanup. It is
  stacked from PR #2643 and must not be merged.
- PR #2645 is open and review-ready only. It covers the user profile About edit
  form labels, placeholder, character count, actions, success toast, moderation
  errors, alert semantics, and error-dismiss name. It is stacked from PR #2644
  and must not be merged.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.
- 2026-06-13 stack audit: PR #2604 and PRs #2607-#2645 are open, non-draft,
  mergeable, and green on the visible GitHub check rollup.
- Related-looking open PR #2597 is older OG metadata work, not part of this
  WCAG/i18n stack.
- Open PR #2632 is separate 6529bot admin dashboard work, not part of this
  WCAG/i18n stack.
- 2026-06-14 bottom-stack pass: PR #2604 received a passive scroll listener
  hardening commit (`23d119e`) and local validation/browser smoke passed.
  GitHub's visible latest-head rollup is green and a validation snapshot was
  posted on the PR. CodeRabbit's new incremental review was rate-limited, but
  prior actionable CodeRabbit findings are already fixed in the current code.
- 2026-06-14 audit inventory: `audit-inventory.md` records candidate hotspots
  for static copy, interaction semantics, locale formatting, image alt review,
  and i18n helper adoption.

## Next Actions

1. Hold new page PR creation until the existing stack is reviewed.
2. Keep PR #2604 and PRs #2607-#2645 review-ready only; do not merge without
   human approval.
3. If asked to advance the stack, continue bottom-up from PR #2607 after the
   #2604 validation snapshot.
4. Preserve the unrelated dirty EmojiContext, RememeImage test, and bootstrap
   style files.
