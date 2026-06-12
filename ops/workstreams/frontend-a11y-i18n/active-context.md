# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-live-stats-a11y-i18n`

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
- Current implementation surface: The Memes Overview live stats/details panel,
  stacked on the bot-happy distribution PR. PR #2612 is bot-happy and
  review-ready only. PR #2613 is open for the live-stats slice and must not be
  merged without human approval.
- Scope includes message-backed live-stat labels, locale-aware creator/mint date
  labels, counts, ranks, percentages, market numbers, additional-details control
  copy, and locale threading through the shared Collectors stats component.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Observe PR #2613: CodeRabbit, Claude if available, Snyk, SonarCloud, DCO,
   and CodeQL if triggered.
2. Address valid bot/CI feedback with focused signed follow-up commits.
3. Do not merge the live-stats page PR without human approval.
