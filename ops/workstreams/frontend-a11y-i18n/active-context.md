# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/timeline-media-a11y-i18n`

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
- Current implementation surface: shared Timeline media semantics, stacked on
  PR #2615. PR #2615 is bot-happy on latest head `bd8ba44`, review-ready only,
  and must not be merged without human approval.
- Scope includes message-backed Timeline image alt text, video accessible
  labels, HTML iframe titles, and passing the active locale/change label into
  shared timeline media previews.
- Timeline event text and deeper media semantics remain deferred
  shared-timeline debt.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open a review-ready PR stacked on PR #2615.
2. Trigger available review bots and iterate on actionable feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
