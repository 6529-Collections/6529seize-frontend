# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/user-collected-stats-summary-a11y-i18n`

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
- Current implementation surface: profile collected stats summary is complete
  and bot-happy on PR #2631. The branch is
  `codex/user-collected-stats-summary-a11y-i18n`.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Start the next low-risk read-only profile/media surface from PR #2631.
2. Keep PR #2631 review-ready only; do not merge without human approval.
3. Keep PR #2630 review-ready only; do not merge without human approval.
4. Keep PR #2629 review-ready only; do not merge without human approval.
5. Keep PR #2628 review-ready only; do not merge without human approval.
6. Keep PR #2626 and PR #2627 review-ready only; do not merge without human
   approval.
7. Keep page implementation PRs review-ready only; do not merge without human
   approval.
8. Preserve the unrelated dirty EmojiContext and bootstrap style files.
