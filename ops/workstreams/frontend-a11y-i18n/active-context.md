# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/user-collected-tdh-history-a11y-i18n`

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
- The current branch covers profile collected TDH History heading, loading and
  empty states, chart labels, chart accessible names, locale-formatted chart
  date/value labels, and stable chart keys. It is stacked from PR #2638 and
  must not be merged once opened.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Commit and open the TDH History stacked PR against PR #2638.
2. Iterate on the TDH History PR with available bots/checks without merging.
3. Maintain PRs #2638, #2637, #2636, and earlier page PRs as review-ready only;
   do not merge.
4. Preserve the unrelated dirty EmojiContext, RememeImage test, and bootstrap
   style files.
