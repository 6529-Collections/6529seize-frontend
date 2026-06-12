# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-calendar-drilldown-a11y-i18n`

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
- Current implementation surface: `/meme-calendar` lower drilldown card pass,
  stacked on PR #2622. The branch is
  `codex/meme-calendar-drilldown-a11y-i18n`; PR is pending.
- Scope includes higher-level lower-calendar drilldown card titles, date
  ranges, mint ranges, accessible button names, and focus-visible behavior for
  `Year`, `Epoch`, `Period`, `Era`, and `Eon` views.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish the `/meme-calendar` drilldown card slice.
2. Run focused calendar/i18n checks and browser smoke on the live frontend.
3. Open a review-ready stacked PR against PR #2622 and iterate bots.
4. Keep page implementation PRs review-ready only; do not merge without human
   approval.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
