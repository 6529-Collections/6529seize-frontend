# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/rememe-detail-a11y-i18n`

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
- Current implementation surface: Rememe detail tabs, metadata labels,
  reference cards, and locale-preserving links, stacked on the bot-happy
  Rememes browse-card PR.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Commit and open a review-ready Rememe detail PR stacked on PR #2609.
2. Trigger/observe CodeRabbit, Claude if available, Snyk, and SonarCloud.
3. Address valid bot/CI feedback.
4. Leave the Rememe detail PR review-ready only; do not merge it.
5. Continue safe media surfaces only after bot feedback is settled.
