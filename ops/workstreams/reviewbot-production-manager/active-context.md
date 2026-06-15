# Active Context

First file to read after compaction: this file.

## Current Goal

Operate the reviewbot production/frontend workstream through
`6529-autonomous-manager`: keep the 6529.io dashboards aligned with the live
reviewbot API, preserve evidence, and drive PRs through validation instead of
one-off patches.

## Current Branch

- Frontend branch: `codex/reviewbot-cost-dashboard`
- Base: `origin/main`
- Reviewbot API PR #356 was merged as `cd15219` and adds derived usage
  analysis fields.

## Current Local Changes

- Shared reviewbot usage schema accepts:
  - `uniquePrs`
  - `averageCostPerReviewRunUsd`
  - `averageCostPerPrUsd`
  - `analysis`
  - admin `byPrAuthor`
  - enriched admin `byPr` rows.
- Public `/open-data/6529bot` dashboard shows unique PRs, average costs, and
  cost-analysis highlights.
- Private `/tools/6529bot/admin` dashboard shows unique PRs, average costs,
  cost-analysis highlights, PR-author table, and enriched PR rows.
- Service tests and docs are being updated for the expanded API contract.

## Constraints

- Use the repo-local `6529` wrapper for project commands.
- Preserve unrelated dirty work in other frontend worktrees.
- Keep admin secrets and wallet allowlist values out of public artifacts.
- Do not merge or deploy frontend PRs unless explicitly in merge/staging/prod
  mode and gates pass.

## Evidence So Far

- Read `AGENTS.md`.
- Read `ops/skills/6529-autonomous-manager/SKILL.md`.
- Read `ops/skills/write-prs/SKILL.md`.
- Read relevant Next docs for Server Components, data fetching, pages,
  cookies, and fetch.
- Confirmed old `codex/reviewbot-admin-dashboard` branch corresponds to merged
  frontend PR #2632 and created fresh branch from `origin/main`.
- Reviewbot PR #356 passed local release checks, CI, Dependency Review, and was
  merged.
- On this EC2 Windows host, direct wrapper validation needed explicit guarded
  command fallbacks:
  - `bin\6529.cmd` handed a Windows path to `bash` and failed;
  - `bash ./bin/6529 ...` hit CRLF parsing in `bin/6529`;
  - `pnpm run format:changed` and `pnpm run lint:changed` passed the
    `SEIZE_6529_COMMAND` guard but failed where their shell pipelines require
    `xargs`.

## Next Actions

1. Finish frontend schema, UI, docs, and tests for the merged analysis fields.
2. Run focused validation with `SEIZE_6529_COMMAND=1` plus explicit-file
   fallbacks where Windows shell tooling blocks the wrapper scripts.
3. Open a frontend PR with review-ready evidence.
4. Wait for required CI and bot feedback.
5. If explicitly approved for merge mode, merge only after gates are green.

## Open Risks

- No component tests currently cover the rendered reviewbot dashboards; service
  tests cover parsing and server-side data loading.
- Browser verification is still needed after the frontend patch if visual
  layout risk looks non-trivial.
- Production dashboard environment values remain operator-owned deployment
  secrets.
