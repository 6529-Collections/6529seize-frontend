# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-lab-detail-a11y-i18n`

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
- Current implementation surface: Meme Lab detail route tabs, detail metadata,
  reference links, collectors metrics, and locale-preserving tab/back links,
  stacked on the bot-happy Rememe detail PR.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Observe PR #2611 bot/check results: CodeRabbit, Claude if available, Snyk,
   SonarCloud, DCO, and CodeQL if triggered.
2. Address valid bot/CI feedback with focused signed follow-up commits.
3. Leave the Meme Lab detail PR review-ready only; do not merge it.
