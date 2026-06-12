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

1. Re-check CodeRabbit, Snyk, and SonarCloud on PR #2609.
2. Address valid bot/CI feedback on PR #2609.
3. Leave PR #2609 review-ready only; do not merge it.
4. Iterate with CodeRabbit, Claude if available, and CI feedback without
   merging page-change PRs.
