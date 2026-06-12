# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-detail-a11y-i18n`

## Constraints

- Preserve unrelated dirty files:
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
- First implementation surface: The Memes list card, then The Memes detail
  tabs/focus links.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Monitor PR #2607 for CodeRabbit, Claude if available, and CI feedback.
2. Fix valid bot or CI findings on PR #2607.
3. Leave PR #2607 review-ready only; do not merge it.
4. Start adjacent safe media-card work only after PR #2604 and PR #2607 are
   bot-happy.
