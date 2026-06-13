# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/user-collected-distributions-a11y-i18n`

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
- PR #2638 is open and review-ready only. It covers profile collected
  Distributions heading, empty state, table labels, collection links, and table
  item formatting under the expanded stats panel. It is stacked from PR #2637
  and must not be merged.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Iterate on PR #2638 with available bots/checks without merging.
2. Maintain PRs #2635, #2634, #2633, #2631, #2630, #2629, and #2628 as review-ready only;
   do not merge.
3. Maintain PRs #2626 and #2627 as review-ready only; do not merge.
4. Keep all page implementation PRs review-ready only; do not merge.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
