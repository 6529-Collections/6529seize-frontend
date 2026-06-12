# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/rememes-browse-card-followup-a11y-i18n`

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
- PR #2623 is bot-happy on the latest head and remains review-ready only.
- Current implementation surface: `/rememes` browse-card follow-up, stacked on
  PR #2623. The branch is
  `codex/rememes-browse-card-followup-a11y-i18n`.
- Scope includes labelled results-list semantics for browse cards,
  locale-preserving Add ReMeme navigation, and missing-image fallback hardening
  for Rememe cards.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish validation for the `/rememes` browse-card follow-up.
2. Open a review-ready stacked PR against PR #2623.
3. Iterate on actionable CodeRabbit/Claude/CI feedback.
4. Keep page implementation PRs review-ready only; do not merge without human
   approval.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
