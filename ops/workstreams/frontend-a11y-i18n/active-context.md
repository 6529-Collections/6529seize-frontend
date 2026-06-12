# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-activity-a11y-i18n`

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
- Current implementation surface: The Memes Card Activity tab, stacked on PR
  #2613. PR #2613 is bot-happy on latest head `0b79960`, review-ready only, and
  must not be merged without human approval.
- Scope includes message-backed activity headings, transaction-type dropdown
  labels/options, volume labels, loading and empty states, a hidden activity
  table caption, and locale-aware ETH volume formatting.
- Shared `LatestActivityRow` transaction copy/date formatting and shared
  pagination copy remain deferred activity-surface debt.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open a review-ready PR stacked on PR #2613.
2. Trigger available review bots and iterate on actionable feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
