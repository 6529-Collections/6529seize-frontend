# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-calendar-overview-a11y-i18n`

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
- Current implementation surface: `/meme-calendar` overview shell, stacked on
  PR #2620. The branch is `codex/meme-calendar-overview-a11y-i18n`; the PR is
  expected to be review-ready only.
- Scope includes reading the optional `locale` query on `/meme-calendar`,
  routing the timezone toggle, overview heading/full-calendar link, next-mint
  controls/headings/countdown labels, screenshot label, upcoming-card
  heading/empty state, mint numbers, and calendar invite link accessible names
  through progressive messages/formatters.
- The lower custom calendar grid remains a deferred localization surface.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish validation for `codex/meme-calendar-overview-a11y-i18n`.
2. Open the stacked review-ready PR.
3. Trigger available review bots on the new PR.
4. Iterate on actionable CodeRabbit/Claude/CI feedback.
5. Keep page implementation PRs review-ready only; do not merge without human
   approval.
6. Preserve the unrelated dirty EmojiContext and bootstrap style files.
