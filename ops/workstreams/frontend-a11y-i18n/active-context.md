# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-art-details-a11y-i18n`

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
- Current implementation surface: The Memes Art additional-details labels and
  Arweave link rows, stacked on PR #2617 and opened as PR #2618. PR #2618 is
  review-ready only and must not be merged without human approval.
- Scope includes passing the active detail-page locale into The Art details,
  routing section headings, metric labels, empty states, open/download labels,
  and download progress/completion states through progressive messages, and
  using locale-aware formatting for TDH and rank values.
- Property trait names/values, media URLs, and raw NFT metadata remain
  source-data copy; deeper media semantics remain deferred Art surface debt.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Trigger available review bots on PR #2618 and iterate on actionable
   feedback.
2. Keep page implementation PRs review-ready only; do not merge without human
   approval.
3. Preserve the unrelated dirty EmojiContext and bootstrap style files.
