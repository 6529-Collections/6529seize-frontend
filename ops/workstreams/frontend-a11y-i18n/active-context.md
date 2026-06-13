# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/user-collected-details-tables-a11y-i18n`

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
  fix; keep it unmerged without human approval.
- PR #2625 is bot-happy on the latest head and remains review-ready only.
- PR #2626 is bot-happy on the latest head and remains review-ready only.
- PR #2627 remains review-ready only with a bot-happy latest head.
- PR #2628 is bot-happy on the latest head and remains review-ready only.
- PR #2629 is bot-happy on the latest head and remains review-ready only.
- PR #2630 is bot-happy on the latest head and remains review-ready only.
- PR #2631 is bot-happy on the latest head and remains review-ready only.
- PR #2633 is bot-happy on the latest head and remains review-ready only.
- Current implementation surface: profile collected details tables under the
  expanded stats panel are complete in PR #2633. The branch is
  `codex/user-collected-details-tables-a11y-i18n`, stacked from PR #2631.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Start the next low-risk profile/media surface from PR #2633 after confirming
   the target component boundaries.
2. Maintain PRs #2633, #2631, #2630, #2629, and #2628 as review-ready only;
   do not merge without human approval.
3. Maintain PRs #2626 and #2627 as review-ready only; do not merge without
   human approval.
4. Keep all page implementation PRs review-ready only; do not merge without
   human approval.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
