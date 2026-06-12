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
  review-ready only.
- Scope includes message-backed live-stat labels, locale-aware creator/mint date
  labels, counts, ranks, percentages, market numbers, additional-details control
  copy, and locale threading through the shared Collectors stats component.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish validation and open the The Memes live-stats PR stacked on PR #2612.
2. Keep page implementation PRs review-ready only; do not merge without human
   approval.
3. Preserve the unrelated dirty EmojiContext and bootstrap style files.
