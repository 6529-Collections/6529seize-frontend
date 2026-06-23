# Reviewbot Production Manager

## Charter

Own the frontend side of `6529bot` production operations and dashboard work.
Use this workstream when coordinating the 6529.io public usage dashboard,
private operator dashboard, reviewbot API contract changes, production dogfood
evidence, or reviewbot rollout follow-up.

## Reload Order

1. `ops/skills/6529-autonomous-manager/SKILL.md`
2. this file
3. `active-context.md`
4. `run-log.md`
5. relevant `ops/docs/open-data/` and `ops/docs/api-tool/` pages
6. current PRs and CI for touched frontend or reviewbot branches

## Owned Paths

- `app/open-data/6529bot/`
- `app/tools/6529bot/admin/`
- `components/reviewbot-usage/`
- `components/reviewbot-admin/`
- `config/reviewbotUsageEnv.ts`
- `services/reviewbot-usage-api.ts`
- `services/reviewbot-admin-api.ts`
- `__tests__/services/reviewbot-usage-api.test.ts`
- `__tests__/services/reviewbot-admin-api.test.ts`
- `ops/docs/open-data/feature-6529bot-usage.md`
- `ops/docs/api-tool/feature-6529bot-admin.md`
- this workstream folder

## Forbidden Paths

- Secrets, wallet allowlists, HMAC values, provider keys, AWS credentials, and
  production-only URLs outside public docs.
- Unrelated frontend a11y/i18n workstream files unless explicitly coordinating
  with that workstream.
- Generated API models unless regenerated from source.

## Evidence Standard

Every closeout should include:

- changed files or PR links;
- focused `6529` validation commands;
- CI and review-bot state when a PR is opened;
- any skipped browser, staging, or production validation with reason;
- remaining production risks and concrete next action.

## Escalation Triggers

- New admin auth behavior, wallet allowlist semantics, or HMAC signing changes.
- Production deployment, staging deployment, or merge decisions.
- Any finding that suggests browser exposure of server-only admin data.
- Any reviewbot API contract change that is not backward-compatible.
