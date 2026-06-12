# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-timeline-a11y-i18n`

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
- Current implementation surface: shared timeline labels/dates and The Memes
  Timeline tab, stacked on PR #2614. PR #2614 is bot-happy on latest head
  `45caff7`, review-ready only, and must not be merged without human approval.
- Scope includes The Memes timeline region labeling, locale-aware UTC timeline
  date formatting, message-backed URI/TXN link labels and accessible names, and
  shared change field labels.
- Timeline media alt text, iframe titles, raw metadata values, event text, and
  deeper media semantics remain deferred shared-timeline debt.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open a review-ready PR stacked on PR #2614.
2. Trigger available review bots and iterate on actionable feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
