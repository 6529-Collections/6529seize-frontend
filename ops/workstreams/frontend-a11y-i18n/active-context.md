# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-lab-cards-a11y-i18n`

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
  tabs/focus links, then Meme Lab browse and collection cards.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Re-check CodeRabbit, Snyk, and SonarCloud on the PR #2608 bot-feedback head.
2. Leave PR #2608 review-ready only; do not merge it.
3. If #2608 remains bot-happy, start the next safe media-card surface.
4. Iterate with CodeRabbit, Claude if available, and CI feedback without
   merging page-change PRs.
