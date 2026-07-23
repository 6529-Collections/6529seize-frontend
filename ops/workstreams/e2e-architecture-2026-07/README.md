# E2E Architecture Campaign (2026-07)

## Mission

Make E2E coverage manifest-driven and self-updating: one pack registry
(`tests/packs.manifest.ts`) generating scripts/workflow lists, one routes
manifest classifying every app route, a generated crawl pack, pseudo-locale
and axe-baseline rails for the i18n and WCAG 2.2 AA campaigns, real
write-path verification on staging, and real-device cadence on Device Farm.

## Workstreams

| # | PR | Done means |
| --- | --- | --- |
| 1 | Device Farm cron split | daily web pack, weekly native pack |
| 2 | Pack manifest foundation | manifest + sync + runner + drift gate live; staging workflow migrated |
| 3 | Prod daily canary | production readonly packs on daily cron |
| 4 | Selector lint | role/label/testid lint on new specs |
| 5 | Routes manifest | 287 routes classified; unclassified = red |
| 6 | Crawl pack | every crawlable route render-checked per staging deploy |
| 7 | Pseudo-locale | runtime en-XA + parity checks + crawl assertions |
| 8 | Axe ratchet | tests/a11y-baseline.json = WCAG thread worklist |
| 9 | WebKit mobile | web-mobile-webkit on staging smoke/surfaces |
| 10 | Safety classes + staging writes | composer write journey green on staging |
| 11 | Device Farm post-deploy + pages | prod deploys trigger web pack; curated generated pages |
| 12 | Flake quarantine | expiring quarantine annotations enforced |

## User-approved policies

- Merge each PR once CI + bots + 6529bot lanes are green and material
  feedback is addressed.
- Escalate instead of merging when a lane blocks on judgment, a change goes
  beyond the planned deploy-workflow diffs, or production secrets are needed.
- Human-gated: `MOBILE_REPO_TOKEN` secret; staging synthetic-identity secret.

## Hard conventions

- Worktree: sibling dir `6529seize-frontend-e2e-arch` (never
  `.claude/worktrees`); commands via `./bin/6529`; DCO signoff on every
  commit; validation manifest for Level-3+ PRs.
- Coordination: the i18n maturity campaign (URL locale routing) and the WCAG
  2.2 AA campaign consume these rails — routes stay locale-orthogonal; the
  axe baseline is the WCAG worklist.

## Reload order

1. This README
2. `active-context.md`
3. `run-log.md`
