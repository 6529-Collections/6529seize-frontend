# Active Context

## Current Goal

Deliver the standards and repo-local skill foundation, then start review-ready
page migration PRs for safe media surfaces.

## Current Branch

`codex/meme-lab-distribution-a11y-i18n`

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
- Current implementation surface: Meme Lab distribution route and shared
  distribution UI, stacked on the bot-happy Meme Lab detail PR.
- Scope includes optional locale parsing for `/meme-lab/{id}/distribution` and
  `/the-memes/{id}/distribution`, message-backed distribution copy, locale-aware
  table counts, meaningful distribution photo alt text, scoped wallet table
  headers, and locale-preserving distribution links from detail pages.
- Full locale-prefixed routing is deferred.

## Next Actions

1. Open review-ready PR stacked on PR #2611.
2. Observe CodeRabbit, Claude if available, Snyk, SonarCloud, DCO, and CodeQL
   if triggered.
3. Address valid bot/CI feedback with focused signed follow-up commits.
4. Do not merge the distribution page PR without human approval.
