# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/the-memes-references-a11y-i18n`

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
- Current implementation surface: The Memes References tab, stacked on PR
  #2618. The branch is `codex/the-memes-references-a11y-i18n`; local
  validation passed and PR publication is next. The PR must be review-ready
  only.
- Scope includes passing the active detail-page locale into References,
  routing Meme Lab/ReMemes descriptions, logo alt text, sort trigger/options,
  refresh labels, empty state, ReMeme card accessible names, locale-preserving
  ReMeme links, and replica counts through progressive messages/formatters.
- Meme Lab referenced card copy comes from the shared ReMeme references grid
  and receives the active locale. ReMeme names, collection names, token IDs, and
  source NFT metadata remain source-data copy.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open a stacked review-ready PR against PR #2618 and trigger available bots.
2. Iterate on actionable CodeRabbit/Claude/CI feedback.
3. Keep page implementation PRs review-ready only; do not merge without human
   approval.
4. Preserve the unrelated dirty EmojiContext and bootstrap style files.
