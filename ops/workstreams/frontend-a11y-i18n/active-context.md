# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/rememes-cards-a11y-i18n`

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
- Current implementation surface: Rememes browse cards, stacked on the
  bot-happy Meme Lab card PR.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish focused validation for the Rememes browse card implementation.
2. Browser-smoke `/rememes?locale=de-DE` on desktop and mobile.
3. Open a review-ready stacked Rememes PR against PR #2608.
4. Iterate with CodeRabbit, Claude if available, and CI feedback without
   merging page-change PRs.
