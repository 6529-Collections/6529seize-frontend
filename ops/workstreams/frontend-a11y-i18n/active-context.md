# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-lab-cards-a11y-i18n`

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
- First implementation surface: The Memes list card, then The Memes detail
  tabs/focus links, then Meme Lab browse and collection cards.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Finish the Meme Lab browse/collection card PR from
   `codex/meme-lab-cards-a11y-i18n`.
2. Run focused lint, typecheck, react-doctor, and browser smoke on
   `/meme-lab` and `/meme-lab/collection/{collection}`.
3. Open the Meme Lab card PR stacked on PR #2607 and leave it review-ready only.
4. Iterate with CodeRabbit, Claude if available, and CI feedback without
   merging page-change PRs.
