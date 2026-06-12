# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-calendar-periods-a11y-i18n`

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
- Current implementation surface: The Memes header calendar period strip,
  stacked on PR #2619. The branch is
  `codex/meme-calendar-periods-a11y-i18n`; the PR is expected to be
  review-ready only.
- Scope includes passing the active detail-page locale into the period strip,
  routing season/period labels and accessible names through source messages,
  formatting period numbers through locale-aware helpers, preserving locale on
  season links, giving the secondary period cluster a labelled group, and
  keeping the season link at a 24px minimum target with visible focus.
- Period labels currently fall back to `en-US` for non-source locales until
  reviewed translations are added.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open the stacked review-ready PR for
   `codex/meme-calendar-periods-a11y-i18n`.
2. Iterate on actionable CodeRabbit/Claude/CI feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
