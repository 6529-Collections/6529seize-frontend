# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-card-a11y-i18n`

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

1. Open implementation PR for The Memes list card.
2. Iterate with CodeRabbit, Claude if available, and CI.
3. Leave implementation PR review-ready only; do not merge it.
4. Prepare The Memes detail tabs/focus-links follow-up after PR 1 is bot-happy.
