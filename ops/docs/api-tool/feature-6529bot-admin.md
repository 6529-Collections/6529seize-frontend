# 6529bot Admin

Parent: [API Tool Index](README.md)

## Overview

`/tools/6529bot/admin` is a private operator dashboard for the central
`6529reviewbot` GitHub App.

The route renders on the server. It uses the existing `6529.io` wallet auth
cookie to verify the connected operator, then calls the bot backend with
short-lived HMAC admin headers. Browser clients receive rendered dashboard data
only.

## Location in the Site

- Route: `/tools/6529bot/admin`
- Navigation: direct URL only.

The page is intentionally not listed in the public sidebar. Direct route access
still fails closed when deployment configuration, wallet auth, or wallet
authorization is missing.

## Data Source

Set these server-side environment variables for deployments that should expose
the private operator view:

```text
REVIEWBOT_USAGE_API_BASE_URL=https://reviewbot.example
REVIEWBOT_USAGE_ADMIN_ALLOWED_WALLETS=0x...
REVIEWBOT_USAGE_ADMIN_AUTH_CHECK_URL=https://api.example/api/auth/check
REVIEWBOT_USAGE_API_ADMIN_HMAC_SECRET=
REVIEWBOT_USAGE_API_ADMIN_ROLES=reviewbot-admin
REVIEWBOT_USAGE_API_ADMIN_TTL_SECONDS=300
```

`REVIEWBOT_USAGE_API_BASE_URL` is shared with the public
`/open-data/6529bot` route. The other variables are admin-only. Endpoint path
variables are optional and default to the bot backend production contract:

- `REVIEWBOT_USAGE_API_ADMIN_SUMMARY_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_BUDGET_STATUS_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_MODEL_PRICE_STATUS_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_ALERT_STATUS_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_STATUS_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_JOB_EVENTS_PATH`
- `REVIEWBOT_USAGE_API_ADMIN_RUN_CLAIMS_PATH`

## Auth Flow

1. The server reads the existing 6529 wallet-auth cookie.
2. The wallet JWT must decode to an unexpired wallet subject.
3. The wallet subject must be present in
   `REVIEWBOT_USAGE_ADMIN_ALLOWED_WALLETS`.
4. The server verifies the wallet JWT against
   `REVIEWBOT_USAGE_ADMIN_AUTH_CHECK_URL`.
5. Only after those checks pass does the server sign requests to the bot backend
   with `x-6529-admin-*` HMAC headers.

The admin HMAC secret is never sent to the browser. The HMAC TTL is capped at
five minutes even if a larger value is supplied in deployment config.

## Dashboard Panels

The route shows:

- 30-day admin usage totals;
- unique PR count, average spend per review run, average spend per PR, budget
  skip rate, and token averages;
- top-cost requestor, PR author, and PR analysis with spend-share percentages;
- requestor, PR-author, repository, provider/model, review-kind, and
  pull-request usage tables;
- pull-request rows with PR author, latest head SHA, latest review timestamp,
  total spend, and average spend per review run;
- budget policy status;
- alert configuration status;
- model price catalog health;
- bot runtime status;
- recent dispatch failures;
- stale active run claims.

Each panel handles endpoint failures independently. If one bot admin endpoint is
unavailable, the page still renders the rest of the operator view.

## Empty And Error States

- Missing base URL, HMAC secret, auth-check URL, or wallet allowlist:
  `Admin Not Configured`.
- Missing, malformed, or expired wallet auth cookie:
  `Operator Sign-In Required`.
- Wallet auth succeeds but the wallet is not in the server-side allowlist:
  `Admin Access Restricted`.
- Individual bot endpoint failures render inline unavailable messages inside
  the affected panel.

## Security Notes

- The public repo contains only config names and placeholder values.
- Wallet allowlists and the HMAC secret belong in deployment secrets.
- `6529.io` does not query Aurora directly.
- The route calls the bot backend server-to-server after verifying 6529 wallet
  auth.
- The browser never receives AWS credentials, GitHub App secrets, provider
  keys, Aurora configuration, or the bot admin HMAC secret.

## Related Pages

- [API Tool Index](README.md)
- [6529bot Usage](../open-data/feature-6529bot-usage.md)
- [Open Data Hub](../open-data/feature-open-data-hub.md)
