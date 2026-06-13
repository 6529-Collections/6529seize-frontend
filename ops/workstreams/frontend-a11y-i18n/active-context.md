# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/user-collected-network-cards-a11y-i18n`

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
- PR #2625 is bot-happy on the latest head and remains review-ready only.
- PR #2626 is bot-happy on the latest head and remains review-ready only.
- Current implementation surface: profile collected network card list
  semantics, stacked on PR #2626. The branch is
  `codex/user-collected-network-cards-a11y-i18n`; PR #2627 is bot-happy on the
  latest head and remains review-ready only.
- Scope includes labelled list/listitem semantics, message-backed copy, and
  message-backed image alternatives for network `/{user}/collected` card
  results, while preserving pagination behavior.
- Non-source locales currently fall back to `en-US` until reviewed
  translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Start the next low-risk read-only profile or media card surface from PR
   #2627.
2. Iterate on actionable CodeRabbit/Claude/CI feedback for the next PR.
3. Keep PR #2626 and PR #2627 review-ready only; do not merge without human
   approval.
4. Keep page implementation PRs review-ready only; do not merge without human
   approval.
5. Preserve the unrelated dirty EmojiContext and bootstrap style files.
