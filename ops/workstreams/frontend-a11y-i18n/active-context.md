# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/frontend-a11y-i18n-standards`

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

1. Publish and merge standards PR if allowed.
2. Create first implementation branch for The Memes list card.
3. Bootstrap local services before UI verification.
4. Iterate implementation PRs with bots and leave them review-ready.
