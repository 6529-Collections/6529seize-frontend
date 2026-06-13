# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/memelab-browse-card-a11y-i18n-followup`

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
- PR #2624 is open and review-ready only after the CodeRabbit video-fallback
  fix; keep it unmerged without human approval.
- Current implementation surface: Meme Lab browse/collection card list
  semantics follow-up, stacked on PR #2624. The branch is
  `codex/memelab-browse-card-a11y-i18n-followup`; PR #2625 is open and
  review-ready only.
- Scope includes labelled list/listitem semantics for Meme Lab browse,
  artist-grouped, collection-grouped, and collection-route card grids, plus
  locale-preserving grouped collection `view` links.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Confirm PR #2624 checks and bot feedback after the latest push.
2. Iterate on actionable CodeRabbit/Claude/CI feedback.
3. Confirm PR #2625 checks and bot feedback after the latest push.
4. Keep page implementation PRs review-ready only; do not merge without human
   approval.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
