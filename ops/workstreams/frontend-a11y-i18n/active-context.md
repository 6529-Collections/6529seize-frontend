# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-calendar-grid-a11y-i18n`

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
- Current implementation surface: `/meme-calendar` lower grid/control pass,
  stacked on PR #2621. The branch is
  `codex/meme-calendar-grid-a11y-i18n`; PR #2622 is open and review-ready only.
- Scope includes lower-calendar zoom/guide/navigation/jump controls, default
  SZN month labels, mint-day accessible names, mint numbers/ranges, and
  calendar invite link/event labels through progressive messages/formatters.
- Higher-level lower-calendar drilldown cards (`Year`, `Epoch`, `Period`,
  `Era`, `Eon`) remain a deferred localization surface.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Confirm PR #2622 checks and bot feedback after the latest push.
2. Iterate on actionable CodeRabbit/Claude/CI feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
